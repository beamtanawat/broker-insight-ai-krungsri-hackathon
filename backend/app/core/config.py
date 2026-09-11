"""Application settings loaded from environment variables."""
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Database (Default to local SQLite pilot sandbox, override with PostgreSQL in production)
    DATABASE_URL: str = "sqlite+aiosqlite:///./broker_insight_pilot.db"

    # JWT
    JWT_SECRET_KEY: str = "change_me_to_a_secure_random_key"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # LLM & Optimization (Phase 25)
    GOOGLE_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    LLM_INPUT_COST_PER_1K: float = 0.000075  # USD per 1K input tokens (Gemini 1.5 Flash)
    LLM_OUTPUT_COST_PER_1K: float = 0.00030  # USD per 1K output tokens (Gemini 1.5 Flash)
    LLM_MAX_OUTPUT_TOKENS_INSIGHT: int = 350
    LLM_MAX_OUTPUT_TOKENS_CONVERSATION: int = 400
    LLM_CACHE_ENABLED: bool = True
    LLM_CACHE_TTL_SECONDS: int = 3600

    # Enterprise Caching & Observability (Phase 33)
    REDIS_URL: str = ""
    CACHE_BACKEND: str = "memory"  # "memory" | "redis"
    PROMETHEUS_METRICS_ENABLED: bool = True

    # ML
    SYNTHETIC_CUSTOMER_COUNT: int = 500
    ML_MODEL_VERSION: str = "1.0.0"

    # Pilot & Feature Flags (Phase 29)
    PILOT_MODE: bool = True
    ENABLE_LLM: bool = True
    ENABLE_RECOMMENDATIONS: bool = True
    ENABLE_CONVERSATION_ASSISTANT: bool = True
    ENABLE_ANALYTICS: bool = True
    ENABLE_MODEL_GOVERNANCE: bool = True

    # Security
    ENABLE_DATA_MASKING: bool = True
    RATE_LIMIT_LOGIN_PER_MIN: int = 15
    RATE_LIMIT_AI_PER_MIN: int = 30

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)


settings = Settings()
