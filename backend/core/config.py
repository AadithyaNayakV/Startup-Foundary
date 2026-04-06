from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # These will automatically load from your .env file
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    FIREBASE_CREDENTIALS: str
    FRONTEND_URL: str = "http://localhost:3000"

    # Tells Pydantic to read the .env file
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()