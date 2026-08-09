import asyncio
import logging
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import SessionLocal
from models import AdminAction
from kafka.consumer import KafkaConsumerWrapper
from kafka.manager import kafka_manager
from kafka.topics import KafkaTopics
from kafka.schemas import EventEnvelope

logger = logging.getLogger("foundry.workers.audit")
logging.basicConfig(level=logging.INFO)


async def handle_audit_event(event: EventEnvelope):
    logger.info(f"📜 Processing Audit Event: '{event.event_type}' | ID: {event.event_id}")

    payload = event.payload
    actor_id = payload.get("admin_id") or payload.get("actor_id") or event.user_id
    target_type = payload.get("target_type") or "system"
    target_id = payload.get("target_id") or event.startup_id or event.user_id
    action = payload.get("action") or event.event_type
    reason = payload.get("reason") or payload.get("approval_notes")

    if not actor_id or not target_id:
        logger.info(f"ℹ️ Audit event parsed without explicit DB binding: {event.event_type}")
        return

    db = SessionLocal()
    try:
        audit_entry = AdminAction(
            admin_id=actor_id,
            target_type=target_type,
            target_id=target_id,
            action=action,
            reason=reason,
        )
        db.add(audit_entry)
        db.commit()
        logger.info(f"✅ Recorded Audit Action in Postgres | Target: {target_type}:{target_id} | Action: {action}")
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to persist audit log: {e}")
    finally:
        db.close()


async def run_worker():
    await kafka_manager.start()
    consumer = KafkaConsumerWrapper(
        topics=[
            KafkaTopics.AUDIT_LOGS,
            KafkaTopics.STARTUP_APPROVED,
            KafkaTopics.STARTUP_REJECTED,
        ],
        group_id="audit-worker-group",
        handler=handle_audit_event,
        producer_ref=kafka_manager.producer,
    )
    await consumer.start()
    logger.info("🚀 Audit Worker initialized and listening...")
    try:
        await consumer.listen()
    finally:
        await consumer.stop()
        await kafka_manager.stop()


if __name__ == "__main__":
    asyncio.run(run_worker())
