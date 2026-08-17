import asyncio
import logging
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import SessionLocal
from models import User, Startup
from kafka.consumer import KafkaConsumerWrapper
from kafka.manager import kafka_manager
from kafka.topics import KafkaTopics
from kafka.schemas import EventEnvelope

logger = logging.getLogger("foundry.workers.matching")
logging.basicConfig(level=logging.INFO)


async def handle_matching_event(event: EventEnvelope):
    logger.info(f"🎯 Processing Matching Event: '{event.event_type}' | ID: {event.event_id}")

    db = SessionLocal()
    try:
        if event.event_type in [KafkaTopics.STARTUP_SCORED, KafkaTopics.STARTUP_APPROVED]:
            startup_id = event.startup_id or event.payload.get("startup_id")
            startup = db.query(Startup).filter(Startup.id == startup_id).first()
            if not startup:
                return

            # Find matching investors
            investors = db.query(User).filter(User.role == "investor", User.is_approved == True).all()
            matches_count = 0

            for inv in investors:
                inv_domains = [d.strip().lower() for d in (inv.focus_domains or "").split(",") if d.strip()]
                startup_domains = [d.strip().lower() for d in (startup.domains or "").split(",") if d.strip()]

                overlap = set(inv_domains).intersection(set(startup_domains))
                stage_match = not inv.preferred_stage or inv.preferred_stage.lower() == (startup.stage or "").lower()

                if overlap or stage_match:
                    matches_count += 1
                    match_score = (len(overlap) * 30) + (40 if stage_match else 0) + min(30, (startup.ai_score or 50) // 3)
                    logger.info(f"🤝 Match Found! Startup: '{startup.name}' <-> Investor: '{inv.email}' | Score: {match_score}")

                    await kafka_manager.publish_event(
                        topic=KafkaTopics.INVESTOR_MATCHED,
                        event_type="investor.matched",
                        startup_id=str(startup.id),
                        user_id=str(inv.id),
                        payload={
                            "startup_id": str(startup.id),
                            "investor_id": str(inv.id),
                            "match_score": match_score,
                            "matching_domains": list(overlap),
                        },
                    )

            logger.info(f"✅ Matching complete for Startup {startup_id}: {matches_count} investor matches emitted.")

        elif event.event_type in [KafkaTopics.INVESTOR_UPDATED, KafkaTopics.INVESTOR_REGISTERED]:
            user_id = event.user_id or event.payload.get("user_id")
            investor = db.query(User).filter(User.id == user_id).first()
            if not investor or investor.role != "investor":
                return

            approved_startups = db.query(Startup).filter(Startup.status == "approved").all()
            logger.info(f"🔍 Evaluated {len(approved_startups)} approved startups for newly updated investor {investor.email}")
    except Exception as e:
        logger.error(f"❌ Error during matching processing: {e}")
    finally:
        db.close()


async def run_worker():
    logger.info("🚀 Matching Pipeline Worker starting supervisor loop...")
    while True:
        consumer = None
        try:
            await kafka_manager.start()
            consumer = KafkaConsumerWrapper(
                topics=[
                    KafkaTopics.STARTUP_SCORED,
                    KafkaTopics.STARTUP_APPROVED,
                    KafkaTopics.INVESTOR_UPDATED,
                    KafkaTopics.INVESTOR_REGISTERED,
                ],
                group_id="matching-worker-group",
                handler=handle_matching_event,
                producer_ref=kafka_manager.producer,
            )
            await consumer.start()
            if consumer._is_running:
                logger.info("✨ Matching Worker active and listening to Kafka topics...")
                await consumer.listen()
            else:
                logger.warning("⏳ Matching Kafka Consumer not ready. Retrying in 5 seconds...")
                await asyncio.sleep(5)
        except Exception as loop_err:
            logger.warning(f"⚠️ [Matching Worker] Connection error ({loop_err}). Auto-reconnecting in 5 seconds...")
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
