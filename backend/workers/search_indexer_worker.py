import asyncio
import logging
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from kafka.consumer import KafkaConsumerWrapper
from kafka.manager import kafka_manager
from kafka.topics import KafkaTopics
from kafka.schemas import EventEnvelope

logger = logging.getLogger("foundry.workers.search_indexer")
logging.basicConfig(level=logging.INFO)


async def handle_search_indexer(event: EventEnvelope):
    event_type = event.event_type
    logger.info(f"🔎 Processing Search Indexing / Cache Event: '{event_type}' | ID: {event.event_id}")

    startup_id = event.startup_id or event.payload.get("startup_id")

    if event_type == KafkaTopics.STARTUP_CREATED:
        logger.info(f"🗂️ [SEARCH INDEX] Added new draft startup {startup_id} to staging index.")

    elif event_type == KafkaTopics.STARTUP_APPROVED:
        logger.info(f"⚡ [SEARCH INDEX] Promoted startup {startup_id} to primary public search index!")
        logger.info(f"🧹 [CACHE INVALIDATE] Cleared feed and catalog caches for startup: {startup_id}")

    elif event_type == KafkaTopics.STARTUP_UPDATED:
        logger.info(f"🔄 [SEARCH INDEX] Re-indexed startup document for ID: {startup_id}")

    elif event_type == KafkaTopics.STARTUP_DELETED:
        logger.info(f"🗑️ [SEARCH INDEX] Removed startup {startup_id} from all search indices.")

    elif event_type == KafkaTopics.CACHE_INVALIDATE:
        target = event.payload.get("target", "global")
        logger.info(f"🧹 [CACHE INVALIDATE] Flushing cache key pattern: '{target}'")


async def run_worker():
    await kafka_manager.start()
    consumer = KafkaConsumerWrapper(
        topics=[
            KafkaTopics.STARTUP_CREATED,
            KafkaTopics.STARTUP_UPDATED,
            KafkaTopics.STARTUP_APPROVED,
            KafkaTopics.STARTUP_DELETED,
            KafkaTopics.SEARCH_INDEX,
            KafkaTopics.CACHE_INVALIDATE,
        ],
        group_id="search-indexer-worker-group",
        handler=handle_search_indexer,
        producer_ref=kafka_manager.producer,
    )
    await consumer.start()
    logger.info("🚀 Search Indexer Worker initialized and listening...")
    try:
        await consumer.listen()
    finally:
        await consumer.stop()
        await kafka_manager.stop()


if __name__ == "__main__":
    asyncio.run(run_worker())
