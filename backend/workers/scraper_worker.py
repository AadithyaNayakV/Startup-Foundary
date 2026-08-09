import asyncio
import logging
import sys
import os

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

    logger.info(f"🕸️ [scraper_worker] Initiating Dual-Stage Web Scraping for Startup ID: {startup_id} (Event: {event.event_type})")

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

        # Execute Dual-Stage Scraping Pipeline: DDGS (Stage 1) -> Playwright Headless (Stage 2)
        scraped_data = await execute_dual_stage_scrape(
            name=name,
            domains=domains,
            tagline=tagline,
            raw_competitors=raw_competitors,
            max_results=10,
        )

        logger.info(
            f"✅ [scraper_worker] Dual-Stage scrape finished for '{name}'. "
            f"Query: '{scraped_data['search_query_used']}' | Top Sites: {len(scraped_data['top_sites_scraped'])} | "
            f"Competitors Found: {len(scraped_data['competitors_found'])}"
        )

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
    logger.info("🚀 Dual-Stage Scraper Worker (ddgs & Playwright) initialized and listening to topics...")
    try:
        await consumer.listen()
    finally:
        await consumer.stop()
        await kafka_manager.stop()


if __name__ == "__main__":
    asyncio.run(run_worker())
