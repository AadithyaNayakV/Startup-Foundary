import asyncio
import logging
import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add parent directory to sys.path for standalone script execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import SessionLocal
from models import Startup
from services.scraper import execute_dual_stage_scrape
from kafka.consumer import KafkaConsumerWrapper
from kafka.manager import kafka_manager
from kafka.topics import KafkaTopics
from kafka.schemas import EventEnvelope

logger = logging.getLogger("foundry.workers.scraper")
logging.basicConfig(level=logging.INFO)


async def handle_scrape_event(event: EventEnvelope):
    startup_id = event.startup_id or event.payload.get("startup_id")
    if not startup_id:
        logger.warning(f"⚠️ Event {event.event_id} missing startup_id. Skipping.")
        return

    db = SessionLocal()
    try:
        startup = db.query(Startup).filter(Startup.id == startup_id).first()
        if not startup:
            logger.error(f"❌ Startup {startup_id} not found in database.")
            return

        name = startup.name or event.payload.get("name", "Startup")
        domains = startup.domains or event.payload.get("domains", [])
        tagline = startup.tagline or event.payload.get("tagline", "")
        raw_competitors = startup.main_competitors or ""
        website_url = startup.website_url or event.payload.get("website_url")

        print("\n" + "=" * 80)
        print(f"🌐 [DUAL-STAGE SCRAPER] Scraping Live Market Data for: '{name}' (ID: {startup_id})")
        print(f"   📍 Industry Domains: {domains}")
        print(f"   📍 Website URL: {website_url or 'None provided'}")
        print(f"   📍 Competitors Specified: {raw_competitors or 'None provided'}")
        print("-" * 80)

        # Execute Dual-Stage Scraping Pipeline: DDGS (Stage 1) -> Playwright Headless (Stage 2)
        scraped_data = await execute_dual_stage_scrape(
            name=name,
            domains=domains,
            tagline=tagline,
            raw_competitors=raw_competitors,
            max_results=10,
        )

        top_sites = scraped_data.get("top_sites_scraped", [])
        competitors = scraped_data.get("competitors_found", [])
        search_query = scraped_data.get("search_query_used", "")

        print(f"🔍 DuckDuckGo Search Query: \"{search_query}\"")
        print(f"📥 Search Results Extracted ({len(top_sites)} sites):")
        for idx, site in enumerate(top_sites[:5], 1):
            title = site.get("title", "No Title")
            url = site.get("url", "")
            snippet = site.get("extracted_text", "")[:120].replace("\n", " ")
            print(f"   {idx}. [{title}] ({url})")
            if snippet:
                print(f"      Snippet: {snippet}...")

        print(f"⚔️ Competitors Identified: {', '.join(competitors[:6]) if competitors else 'Sector incumbents'}")
        print(f"📡 Publishing market intelligence to Kafka topic '{KafkaTopics.STARTUP_SCRAPED}'...")
        print("=" * 80 + "\n")

        # Publish consolidated market intelligence to Kafka topic 'startup.scraped'
        payload = {
            "startup_id": str(startup.id),
            "name": name,
            "scraped_context": scraped_data,
        }

        await kafka_manager.publish_event(
            topic=KafkaTopics.STARTUP_SCRAPED,
            event_type="startup.scraped",
            startup_id=str(startup.id),
            payload=payload,
        )

        logger.info(f"📡 Published 'startup.scraped' event for Startup ID: {startup_id}")
    except Exception as e:
        logger.error(f"❌ Scraping pipeline failed for Startup {startup_id}: {e}")
        raise e
    finally:
        db.close()


async def run_worker():
    logger.info("🚀 Dual-Stage Scraper Worker starting supervisor loop...")
    while True:
        consumer = None
        try:
            await kafka_manager.start()
            consumer = KafkaConsumerWrapper(
                topics=[
                    KafkaTopics.STARTUP_SCRAPE_REQUESTED,
                    KafkaTopics.STARTUP_APPROVED,
                ],
                group_id="scraper-worker-group",
                handler=handle_scrape_event,
                producer_ref=kafka_manager.producer,
            )
            await consumer.start()
            if consumer._is_running:
                logger.info("✨ Scraper Worker active and listening to Kafka topics on localhost:9092...")
                await consumer.listen()
            else:
                logger.warning("⏳ Scraper Kafka Consumer not ready. Retrying in 5 seconds...")
                await asyncio.sleep(5)
        except Exception as loop_err:
            logger.warning(f"⚠️ [Scraper Worker] Connection error ({loop_err}). Auto-reconnecting in 5 seconds...")
            await asyncio.sleep(5)
        finally:
            try:
                if consumer:
                    await consumer.stop()
                await kafka_manager.stop()
            except Exception:
                pass


if __name__ == "__main__":
    asyncio.run(run_worker())
