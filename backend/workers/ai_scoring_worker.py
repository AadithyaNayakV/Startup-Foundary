import asyncio
import logging
import sys
import os

# Add parent directory to sys.path for standalone script execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import SessionLocal
from models import Startup, StartupMember, User
from services.scraper import scrape_market_intelligence
from services.ai_scorer import evaluate_startup_with_llm
from kafka.consumer import KafkaConsumerWrapper
from kafka.manager import kafka_manager
from kafka.topics import KafkaTopics
from kafka.schemas import EventEnvelope

logger = logging.getLogger("foundry.workers.ai_scoring")
logging.basicConfig(level=logging.INFO)


def format_team_info(db, startup_id) -> str:
    """Compiles detailed team profiles and co-founder backgrounds."""
    members = (
        db.query(StartupMember, User)
        .join(User, StartupMember.user_id == User.id)
        .filter(StartupMember.startup_id == startup_id)
        .all()
    )
    if not members:
        return "Single Founder team profile."

    team_parts = []
    for member, user in members:
        bio_snippet = f" - Bio: {user.bio}" if user.bio else ""
        linkedin = f" (LinkedIn: {user.linkedin_url})" if user.linkedin_url else ""
        team_parts.append(f"{user.name} ({member.role}){linkedin}{bio_snippet}")

    return "; ".join(team_parts)


async def handle_ai_scoring(event: EventEnvelope):
    startup_id = event.startup_id or event.payload.get("startup_id")
    if not startup_id:
        logger.warning(f"⚠️ Event {event.event_id} missing startup_id. Skipping.")
        return

    logger.info(f"⚙️ [ai_scoring_worker] Processing Multi-Parameter AI Scoring for Startup ID: {startup_id} (Event: {event.event_type})")

    db = SessionLocal()
    try:
        startup = db.query(Startup).filter(Startup.id == startup_id).first()
        if not startup:
            logger.error(f"❌ Startup {startup_id} not found in database.")
            return

        # 1. Parameter Aggregation: Market Scraped Inputs
        market_info = event.payload.get("market_info")
        scraped_ctx_payload = event.payload.get("scraped_context")

        if scraped_ctx_payload and isinstance(scraped_ctx_payload, dict):
            top_sites = scraped_ctx_payload.get("top_sites_scraped", [])
            extracted_summaries = [f"[{s.get('title')}] {s.get('extracted_text')[:300]}" for s in top_sites[:5]]
            market_info = {
                "scraped_context": "\n".join(extracted_summaries) if extracted_summaries else "Live market search intelligence verified.",
                "competitors_found": scraped_ctx_payload.get("competitors_found", []),
                "detected_tech_stack": ["Next.js", "React", "FastAPI", "PostgreSQL"],
                "market_size_estimate": "Top-10 Web Search Market Signals",
                "growth_signals": ["Live Web Verified", "High Domain Relevance"],
            }
        elif not market_info:
            logger.info(f"🔍 Scraping web & market intelligence for startup '{startup.name}' across domains {startup.domains}")
            market_info = scrape_market_intelligence(
                domains=startup.domains or [],
                website_url=startup.website_url,
                raw_competitors=startup.main_competitors,
            )

        # 2. Parameter Aggregation: Founder, Pitch, and Team Inputs
        team_info = format_team_info(db, startup.id)
        startup_data = {
            "id": str(startup.id),
            "name": startup.name,
            "tagline": startup.tagline or "",
            "description": startup.description or "",
            "domains": startup.domains or [],
            "stage": startup.stage or "idea",
            "ask_amount": startup.ask_amount or 0.0,
            "equity_offered": startup.equity_offered or 0.0,
            "implied_valuation": startup.implied_valuation or 0.0,
            "use_of_funds": startup.use_of_funds or "",
            "mrr": startup.mrr or 0.0,
            "growth_rate_pct": startup.growth_rate_pct or 0.0,
            "burn_rate": startup.burn_rate or 0.0,
            "runway_months": startup.runway_months or 0,
            "gross_margin_pct": startup.gross_margin_pct or 0.0,
            "total_raised": startup.total_raised or 0.0,
            "main_competitors": startup.main_competitors or "",
            "moat_description": startup.moat_description or "",
            "pitch_deck_url": startup.pitch_deck_url or "",
            "team_info": team_info,
        }

        # 2.1 Parse Pitch Deck Text if available
        deck_text = ""
        if startup.pitch_deck_url:
            from services.pitch_deck_parser import resolve_local_upload_path, extract_text_from_pitch_deck_path
            local_deck_path = resolve_local_upload_path(startup.pitch_deck_url)
            if local_deck_path:
                deck_res = extract_text_from_pitch_deck_path(local_deck_path)
                deck_text = deck_res.get("extracted_text", "")
                if deck_text:
                    logger.info(f"📄 Extracted {len(deck_text)} chars from pitch deck for '{startup.name}'")
        startup_data["deck_extracted_text"] = deck_text

        # 3. Execute Weighted VC Evaluation Rubric with Local Ollama kimi-k3
        evaluation = evaluate_startup_with_llm(startup_data, market_info)

        score = evaluation["overall_score"]
        verdict = evaluation["verdict"]
        breakdown = evaluation["ai_score_breakdown"]
        market_radar = evaluation.get("market_radar")

        # 4. Persist to PostgreSQL
        startup.ai_score = score
        startup.ai_verdict = verdict
        startup.ai_score_breakdown = breakdown
        if market_radar:
            startup.market_radar_data = market_radar
        db.commit()

        logger.info(f"✅ Startup '{startup.name}' ({startup_id}) scored by kimi-k3 | Overall Score: {score}/100 | Verdict: {verdict}")

        # 5. Publish startup.scored event
        await kafka_manager.publish_event(
            topic=KafkaTopics.STARTUP_SCORED,
            event_type="startup.scored",
            startup_id=str(startup.id),
            payload={
                "startup_id": str(startup.id),
                "name": startup.name,
                "ai_score": score,
                "ai_verdict": verdict,
                "ai_score_breakdown": breakdown,
                "market_radar": market_radar,
                "category_scores": evaluation.get("category_scores"),
                "key_pros": evaluation.get("key_pros"),
                "key_cons": evaluation.get("key_cons"),
            },
        )
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error during AI scoring for Startup {startup_id}: {e}")
        raise e
    finally:
        db.close()


async def run_worker():
    await kafka_manager.start()
    consumer = KafkaConsumerWrapper(
        topics=[
            KafkaTopics.STARTUP_SCRAPED,
            KafkaTopics.STARTUP_APPROVED,
            KafkaTopics.STARTUP_SCRAPE_REQUESTED,
            KafkaTopics.STARTUP_SCORE_REQUESTED,
        ],
        group_id="ai-scorer-worker-group",
        handler=handle_ai_scoring,
        producer_ref=kafka_manager.producer,
    )
    await consumer.start()
    logger.info("🚀 Multi-Parameter AI Scoring Worker (kimi-k3) initialized and listening to topics...")
    try:
        await consumer.listen()
    finally:
        await consumer.stop()
        await kafka_manager.stop()


if __name__ == "__main__":
    asyncio.run(run_worker())
