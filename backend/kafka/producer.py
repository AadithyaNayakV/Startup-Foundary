import json
import logging
from typing import Any, Dict, Optional
from aiokafka import AIOKafkaProducer
from kafka.config import kafka_settings
from kafka.schemas import EventEnvelope

logger = logging.getLogger("foundry.kafka.producer")


class KafkaProducerWrapper:
    def __init__(self):
        self.producer: Optional[AIOKafkaProducer] = None
        self._is_started = False

    async def start(self):
        if self._is_started:
            return

        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=kafka_settings.KAFKA_BOOTSTRAP_SERVERS,
                client_id=kafka_settings.KAFKA_CLIENT_ID,
                value_serializer=lambda v: json.dumps(v).encode("utf-8") if not isinstance(v, bytes) else v,
                key_serializer=lambda k: k.encode("utf-8") if isinstance(k, str) else k,
                acks="all",  # Strong durability guarantee
                retry_backoff_ms=kafka_settings.KAFKA_RETRY_BACKOFF_MS,
            )
            await self.producer.start()
            self._is_started = True
        except Exception as e:
            logger.error(f"❌ Failed to connect Kafka Producer: {e}")
            if self.producer:
                try:
                    await self.producer.stop()
                except Exception:
                    pass
            self.producer = None
            self._is_started = False

    async def stop(self):
        if self.producer and self._is_started:
            await self.producer.stop()
            self._is_started = False
            logger.info("🛑 Kafka Producer stopped")

    async def publish(
        self,
        topic: str,
        event: EventEnvelope,
        key: Optional[str] = None,
    ) -> bool:
        if not self.producer or not self._is_started:
            logger.warning(f"⚠️ Kafka Producer not connected. Event '{event.event_type}' on '{topic}' discarded or pending.")
            return False

        payload_dict = event.to_dict()
        partition_key = key or event.startup_id or event.user_id or event.event_id

        try:
            record_metadata = await self.producer.send_and_wait(
                topic=topic,
                value=payload_dict,
                key=partition_key,
            )

            logger.info(
                f"📤 Publishing Event | Topic: {topic} | Event Type: {event.event_type} | "
                f"ID: {event.event_id} | Startup ID: {event.startup_id} | "
                f"Partition: {record_metadata.partition} | Offset: {record_metadata.offset}"
            )
            return True
        except Exception as e:
            logger.error(f"❌ Failed to publish event '{event.event_type}' to topic '{topic}': {e}")
            return False
