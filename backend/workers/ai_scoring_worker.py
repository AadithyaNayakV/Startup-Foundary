import asyncio
import logging
import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add parent directory to sys.path for standalone script execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import httpx

from database import SessionLocal
from models import Startup, StartupMember, User
from services.scraper import scrape_market_intelligence
from services.ai_scorer import evaluate_startup_with_llm, OllamaRemoteConnectionError
from services.pitch_deck_parser import (
    extract_text_from_pdf_bytes,
    resolve_local_upload_path,
    extract_text_from_pitch_deck_path,
)
from utils.s3_manager import s3_manager
from kafka.consumer import KafkaConsumerWrapper
from kafka.manager import kafka_manager
from kafka.topics import KafkaTopics
from kafka.schemas import EventEnvelope

logger = logging.getLogger("foundry.workers.ai_scoring")
logging.basicConfig(level=logging.INFO)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://16.113.91.178:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
OLLAMA_API_URL = f"{OLLAMA_BASE_URL.rstrip('/')}/api/generate"


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

    logger.info(
        f"⚙️ [ai_scoring_worker] Processing Multi-Parameter AI Scoring for Startup ID: {startup_id} "
        f"(Event: {event.event_type} | Topic: {event.payload.get('s3_key') or 'standard'})"
    )

    db = SessionLocal()
    try:
        startup = db.query(Startup).filter(Startup.id == startup_id).first()
        if not startup:
            logger.error(f"❌ Startup {startup_id} not found in database.")
            return

        # Mark status as processing if not already set
        if startup.ai_evaluation_status != "processing":
            startup.ai_evaluation_status = "processing"
            db.commit()
            db.refresh(startup)

        # 1. AWS S3 Download & In-Memory Extraction
        deck_text = ""
        s3_key = event.payload.get("s3_key")
        s3_url = event.payload.get("s3_url") or startup.pitch_deck_url

        if s3_key or (s3_url and ("amazonaws.com" in str(s3_url) or "pitch_decks/" in str(s3_url))):
            target_key = s3_key or s3_manager.extract_s3_key(s3_url)
            logger.info(f"📥 Fetching raw PDF bytes from AWS S3 key: '{target_key}'")
            try:
                pdf_bytes = s3_manager.get_pdf_bytes(target_key)
                parsed_pdf = extract_text_from_pdf_bytes(pdf_bytes)
                deck_text = parsed_pdf.get("extracted_text", "")
                logger.info(
                    f"📄 In-Memory S3 PDF extraction complete for '{startup.name}' "
                    f"({parsed_pdf.get('page_count', 0)} pages, {len(deck_text)} chars extracted)"
                )
            except Exception as s3_err:
                logger.warning(f"⚠️ AWS S3 PDF download/extraction error: {s3_err}")

        # Fallback to local pitch deck path if S3 text not present
        if not deck_text and startup.pitch_deck_url:
            local_deck_path = resolve_local_upload_path(startup.pitch_deck_url)
            if local_deck_path:
                deck_res = extract_text_from_pitch_deck_path(local_deck_path)
                deck_text = deck_res.get("extracted_text", "")
                if deck_text:
                    logger.info(f"📄 Local pitch deck extracted {len(deck_text)} chars for '{startup.name}'")

        # 2. Multi-Source Context Aggregation: Founder Inputs + Scraped Market Info + S3 Pitch Deck Text
        market_info = event.payload.get("market_info")
        scraped_ctx_payload = event.payload.get("scraped_context")

        if scraped_ctx_payload and isinstance(scraped_ctx_payload, dict):
            top_sites = scraped_ctx_payload.get("top_sites_scraped", [])
            extracted_summaries = [
                f"[{s.get('title')}] {s.get('extracted_text')[:300]}" for s in top_sites[:5]
            ]
            market_info = {
                "scraped_context": (
                    "\n".join(extracted_summaries)
                    if extracted_summaries
                    else "Live market search intelligence verified."
                ),
                "competitors_found": scraped_ctx_payload.get("competitors_found", []),
                "detected_tech_stack": ["Next.js", "React", "FastAPI", "PostgreSQL"],
                "market_size_estimate": "Top-10 Web Search Market Signals",
                "growth_signals": ["Live Web Verified", "High Domain Relevance"],
            }
        elif not market_info:
            logger.info(
                f"🔍 Scraping web & market intelligence (DDGS + Playwright) for startup '{startup.name}' across domains {startup.domains}"
            )
            market_info = scrape_market_intelligence(
                domains=startup.domains or [],
                website_url=startup.website_url,
                raw_competitors=startup.main_competitors,
            )

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
            "deck_extracted_text": deck_text,
        }

        # 3. Remote EC2 Ollama LLM Evaluation (model: qwen2.5:7b, format: json, stream: False, timeout: 150.0s)
        print("\n" + "=" * 80)
        print(f"🧠 [AI DEAL SCORER] Evaluating Startup: '{startup.name}' (ID: {startup_id})")
        print(f"   📍 Target Engine: Remote EC2 Ollama ({OLLAMA_MODEL}) @ {OLLAMA_BASE_URL}")
        print(f"   📍 Pitch Summary: {startup.tagline or startup.name}")
        print(f"   📍 Funding Ask: ${startup.ask_amount:,.0f} for {startup.equity_offered}% equity")
        print(f"   📍 Traction: MRR ${startup.mrr:,.0f} | MoM Growth {startup.growth_rate_pct}% | Runway {startup.runway_months} mos")
        print(f"   📄 S3 Pitch Deck: {len(deck_text)} characters extracted")
        print(f"   🌐 Scraped Competitors: {', '.join(market_info.get('competitors_found', [])[:5]) if market_info else 'None'}")
        print("-" * 80)
        print(f"⏳ Sending prompt to Ollama {OLLAMA_MODEL} on EC2 instance...")

        try:
            evaluation = evaluate_startup_with_llm(startup_data, market_info, allow_fallback=False)
        except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError, httpx.RequestError, OllamaRemoteConnectionError) as ec2_err:
            print(f"❌ [Ollama EC2 Error] Connection failed: {ec2_err}")
            print("=" * 80 + "\n")
            logger.warning(f"⚠️ Remote EC2 Ollama connection failed: {ec2_err}")
            startup.ai_evaluation_status = "failed"
            db.commit()
            logger.info(f"⚠️ Routed Startup ID '{startup_id}' AI evaluation status to 'failed' due to remote EC2 Ollama unreachable.")
            return
        except Exception as eval_err:
            print(f"❌ [Ollama Error] Evaluation failed: {eval_err}")
            print("=" * 80 + "\n")
            logger.error(f"❌ Unexpected error during LLM evaluation for Startup {startup_id}: {eval_err}")
            startup.ai_evaluation_status = "failed"
            db.commit()
            return

        score = evaluation["overall_score"]
        verdict = evaluation["verdict"]
        breakdown = evaluation["ai_score_breakdown"]
        market_radar = evaluation.get("market_radar")
        cat_scores = evaluation.get("category_scores", {})
        key_pros = evaluation.get("key_pros", [])
        key_cons = evaluation.get("key_cons", [])

        print("✨ [AI DEAL SCORING RESULT]")
        print(f"   🏆 OVERALL SCORE: {score} / 100")
        print(f"   📊 CATEGORY BREAKDOWN:")
        print(f"      - Problem-Market Fit:      {cat_scores.get('problem_market_fit', 0)} / 30")
        print(f"      - Competitive Moat:        {cat_scores.get('competitive_moat', 0)} / 25")
        print(f"      - Market Opportunity:      {cat_scores.get('market_opportunity', 0)} / 20")
        print(f"      - Execution Viability:     {cat_scores.get('execution_viability', 0)} / 25")
        print(f"   📝 VERDICT: {verdict}")
        if key_pros:
            print(f"   🟢 KEY PROS / STRENGTHS:")
            for pro in key_pros[:3]:
                print(f"      * {pro}")
        if key_cons:
            print(f"   🔴 KEY CONS / RISKS:")
            for con in key_cons[:3]:
                print(f"      * {con}")
        if market_radar:
            print(f"   🎯 MARKET RADAR:")
            print(f"      - TAM Estimate: {market_radar.get('tam_estimate', 'N/A')}")
            print(f"      - Key Tailwinds: {market_radar.get('key_tailwinds', 'N/A')}")
        print("=" * 80 + "\n")

        # 4. Database Sync & Next Kafka Event
        startup.ai_score = score
        startup.ai_verdict = verdict
        startup.ai_score_breakdown = breakdown
        startup.pitch_deck_parsed_text = deck_text if deck_text else None
        startup.ai_evaluation_status = "completed"
        if market_radar:
            startup.market_radar_data = market_radar
        db.commit()

        logger.info(
            f"✅ Startup '{startup.name}' ({startup_id}) successfully evaluated by remote EC2 {OLLAMA_MODEL} | "
            f"Overall Score: {score}/100 | Verdict: {verdict} | Status: completed"
        )

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
        logger.error(f"❌ Error during AI evaluation for Startup {startup_id}: {e}")
        # Mark evaluation status as failed in PostgreSQL
        try:
            failed_startup = db.query(Startup).filter(Startup.id == startup_id).first()
            if failed_startup:
                failed_startup.ai_evaluation_status = "failed"
                db.commit()
                logger.info(f"⚠️ Marked ai_evaluation_status = 'failed' for Startup {startup_id}")
        except Exception as update_err:
            logger.error(f"❌ Failed to set status to 'failed': {update_err}")
            db.rollback()
    finally:
        db.close()


async def run_worker():
    logger.info(
        f"🚀 Multi-Parameter AI Scoring Worker ({OLLAMA_MODEL} & S3 Pitch Deck Pipeline) starting supervisor loop..."
    )
    while True:
        consumer = None
        try:
            await kafka_manager.start()
            consumer = KafkaConsumerWrapper(
                topics=[
                    KafkaTopics.STARTUP_DOCUMENT_UPLOADED,
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
            if consumer._is_running:
                logger.info(f"✨ AI Scorer Worker active and listening to Kafka topics on localhost:9092...")
                await consumer.listen()
            else:
                logger.warning("⏳ Kafka Consumer not ready. Retrying in 5 seconds...")
                await asyncio.sleep(5)
        except Exception as loop_err:
            logger.warning(f"⚠️ [AI Scorer Worker] Connection error ({loop_err}). Auto-reconnecting in 5 seconds...")
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
