import json
import logging
import time
from typing import Callable, List, Optional, Any
from aiokafka import AIOKafkaConsumer
from kafka.config import kafka_settings
from kafka.topics import DLQ_TOPIC_MAP
from kafka.schemas import EventEnvelope
from kafka.admin import ensure_topics_exist

logger = logging.getLogger("foundry.kafka.consumer")


class KafkaConsumerWrapper:
    def __init__(
        self,
        topics: List[str],
        group_id: str,
        handler: Callable[[EventEnvelope], None],
        producer_ref: Optional[Any] = None,
    ):
        self.topics = topics
        self.group_id = f"{kafka_settings.KAFKA_CONSUMER_GROUP_PREFIX}-{group_id}"
        self.handler = handler
        self.producer_ref = producer_ref
        self.consumer: Optional[AIOKafkaConsumer] = None
        self._is_running = False

    async def start(self):
        try:
            # 1. Programmatically auto-create target topics and their mapped DLQ topics if not present
            all_topics_to_ensure = list(self.topics)
            for t in self.topics:
                dlq = DLQ_TOPIC_MAP.get(t, f"{t}.dlq")
                if dlq not in all_topics_to_ensure:
                    all_topics_to_ensure.append(dlq)

            await ensure_topics_exist(all_topics_to_ensure)

            import asyncio

            # 2. Initialize and start AIOKafkaConsumer with retry backoff for metadata propagation
            self.consumer = AIOKafkaConsumer(
                *self.topics,
                bootstrap_servers=kafka_settings.KAFKA_BOOTSTRAP_SERVERS,
                group_id=self.group_id,
                auto_offset_reset=kafka_settings.KAFKA_AUTO_OFFSET_RESET,
                enable_auto_commit=kafka_settings.KAFKA_ENABLE_AUTO_COMMIT,
                value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            )

            max_retries = 5
            for attempt in range(1, max_retries + 1):
                try:
                    await self.consumer.start()
                    self._is_running = True
                    logger.info(f"📥 Kafka Consumer started for topics {self.topics} in group '{self.group_id}'")
                    return
                except Exception as start_err:
                    if attempt < max_retries:
                        logger.warning(
                            f"⏳ [KafkaConsumer] Waiting for topic metadata to propagate on broker (attempt {attempt}/{max_retries}): {start_err}"
                        )
                        await asyncio.sleep(1.5)
                    else:
                        raise start_err
        except Exception as e:
            logger.error(f"❌ Failed to start Kafka Consumer for group '{self.group_id}': {e}")
            if self.consumer:
                try:
                    await self.consumer.stop()
                except Exception:
                    pass
            self.consumer = None
            self._is_running = False

    async def stop(self):
        self._is_running = False
        if self.consumer:
            await self.consumer.stop()
            logger.info(f"🛑 Kafka Consumer stopped for group '{self.group_id}'")

    async def listen(self):
        if not self.consumer or not self._is_running:
            logger.error("Consumer not started. Call start() before listen().")
            return

        try:
            async for msg in self.consumer:
                if not self._is_running:
                    break

                start_time = time.time()
                data = msg.value

                try:
                    event = EventEnvelope(**data)
                except Exception as parse_err:
                    logger.error(f"⚠️ Failed to parse event schema on topic '{msg.topic}': {parse_err}")
                    continue

                latency_ms = (time.time() - start_time) * 1000

                logger.info(
                    f"📥 Consuming Event | Topic: {msg.topic} | Consumer Group: {self.group_id} | "
                    f"Offset: {msg.offset} | Latency: {latency_ms:.2f}ms | Event ID: {event.event_id}"
                )

                retry_count = 0
                max_retries = kafka_settings.KAFKA_MAX_RETRY_ATTEMPTS
                success = False

                while retry_count <= max_retries:
                    try:
                        if callable(self.handler):
                            res = self.handler(event)
                            if hasattr(res, "__await__"):
                                await res
                        success = True
                        break
                    except Exception as handler_err:
                        retry_count += 1
                        logger.warning(
                            f"⚠️ Error processing event {event.event_id} (Attempt {retry_count}/{max_retries}): {handler_err}"
                        )

                if not success:
                    dlq_topic = DLQ_TOPIC_MAP.get(msg.topic, f"{msg.topic}.dlq")
                    logger.error(f"🚨 Message {event.event_id} failed after {max_retries} retries. Forwarding to DLQ: '{dlq_topic}'")
                    if self.producer_ref:
                        dlq_event = EventEnvelope(
                            event_type=f"{event.event_type}.failed",
                            startup_id=event.startup_id,
                            user_id=event.user_id,
                            payload={
                                "original_event": event.to_dict(),
                                "error_message": f"Failed after {max_retries} retries",
                            },
                        )
                        await self.producer_ref.publish(dlq_topic, dlq_event)
        except Exception as listen_err:
            logger.error(f"❌ Consumer loop encountered critical error: {listen_err}")
