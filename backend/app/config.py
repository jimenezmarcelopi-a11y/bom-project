import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:bom_secure_password_2026@postgres:5432/bom_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "bom_super_secret_jwt_key_for_mru_ova_2026")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://ollama:11434")

settings = Settings()
