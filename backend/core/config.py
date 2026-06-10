from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    FIREBASE_CREDENTIALS: str
    FRONTEND_URL: str = "http://localhost:3000"
    ADMIN_EMAILS: str = ""

    # ADD THIS: Defaults to development if not specified
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
