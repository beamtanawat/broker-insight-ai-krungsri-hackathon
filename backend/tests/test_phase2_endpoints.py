"""Comprehensive integration tests for Phase 2 endpoints with auth headers."""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from tests.conftest import TestAsyncSession


async def get_test_auth_headers(role: str = "broker") -> dict:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    token = create_access_token(user_id, role)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_health_endpoint():
    """Test GET /health returns 200 with status ok and timestamp (unauthenticated)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_products_endpoint():
    """Test GET /products returns catalog with categories."""
    await seed_database(num_customers=10)
    headers = await get_test_auth_headers("broker")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/products", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 5
    first_prod = data["items"][0]
    assert "product_code" in first_prod
    assert "product_name" in first_prod
    assert "category" in first_prod


@pytest.mark.asyncio
async def test_dashboard_summary_endpoint():
    """Test GET /dashboard/summary calculates priority breakdown, follow-ups, and KYC stats."""
    await seed_database(num_customers=20)
    headers = await get_test_auth_headers("broker")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/dashboard/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_customers"] >= 0
    assert "priority_breakdown" in data
    assert "high" in data["priority_breakdown"]
    assert "medium" in data["priority_breakdown"]
    assert "low" in data["priority_breakdown"]
    assert "kyc_breakdown" in data
    assert "verified" in data["kyc_breakdown"]
    assert "overdue_followups_count" in data
    assert "total_active_policies" in data


@pytest.mark.asyncio
async def test_customers_list_endpoint():
    """Test GET /customers with pagination and filtering."""
    await seed_database(num_customers=15)
    headers = await get_test_auth_headers("manager")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/customers?page=1&page_size=10", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 10
    item = data["items"][0]
    assert "id" in item
    assert "external_ref" in item
    assert "full_name" in item
    assert "kyc_status" in item


@pytest.mark.asyncio
async def test_customer_detail_and_profile_and_followups():
    """Test GET /customers/{id}, GET /customers/{id}/profile, and GET /customers/{id}/follow-ups."""
    await seed_database(num_customers=10)
    headers = await get_test_auth_headers("manager")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        list_res = await client.get("/customers?page=1&page_size=1", headers=headers)
        customer_id = list_res.json()["items"][0]["id"]

        # 1. Detail
        detail_res = await client.get(f"/customers/{customer_id}", headers=headers)
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["id"] == customer_id
        assert "profile" in detail
        assert "financial_profile" in detail
        assert "insurance_policies" in detail
        assert "needs" in detail

        # 2. Profile
        prof_res = await client.get(f"/customers/{customer_id}/profile", headers=headers)
        assert prof_res.status_code == 200
        prof = prof_res.json()
        assert prof["customer_id"] == customer_id
        assert "profile" in prof
        assert "financial_profile" in prof
        assert "active_policies" in prof

        # 3. Follow-ups
        fu_res = await client.get(f"/customers/{customer_id}/follow-ups", headers=headers)
        assert fu_res.status_code == 200
        fu = fu_res.json()
        assert "items" in fu
        assert "total" in fu
        assert fu["total"] >= 1


@pytest.mark.asyncio
async def test_customer_not_found():
    """Test 404 behavior for invalid customer IDs."""
    await seed_database(num_customers=5)
    headers = await get_test_auth_headers("broker")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/customers/non-existent-id", headers=headers)
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
