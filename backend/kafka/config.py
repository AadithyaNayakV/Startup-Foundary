import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class KafkaSettings(BaseSettings):
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    KAFKA_CLIENT_ID: str = os.getenv("KAFKA_CLIENT_ID", "foundry-backend")
    KAFKA_CONSUMER_GROUP_PREFIX: str = os.getenv("KAFKA_CONSUMER_GROUP_PREFIX", "foundry-group")
    KAFKA_MAX_RETRY_ATTEMPTS: int = 3
    KAFKA_RETRY_BACKOFF_MS: int = 1000
    KAFKA_ENABLE_AUTO_COMMIT: bool = True
    KAFKA_AUTO_OFFSET_RESET: str = "earliest"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


kafka_settings = KafkaSettings()
