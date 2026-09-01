"""Pytest fixtures with async SQLite database override."""
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app as fastapi_app
import app.models  # ensure models are imported

TEST_DATABASE_URL = "sqlite+aiosqlite:///file:testdb?mode=memory&cache=shared&uri=true"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False, "uri": True},
    poolclass=StaticPool,
)
TestAsyncSession = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(autouse=True)
async def prepare_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async def override_get_db():
        async with TestAsyncSession() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    import app.core.database
    import app.core.seed
    orig_session = app.core.database.AsyncSessionLocal
    app.core.database.AsyncSessionLocal = TestAsyncSession
    app.core.seed.AsyncSessionLocal = TestAsyncSession

    fastapi_app.dependency_overrides[get_db] = override_get_db
    yield
    fastapi_app.dependency_overrides.clear()
    app.core.database.AsyncSessionLocal = orig_session
    app.core.seed.AsyncSessionLocal = orig_session
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
