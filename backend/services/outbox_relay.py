import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import SessionLocal
from models import KafkaOutbox
from kafka.manager import kafka_manager

logger = logging.getLogger("foundry.kafka.outbox_relay")


class OutboxRelayService:
    def __init__(self, poll_interval_seconds: float = 5.0, batch_size: int = 50):
        self.poll_interval = poll_interval_seconds
        self.batch_size = batch_size
        self._is_running = False
        self._shutdown_event = asyncio.Event()

    async def start(self):
        self._is_running = True
        self._shutdown_event.clear()
        logger.info(f"🔄 Outbox Relay Service started (polling every {self.poll_interval}s)")

    async def stop(self):
        self._is_running = False
        self._shutdown_event.set()
        logger.info("🛑 Outbox Relay Service stopping...")

    async def process_pending_events(self) -> int:
        """
        Queries PENDING events from kafka_outbox table and attempts to publish them to Kafka.
        Returns the number of successfully published events.
        """
        db: Session = SessionLocal()
        published_count = 0

        try:
            # Query oldest pending records
            pending_records = (
                db.query(KafkaOutbox)
                .filter(KafkaOutbox.status == "PENDING")
                .order_by(KafkaOutbox.created_at.asc())
                .limit(self.batch_size)
                .all()
            )

            if not pending_records:
                return 0

            # Ensure producer is connected
            if not kafka_manager.producer.producer or not kafka_manager.producer._is_started:
                try:
                    await kafka_manager.start()
                except Exception as e:
                    logger.warning(f"⚠️ Outbox Relay: Kafka producer unavailable: {e}")
                    return 0

            if not kafka_manager.producer.producer or not kafka_manager.producer._is_started:
                logger.debug("Outbox Relay: Kafka producer is not connected. Deferring dispatch.")
                return 0

            for record in pending_records:
                topic = record.topic
                payload_dict = record.payload or {}
                partition_key = (
                    payload_dict.get("startup_id")
                    or payload_dict.get("user_id")
                    or str(record.id)
                )

                try:
                    # Publish directly via aiokafka producer
                    record_metadata = await kafka_manager.producer.producer.send_and_wait(
                        topic=topic,
                        value=payload_dict,
                        key=partition_key if partition_key else None,
                    )

                    record.status = "SENT"
                    record.last_error = None
                    record.updated_at = datetime.now(timezone.utc)
                    db.commit()

                    published_count += 1
                    logger.info(
                        f"🚀 [Outbox Relay] Published event {record.id} -> '{topic}' "
                        f"(Partition: {record_metadata.partition}, Offset: {record_metadata.offset})"
                    )

                except Exception as kafka_err:
                    try:
                        db.query(KafkaOutbox).filter(KafkaOutbox.id == record.id).update({
                            KafkaOutbox.retry_count: KafkaOutbox.retry_count + 1,
                            KafkaOutbox.last_error: str(kafka_err),
                            KafkaOutbox.updated_at: datetime.now(timezone.utc),
                        })
                        db.commit()
                    except Exception:
                        db.rollback()

                    logger.warning(
                        f"⚠️ [Outbox Relay] Failed to publish event {record.id} to '{topic}': {kafka_err}. Keeping in PENDING."
                    )
                    # If broker is offline, don't hammer it; backoff until next poll cycle
                    break

        except Exception as err:
            logger.error(f"❌ [Outbox Relay] Error during outbox processing cycle: {err}")
            db.rollback()
        finally:
            db.close()

        return published_count

    async def run_relay_loop(self):
        """Continuous asynchronous loop polling for pending outbox records."""
        await self.start()
        while self._is_running:
            try:
                await self.process_pending_events()
            except Exception as e:
                logger.error(f"❌ [Outbox Relay] Unexpected loop error: {e}")

            try:
                await asyncio.wait_for(
                    self._shutdown_event.wait(), timeout=self.poll_interval
                )
                break
            except asyncio.TimeoutError:
                pass


outbox_relay = OutboxRelayService()
