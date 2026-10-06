import asyncio
import json
import time
from typing import Any, Dict, List
import numpy as np
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app as fastapi_app
import app.models
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from app.models.customer import Customer

TEST_DATABASE_URL = "sqlite+aiosqlite:///file:loadtestdb?mode=memory&cache=shared&uri=true"
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

async def init_load_db():
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
    app.core.database.AsyncSessionLocal = TestAsyncSession
    app.core.seed.AsyncSessionLocal = TestAsyncSession
    fastapi_app.dependency_overrides[get_db] = override_get_db


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


async def get_sample_customer_id() -> str:
    async with TestAsyncSession() as db:
        cust = (await db.execute(Customer.__table__.select().limit(1))).first()
        return cust.id if cust else "cust-001"


async def benchmark_endpoint(
    client: AsyncClient,
    method: str,
    url: str,
    headers: Dict[str, str],
    payload: Dict[str, Any] = None,
    total_requests: int = 50,
    concurrency: int = 10,
) -> Dict[str, Any]:
    semaphore = asyncio.Semaphore(concurrency)
    durations = []
    status_codes = []
    errors = 0

    async def worker():
        nonlocal errors
        async with semaphore:
            start_t = time.perf_counter()
            try:
                if method.upper() == "GET":
                    res = await client.get(url, headers=headers)
                elif method.upper() == "POST":
                    res = await client.post(url, headers=headers, json=payload)
                else:
                    res = await client.request(method, url, headers=headers, json=payload)

                duration_ms = (time.perf_counter() - start_t) * 1000.0
                durations.append(duration_ms)
                status_codes.append(res.status_code)
                if res.status_code >= 400:
                    errors += 1
            except Exception as e:
                errors += 1
                durations.append((time.perf_counter() - start_t) * 1000.0)

    t0 = time.perf_counter()
    tasks = [asyncio.create_task(worker()) for _ in range(total_requests)]
    await asyncio.gather(*tasks)
    total_time_s = time.perf_counter() - t0

    durations_np = np.array(durations)
    return {
        "endpoint": url,
        "method": method,
        "total_requests": total_requests,
        "concurrency": concurrency,
        "successful_requests": total_requests - errors,
        "failed_requests": errors,
        "error_rate_pct": float(round((errors / total_requests) * 100, 2)),
        "total_time_seconds": float(round(total_time_s, 3)),
        "throughput_rps": float(round(total_requests / total_time_s if total_time_s > 0 else 0, 1)),
        "latency_ms": {
            "min": float(round(np.min(durations_np), 2)) if len(durations_np) > 0 else 0,
            "mean": float(round(np.mean(durations_np), 2)) if len(durations_np) > 0 else 0,
            "p50": float(round(np.percentile(durations_np, 50), 2)) if len(durations_np) > 0 else 0,
            "p95": float(round(np.percentile(durations_np, 95), 2)) if len(durations_np) > 0 else 0,
            "p99": float(round(np.percentile(durations_np, 99), 2)) if len(durations_np) > 0 else 0,
            "max": float(round(np.max(durations_np), 2)) if len(durations_np) > 0 else 0,
        },
    }


async def run_full_load_benchmark() -> List[Dict[str, Any]]:
    await init_load_db()
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}
    cust_id = await get_sample_customer_id()

    endpoints_to_test = [
        ("POST", "/auth/login", {}, {"email": "broker@demo.local", "password": "demo1234"}),
        ("GET", "/customers", headers, None),
        ("GET", f"/customers/{cust_id}", headers, None),
        ("POST", f"/customers/{cust_id}/analyze", headers, None),
        ("GET", "/recommendations/analytics", headers, None),
        ("GET", "/model/metrics", headers, None),
        ("GET", "/analytics/overview", headers, None),
    ]

    results = []
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        for method, url, hdrs, payload in endpoints_to_test:
            res = await benchmark_endpoint(
                client=client,
                method=method,
                url=url,
                headers=hdrs,
                payload=payload,
                total_requests=40,
                concurrency=8,
            )
            results.append(res)
            print(f"[{method}] {url:<35} | RPS: {res['throughput_rps']:>5.1f} | p95: {res['latency_ms']['p95']:>6.2f}ms | Err: {res['error_rate_pct']}%")

    return results


if __name__ == "__main__":
    res = asyncio.run(run_full_load_benchmark())
    with open("load_test_results.json", "w", encoding="utf-8") as f:
        json.dump(res, f, indent=2, ensure_ascii=False)
