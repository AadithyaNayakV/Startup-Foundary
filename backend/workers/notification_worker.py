import asyncio
import logging
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from kafka.consumer import KafkaConsumerWrapper
from kafka.manager import kafka_manager
from kafka.topics import KafkaTopics
from kafka.schemas import EventEnvelope

logger = logging.getLogger("foundry.workers.notification")
logging.basicConfig(level=logging.INFO)


async def handle_notification_event(event: EventEnvelope):
    event_type = event.event_type
    logger.info(f"📧 Processing Notification Event: '{event_type}' | Event ID: {event.event_id}")

    payload = event.payload

    if event_type == KafkaTopics.NOTIFICATION_EMAIL or "email" in event_type:
        recipient = payload.get("recipient_email") or payload.get("email")
        subject = payload.get("subject", "Foundry Platform Notification")
        body = payload.get("body", "You have a new message or platform update.")
        logger.info(f"✉️ [SIMULATED EMAIL SENT] To: {recipient} | Subject: '{subject}'")

    elif event_type == KafkaTopics.NOTIFICATION_PUSH:
        user_id = event.user_id or payload.get("user_id")
        message = payload.get("message", "New notification")
        logger.info(f"🔔 [SIMULATED PUSH NOTIFICATION] User ID: {user_id} | Content: '{message}'")

    elif event_type == KafkaTopics.STARTUP_APPROVED:
        startup_id = event.startup_id or payload.get("startup_id")
        logger.info(f"🎉 [EMAIL ALERT] Founder notified: Startup {startup_id} approved!")

    elif event_type == KafkaTopics.STARTUP_REJECTED:
        startup_id = event.startup_id or payload.get("startup_id")
        logger.info(f"ℹ️ [EMAIL ALERT] Founder notified: Startup {startup_id} status updated.")

    elif event_type == KafkaTopics.USER_REGISTERED:
        email = payload.get("email")
        logger.info(f"👋 [WELCOME EMAIL] Welcome email sent to new user: {email}")

    elif event_type == KafkaTopics.MESSAGE_SENT:
        recipient_id = payload.get("recipient_id")
        logger.info(f"💬 [CHAT ALERT] User {recipient_id} notified of new direct message.")

    else:
        logger.info(f"📩 Processed general notification event: {event_type}")


async def run_worker():
    await kafka_manager.start()
    consumer = KafkaConsumerWrapper(
        topics=[
            KafkaTopics.NOTIFICATION_EMAIL,
            KafkaTopics.NOTIFICATION_PUSH,
            KafkaTopics.STARTUP_APPROVED,
            KafkaTopics.STARTUP_REJECTED,
            KafkaTopics.USER_REGISTERED,
            KafkaTopics.MESSAGE_SENT,
        ],
        group_id="notification-worker-group",
        handler=handle_notification_event,
        producer_ref=kafka_manager.producer,
    )
    await consumer.start()
    logger.info("🚀 Notification Worker initialized and listening...")
    try:
        await consumer.listen()
    finally:
        await consumer.stop()
        await kafka_manager.stop()


if __name__ == "__main__":
    asyncio.run(run_worker())
