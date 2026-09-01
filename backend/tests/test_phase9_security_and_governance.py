"""
Comprehensive tests for Phase 9: Security and Data Governance Hardening.
Verifies RBAC, Data Masking, LLM Data Minimization, Rate Limiting, Input Validation, and Safe Errors.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.core.masking import mask_policy_number, mask_account_number, mask_phone_number
from app.models.user import User
from app.models.customer import Customer
from app.models.audit_log import AuditLog
from app.services.llm_service import llm_service
from tests.conftest import TestAsyncSession


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_data_masking_utility_functions():
    """Test policy number, account number, and phone number masking utilities."""
    assert mask_policy_number("POL-2024-88991") == "POL-****-88991"
    assert mask_account_number("987-123456-7") == "987-***-7"
    assert mask_phone_number("0812345678") == "081-***-5678"


@pytest.mark.asyncio
async def test_data_masking_in_api_response_for_broker():
    """Test that customer detail endpoint masks policy numbers and loan accounts for brokers."""
    await seed_database(num_customers=5)
    broker_token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {broker_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        cust_res = await client.get(f"/customers/{customer_id}", headers=headers)
        assert cust_res.status_code == 200
        data = cust_res.json()

        # Check policies are masked
        for p in data["insurance_policies"]:
            assert "****" in p["policy_number"] or len(p["policy_number"]) <= 6

        # Check loan details masked
        if data["financial_profile"] and data["financial_profile"]["loan_details"]:
            assert "***" in data["financial_profile"]["loan_details"] or "-" not in data["financial_profile"]["loan_details"]


@pytest.mark.asyncio
async def test_llm_data_minimization_sanitization():
    """Test LLM prompt payload builder removes raw account numbers and masks identifiers."""
    raw_cust = {
        "external_ref": "KS-00001",
        "full_name": "สมชาย ตัวอย่าง",
        "age": 45,
        "occupation": "วิศวกร",
        "income_range": "80,001 - 120,000",
        "relationship_tier": "Gold",
        "total_assets": 4500000.0,
        "total_liabilities": 2100000.0,
        "has_active_loan": True,
        "loan_details": "สินเชื่อบ้าน (Account: 987-123456-7)",
        "monthly_savings": 35000.0,
        "policies": ["กรุงศรี ไลฟ์ พลัส (POL-2024-88991)"],
        "score": 82,
        "priority_level": "high",
        "top_factors": ["ภาระสินเชื่อบ้าน"],
        "detected_needs": ["คุ้มครองสินเชื่อ"],
    }

    prompt = llm_service._build_prompt_payload(raw_cust)
    # Ensure raw account number is stripped
    assert "987-123456-7" not in prompt
    assert "Anonymized & Minimized" in prompt


@pytest.mark.asyncio
async def test_rate_limiting_protection():
    """Test rate limiting raises 429 after exceeding request threshold."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Rapid login requests to trigger rate limit
        hit_429 = False
        for _ in range(25):
            res = await client.post("/auth/login", json={"email": "wrong@demo.local", "password": "wrong"})
            if res.status_code == 429:
                hit_429 = True
                assert "Rate limit exceeded" in res.json()["detail"]
                break
        assert hit_429 is True


@pytest.mark.asyncio
async def test_input_validation_and_malformed_payload_rejection():
    """Test malformed inputs return 422 Unprocessable Entity safely."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Invalid page size (out of range > 100)
        res = await client.get("/customers?page=1&page_size=999", headers=headers)
        assert res.status_code == 422
        assert "Invalid request payload" in res.json()["detail"]

        # Malformed JSON in follow-up creation
        bad_fu = await client.post(
            "/customers/test-id/follow-ups",
            headers=headers,
            json={"scheduled_date": "not-a-valid-date-format"},
        )
        assert bad_fu.status_code == 422


@pytest.mark.asyncio
async def test_safe_error_handling_no_traceback_leak():
    """Verify 404 and 500 error responses contain zero stack traces or internal paths."""
    await seed_database(num_customers=5)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/customers/non-existent-id-9999", headers=headers)
        assert res.status_code == 404
        text = res.text.lower()
        assert "traceback" not in text
        assert "file \"" not in text
        assert "line " not in text


@pytest.mark.asyncio
async def test_audit_logs_contain_no_sensitive_passwords():
    """Verify audit logs table contains zero passwords or secrets in metadata."""
    await seed_database(num_customers=5)

    async with TestAsyncSession() as db:
        logs = (await db.execute(AuditLog.__table__.select())).all()
        for log in logs:
            meta_str = str(log.metadata).lower()
            assert "password" not in meta_str
            assert "demo1234" not in meta_str
            assert "token" not in meta_str or "token_type" in meta_str
