"""Alembic environment configuration — connects to async PostgreSQL and loads all ORM models."""
import asyncio
import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import Base and all models so Alembic can see them for autogenerate
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app.core.database import Base  # noqa: E402
import app.models  # noqa: F401 — registers all ORM classes

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

from app.core.config import settings

# Allow DATABASE_URL override from environment or app settings
raw_url = os.getenv("DATABASE_URL") or getattr(settings, "DATABASE_URL", "sqlite:///./broker_insight_pilot.db")
if "driver://" in raw_url or not raw_url:
    raw_url = "sqlite:///./broker_insight_pilot.db"

if "asyncpg" in raw_url:
    sync_url = raw_url.replace("postgresql+asyncpg", "postgresql")
elif "aiosqlite" in raw_url:
    sync_url = raw_url.replace("sqlite+aiosqlite", "sqlite")
else:
    sync_url = raw_url

config.set_main_option("sqlalchemy.url", sync_url)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = context.config.attributes.get("connection", None)
    if connectable is None:
        from sqlalchemy import create_engine
        connectable = create_engine(
            config.get_main_option("sqlalchemy.url"), poolclass=pool.NullPool
        )
    with connectable.connect() as connection:
        do_run_migrations(connection)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
