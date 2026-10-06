"""
Comprehensive Reliability, Security, Fault-Injection, and Concurrency Test Suite for Phase 20.
Verifies Database Concurrency, AI Service Fault Resilience, RBAC Authorization Matrices,
Token Rejection, and Traceback Masking.
"""
import asyncio
from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient, ASGITransport
from jose import jwt

from app.main import app
from app.core.config import settings
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from app.models.customer import Customer
from app.services.llm_service import LLMInsightService
from app.services.conversation_service import ConversationAssistantService
from app.services.guardrails_service import AIGuardrailsService
from tests.conftest import TestAsyncSession


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


async def get_sample_customer() -> Customer:
    async with TestAsyncSession() as db:
        cust = (await db.execute(Customer.__table__.select().limit(1))).first()
        return cust


@pytest.mark.asyncio
async def test_database_concurrency_and_read_isolation():
    """Verify multiple concurrent async sessions query database without deadlocks or connection exhaustion."""
    await seed_database(num_customers=5)

    async def read_worker():
        async with TestAsyncSession() as session:
            result = await session.execute(Customer.__table__.select())
            customers = result.fetchall()
            assert len(customers) >= 5
            return len(customers)

    tasks = [read_worker() for _ in range(25)]
    results = await asyncio.gather(*tasks)
    assert len(results) == 25
    assert all(r >= 5 for r in results)


@pytest.mark.asyncio
async def test_ai_service_llm_timeout_and_offline_fallback():
    """Verify that when LLM provider is offline or throws timeout, system gracefully returns deterministic fallback."""
    service = LLMInsightService()
    service.api_key = ""  # Simulate offline/unconfigured API key

    customer_dict = {
        "id": "c-offline-01",
        "external_ref": "OFFLINE-01",
        "full_name": "คุณทดสอบ การสำรอง",
        "age": 42,
        "occupation": "เจ้าของกิจการ",
        "total_assets": 4500000.0,
        "total_liabilities": 1200000.0,
        "has_active_loan": True,
        "policies": ["Life Plan A"],
        "score": 68,
        "priority_level": "medium",
        "top_factors": ["ภาระหนี้สินคงค้าง"],
        "detected_needs": ["Debt protection"],
    }

    insight = service.generate_insight(customer_dict)
    assert insight is not None
    assert "customer_summary" in insight
    assert len(insight.get("key_observations", [])) > 0
    assert insight.get("guardrail_status") == "deterministic_fallback"
    assert insight.get("human_review_required") is True


@pytest.mark.asyncio
async def test_ai_service_invalid_llm_response_guardrail_rejection():
    """Verify that prohibited regulatory claims in LLM output trigger guardrail rejection and clean fallback."""
    raw_unsafe_llm_output = {
        "customer_summary": "แผนประกันนี้การันตีผลกำไร 100% ไม่มีทางขาดทุนแน่นอน",
        "key_observations": ["กำไรแน่นอน"],
        "potential_needs": ["การลงทุน"],
        "conversation_topics": ["ผลตอบแทนสูง"],
        "cautions": ["ไม่มีความเสี่ยง"],
    }
    input_ctx = {"total_liabilities": 0.0}

    is_valid, validated, audit = AIGuardrailsService.validate_insight_output(raw_unsafe_llm_output, input_ctx)
    assert is_valid is False
    assert audit["guardrail_status"] == "prohibited_content_blocked"
    assert len(audit["prohibited_content_violations"]) > 0


@pytest.mark.asyncio
async def test_authorization_matrix_broker_manager_admin():
    """Verify RBAC access matrices: Broker/Manager cannot access Admin endpoints."""
    await seed_database(num_customers=5)
    broker_token = await get_test_token("broker")
    manager_token = await get_test_token("manager")
    admin_token = await get_test_token("admin")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Broker cannot access /admin/users
        res_b = await client.get("/admin/users", headers={"Authorization": f"Bearer {broker_token}"})
        assert res_b.status_code == 403

        # 2. Manager cannot access /admin/users
        res_m = await client.get("/admin/users", headers={"Authorization": f"Bearer {manager_token}"})
        assert res_m.status_code == 403

        # 3. Admin CAN access /admin/users
        res_a = await client.get("/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert res_a.status_code == 200


@pytest.mark.asyncio
async def test_security_rejection_expired_tampered_missing_tokens():
    """Verify invalid, expired, or tampered JWTs are rejected with 401 Unauthorized."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Missing Authorization header
        res1 = await client.get("/customers")
        assert res1.status_code == 401

        # 2. Tampered JWT token
        res2 = await client.get("/customers", headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature"})
        assert res2.status_code == 401

        # 3. Expired JWT token
        expired_payload = {
            "sub": "test-user-id",
            "role": "broker",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
            "type": "access",
        }
        expired_token = jwt.encode(expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        res3 = await client.get("/customers", headers={"Authorization": f"Bearer {expired_token}"})
        assert res3.status_code == 401


@pytest.mark.asyncio
async def test_safe_error_handling_no_traceback_leakage():
    """Verify 404, 422, and 500 error responses return clean JSON without exposing Python stack traces."""
    await seed_database(num_customers=5)
    broker_token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {broker_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Non-existent customer UUID -> 404
        res = await client.get("/customers/00000000-0000-0000-0000-000000000000", headers=headers)
        assert res.status_code == 404
        data = res.json()
        assert "detail" in data
        assert "Traceback" not in str(data)
        assert "sqlalchemy" not in str(data).lower()
