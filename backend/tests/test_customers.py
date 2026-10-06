"""Tests for customer list, mock endpoints, and profiles."""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.models.customer import Customer, CustomerProfile
from app.models.financial import FinancialProfile
from app.models.user import User
from app.core.security import create_access_token, hash_password
from tests.conftest import TestAsyncSession


@pytest.mark.asyncio
async def test_mock_crm():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/mock/crm/KS-00001")
    assert res.status_code == 200
    data = res.json()
    assert data["external_ref"] == "KS-00001"
    assert "engagement_score" in data


@pytest.mark.asyncio
async def test_mock_financial():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/mock/financial/KS-00001")
    assert res.status_code == 200
    data = res.json()
    assert data["external_ref"] == "KS-00001"
    assert "products" in data


@pytest.mark.asyncio
async def test_authenticated_customer_list():
    # Insert demo user and customer
    async with TestAsyncSession() as db:
        user = User(
            id="u-1",
            email="broker1@demo.local",
            hashed_password=hash_password("demo1234"),
            full_name="สมชาย นายหน้า",
            role="broker",
        )
        db.add(user)
        cust = Customer(
            id="c-1",
            external_ref="KS-00001",
            first_name="นที",
            last_name="วาริน",
            full_name="นที วาริน",
            assigned_broker_id="u-1",
        )
        db.add(cust)
        prof = CustomerProfile(
            customer_id="c-1",
            kyc_status="verified",
            relationship_tier="Platinum",
        )
        db.add(prof)
        fin = FinancialProfile(
            customer_id="c-1",
            total_assets=1500000.0,
            products_held=["บัญชีออมทรัพย์"],
        )
        db.add(fin)
        await db.commit()

    token = create_access_token("u-1", "broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/customers", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert len(data["items"]) >= 1
    assert data["items"][0]["full_name"] == "นที วาริน"
