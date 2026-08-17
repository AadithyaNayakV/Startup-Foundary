import logging
from typing import List, Optional
from aiokafka.admin import AIOKafkaAdminClient, NewTopic
from aiokafka.errors import TopicAlreadyExistsError, KafkaError
from kafka.config import kafka_settings

logger = logging.getLogger("foundry.kafka.admin")


async def ensure_topics_exist(
    topics: List[str],
    bootstrap_servers: Optional[str] = None,
    client_id: Optional[str] = None,
    num_partitions: int = 1,
    replication_factor: int = 1,
) -> bool:
    """
    Checks if the specified Kafka topics exist on the broker.
    If any topic is missing, programmatically creates it using AIOKafkaAdminClient and NewTopic.
    Robustly handles concurrent creations from multiple worker processes without crashing.
    """
    valid_topics = [t for t in set(topics) if t and isinstance(t, str)]
    if not valid_topics:
        return True

    servers = bootstrap_servers or kafka_settings.KAFKA_BOOTSTRAP_SERVERS
    admin_id = client_id or f"{kafka_settings.KAFKA_CLIENT_ID}-admin"

    admin_client = AIOKafkaAdminClient(
        bootstrap_servers=servers,
        client_id=admin_id,
        request_timeout_ms=10000,
    )

    try:
        await admin_client.start()
        existing_cluster_topics = await admin_client.list_topics()
        missing_topics = [t for t in valid_topics if t not in existing_cluster_topics]

        if missing_topics:
            logger.info(f"🛠️ [KafkaAdmin] Missing topics detected: {missing_topics}. Creating them on broker...")
            new_topics = [
                NewTopic(
                    name=t,
                    num_partitions=num_partitions,
                    replication_factor=replication_factor,
                )
                for t in missing_topics
            ]
            try:
                await admin_client.create_topics(new_topics)
                logger.info(f"✨ [KafkaAdmin] Successfully created Kafka topics: {missing_topics}")
            except TopicAlreadyExistsError:
                logger.info(f"ℹ️ [KafkaAdmin] Topics {missing_topics} were already created concurrently by another worker.")
            except Exception as create_err:
                err_str = str(create_err).lower()
                if "topicalreadyexists" in err_str or "topicexists" in err_str or "already exists" in err_str:
                    logger.info(f"ℹ️ [KafkaAdmin] Concurrent topic creation handled gracefully: {create_err}")
                else:
                    logger.warning(f"⚠️ [KafkaAdmin] Warning while creating topics {missing_topics}: {create_err}")
        else:
            logger.debug(f"✓ [KafkaAdmin] All requested topics exist on broker: {valid_topics}")
        return True
    except Exception as e:
        logger.warning(f"⚠️ [KafkaAdmin] Could not connect/verify topics on Kafka broker ({servers}): {e}")
        return False
    finally:
        try:
            await admin_client.close()
        except Exception:
            pass
