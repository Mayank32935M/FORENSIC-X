"""
FORENSIC-X Backend — Core Configuration
========================================
Loads all settings from environment variables with typed validation.
Uses pydantic-settings for type safety: the app will fail clearly on
startup if required config is missing or invalid.

WHY: Typed config prevents silent misconfigurations. Every setting
has a default suitable for local development, but can be overridden
via .env or environment variables for deployment.

Status: IMPLEMENTED
"""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    All settings are prefixed with FORENSICX_ in the environment.
    For example, FORENSICX_APP_NAME maps to app_name.
    """

    # Application identity
    app_name: str = Field(default="FORENSIC-X", description="Display name of the application")
    version: str = Field(default="0.1.0", description="Application version string")
    env: str = Field(default="development", description="Environment: development | staging | production")
    debug: bool = Field(default=True, description="Enable debug mode (extra logging, stack traces)")
    log_level: str = Field(default="INFO", description="Logging level: DEBUG | INFO | WARNING | ERROR")

    # Database
    database_url: str = Field(
        default="sqlite+aiosqlite:///./forensicx.db",
        description="SQLAlchemy database URL. SQLite for MVP; change to postgresql+asyncpg:// later.",
    )

    # Server
    host: str = Field(default="127.0.0.1", description="Server bind address")
    port: int = Field(default=8000, description="Server bind port")

    # CORS
    cors_origins: list[str] = Field(
        default=["http://localhost:5173"],
        description="Allowed CORS origins for the frontend dev server",
    )

    # Evidence storage paths
    evidence_store_path: str = Field(
        default="./data/evidence_store",
        description="Path to immutable evidence originals (gitignored)",
    )
    working_path: str = Field(
        default="./data/working",
        description="Path to working copies of evidence (gitignored)",
    )

    model_config = {
        "env_prefix": "FORENSICX_",
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


# Singleton settings instance — imported by other modules
settings = Settings()
