"""Comprehensive tests for Phase 3: Authentication and Role-Based Access Control (RBAC)."""
from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient, ASGITransport
from jose import jwt

from app.main import app
from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.core.seed import seed_database
from app.models.user import User
from tests.conftest import TestAsyncSession


@pytest.mark.asyncio
async def test_successful_login():
    """Test login with valid demo credentials returns JWT access and refresh tokens."""
    await seed_database(num_customers=5)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/auth/login", json={
            "email": "broker@demo.local",
            "password": "demo1234",
        })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"].lower() == "bearer"


@pytest.mark.asyncio
async def test_wrong_password_rejection():
    """Test login with invalid password returns 401 Unauthorized with safe error."""
    await seed_database(num_customers=5)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/auth/login", json={
            "email": "broker@demo.local",
            "password": "invalid_wrong_password",
        })
    assert res.status_code == 401
    data = res.json()
    assert "detail" in data
    assert "traceback" not in str(data).lower()


@pytest.mark.asyncio
async def test_current_user_me_endpoint():
    """Test GET /auth/me returns authenticated user info and role."""
    await seed_database(num_customers=5)
    
    # Generate token for broker
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == "broker@demo.local"))).first()
        user_id = user.id

    token = create_access_token(user_id, "broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/auth/me", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "broker@demo.local"
    assert data["role"] == "broker"


@pytest.mark.asyncio
async def test_invalid_or_expired_token():
    """Test expired or tampered JWT returns 401 Unauthorized."""
    # 1. Tampered token
    invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/auth/me", headers={"Authorization": f"Bearer {invalid_token}"})
    assert res.status_code == 401

    # 2. Expired token
    expired_payload = {
        "sub": "some-user-id",
        "role": "broker",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        "type": "access",
    }
    expired_token = jwt.encode(expired_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_unauthorized_access_without_token():
    """Test protected endpoints reject unauthenticated requests."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/customers")
    assert res.status_code in (401, 403)


@pytest.mark.asyncio
async def test_broker_role_permissions():
    """Test Broker can view assigned customers, but cannot access admin/manager-only routes."""
    await seed_database(num_customers=5)
    async with TestAsyncSession() as db:
        broker = (await db.execute(User.__table__.select().where(User.email == "broker@demo.local"))).first()

    token = create_access_token(broker.id, "broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Broker allowed to view customers
        cust_res = await client.get("/customers", headers=headers)
        assert cust_res.status_code == 200

        # Broker FORBIDDEN to access admin user management
        admin_res = await client.get("/admin/users", headers=headers)
        assert admin_res.status_code == 403

        # Broker FORBIDDEN to access manager team dashboard
        team_res = await client.get("/dashboard/team", headers=headers)
        assert team_res.status_code == 403

        # Broker FORBIDDEN to create product catalog items
        prod_create_res = await client.post("/products", headers=headers, json={
            "product_code": "PROD-TEST",
            "product_name": "Test",
            "category": "Life",
        })
        assert prod_create_res.status_code == 403


@pytest.mark.asyncio
async def test_manager_role_permissions():
    """Test Manager can view dashboard team summary, but cannot access admin user management."""
    await seed_database(num_customers=5)
    async with TestAsyncSession() as db:
        manager = (await db.execute(User.__table__.select().where(User.email == "manager@demo.local"))).first()

    token = create_access_token(manager.id, "manager")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Manager ALLOWED to view team metrics
        team_res = await client.get("/dashboard/team", headers=headers)
        assert team_res.status_code == 200
        assert "brokers" in team_res.json()

        # Manager FORBIDDEN to access admin user management
        admin_res = await client.get("/admin/users", headers=headers)
        assert admin_res.status_code == 403


@pytest.mark.asyncio
async def test_admin_role_permissions():
    """Test Admin can manage users and catalog products."""
    await seed_database(num_customers=5)
    async with TestAsyncSession() as db:
        admin_user = (await db.execute(User.__table__.select().where(User.email == "admin@demo.local"))).first()

    token = create_access_token(admin_user.id, "admin")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Admin list users
        users_res = await client.get("/admin/users", headers=headers)
        assert users_res.status_code == 200
        assert users_res.json()["total"] >= 4

        # 2. Admin create user
        new_email = "new_broker@demo.local"
        create_res = await client.post("/admin/users", headers=headers, json={
            "email": new_email,
            "password": "demo_password_123",
            "full_name": "นายหน้าคนใหม่",
            "role": "broker",
        })
        assert create_res.status_code == 201
        assert create_res.json()["email"] == new_email

        # 3. Admin create product
        prod_res = await client.post("/products", headers=headers, json={
            "product_code": "KRUNGSRI-NEW-PLAN",
            "product_name": "กรุงศรี แผนใหม่ล่าสุด",
            "category": "Life",
            "min_coverage": 100000.0,
            "max_coverage": 5000000.0,
        })
        assert prod_res.status_code == 201
        assert prod_res.json()["product_code"] == "KRUNGSRI-NEW-PLAN"
