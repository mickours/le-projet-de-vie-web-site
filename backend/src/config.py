import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the base directory for default SQLite path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "leprojetdevie.db")


class Settings(BaseSettings):
    # Database Settings
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_PATH}"

    # Paths
    FRONTEND_PATH: Optional[str] = None
    UPLOADS_PATH: Optional[str] = None

    # Authentication Settings
    SECRET_KEY: str = "le-projet-de-vie-super-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS Settings
    ALLOWED_ORIGINS: List[str] = ["*"]

    # TinyMCE API Key
    TINYMCE_API_KEY: str = "no-api-key"

    # Environment Configuration
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True
    )


settings = Settings()
