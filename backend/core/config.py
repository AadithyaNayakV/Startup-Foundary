import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_env_path = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    FIREBASE_CREDENTIALS: str
    FRONTEND_URL: str = "http://localhost:3000"
    ADMIN_EMAILS: str = ""
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str = "admin123"

    # Environment & Messaging
    ENVIRONMENT: str = "development"
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"

    # Ollama Local AI Deal Scoring Model
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "kimi-k3"

    model_config = SettingsConfigDict(
        env_file=str(_env_path) if _env_path.exists() else ".env",
        extra="ignore",
    )


settings = Settings()
