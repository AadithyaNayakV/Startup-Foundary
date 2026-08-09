import logging
from typing import Any, Dict, Optional
from kafka.producer import KafkaProducerWrapper
from kafka.schemas import EventEnvelope
from kafka.topics import KafkaTopics

logger = logging.getLogger("foundry.kafka.manager")


class KafkaManager:
    def __init__(self):
        self.producer = KafkaProducerWrapper()

    async def start(self):
        await self.producer.start()

    async def stop(self):
        await self.producer.stop()

    async def publish_event(
        self,
        topic: str,
        payload: Dict[str, Any],
        event_type: Optional[str] = None,
        startup_id: Optional[str] = None,
        user_id: Optional[str] = None,
        key: Optional[str] = None,
    ) -> bool:
        if not event_type:
            event_type = topic

        envelope = EventEnvelope(
            event_type=event_type,
            startup_id=startup_id or payload.get("startup_id"),
            user_id=user_id or payload.get("user_id"),
            payload=payload,
        )

        return await self.producer.publish(topic=topic, event=envelope, key=key)


kafka_manager = KafkaManager()
