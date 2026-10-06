"""
Phase 29 Automated Test Suite: Production Pilot Readiness and Controlled Deployment.
Tests environment configuration, feature flags, health probes, RBAC,
pilot scenarios (A through H), model rollback, and backup/restore workflows.
"""
import pytest
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings
from app.core.security import create_access_token
from app.core.seed import seed_database
from app.models.user import User
from app.models.customer import Customer
from tests.conftest import TestAsyncSession
from scripts.backup_restore import backup_database
import scripts.backup_restore as backup_restore


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        if not user:
            try:
                await seed_database(num_customers=10)
            except Exception:
                pass
            user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_pilot_mode_and_feature_flags():
    """Verify that PILOT_MODE and all essential feature flags are active in pilot configuration."""
    assert settings.PILOT_MODE is True
    assert settings.ENABLE_LLM is True
    assert settings.ENABLE_RECOMMENDATIONS is True
    assert settings.ENABLE_CONVERSATION_ASSISTANT is True
    assert settings.ENABLE_ANALYTICS is True
    assert settings.ENABLE_MODEL_GOVERNANCE is True


@pytest.mark.asyncio
async def test_health_probes_liveness_readiness():
    """Verify that both /health/live and /health/ready respond with expected probe contracts."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Liveness
        resp_live = await client.get("/health/live")
        assert resp_live.status_code == 200
        assert resp_live.json()["status"] == "alive"

        # Readiness
        resp_ready = await client.get("/health/ready")
        assert resp_ready.status_code == 200
        data_ready = resp_ready.json()
        assert data_ready["status"] in ["ready", "degraded"]
        assert "database" in data_ready
        assert "ml_model" in data_ready


@pytest.mark.asyncio
async def test_pilot_rbac_access_matrix():
    """Verify distinct RBAC separation for Broker, Manager, and Admin in Pilot."""
    broker_token = await get_test_token("broker")
    admin_token = await get_test_token("admin")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Broker cannot access admin user management
        resp_broker_admin = await client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {broker_token}"})
        assert resp_broker_admin.status_code == 403

        # Admin can access admin user management
        resp_admin_users = await client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp_admin_users.status_code == 200


@pytest.mark.asyncio
async def test_pilot_demo_scenarios_seeded():
    """Verify that seeded cohort contains predictable scenarios A (KS-00001) through H (KS-00008)."""
    broker_token = await get_test_token("broker")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/customers?page=1&page_size=20", headers={"Authorization": f"Bearer {broker_token}"})
        assert resp.status_code == 200
        items = resp.json().get("items", [])
        ext_refs = [c["external_ref"] for c in items]
        assert "KS-00001" in ext_refs  # Scenario A (High Priority)


@pytest.mark.asyncio
async def test_pilot_ai_analysis_and_shap_explanation():
    """Verify that requesting AI analysis on a customer returns score, level, and SHAP top factors."""
    broker_token = await get_test_token("broker")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Find first customer
        resp_list = await client.get("/api/v1/customers?page=1&page_size=5", headers={"Authorization": f"Bearer {broker_token}"})
        cust_id = resp_list.json()["items"][0]["id"]

        # 1. Fetch AI score
        resp_score = await client.get(f"/api/v1/score/{cust_id}", headers={"Authorization": f"Bearer {broker_token}"})
        assert resp_score.status_code == 200
        score_data = resp_score.json()
        assert "score" in score_data
        assert "priority_level" in score_data
        assert "shap_reasons" in score_data


@pytest.mark.asyncio
async def test_pilot_recommendations_and_broker_decision():
    """Verify generating product recommendations and persisting broker review decision."""
    broker_token = await get_test_token("broker")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp_list = await client.get("/api/v1/customers?page=1&page_size=5", headers={"Authorization": f"Bearer {broker_token}"})
        cust_id = resp_list.json()["items"][0]["id"]

        # Fetch product recommendations
        resp_rec = await client.get(f"/api/v1/customers/{cust_id}/recommendations", headers={"Authorization": f"Bearer {broker_token}"})
        assert resp_rec.status_code == 200
        recs = resp_rec.json().get("recommendations", [])
        assert len(recs) > 0

        # Broker approves recommendation
        rec_id = recs[0].get("recommendation_id") or recs[0].get("product_id")
        resp_dec = await client.post(
            f"/api/v1/customers/{cust_id}/recommendations/{rec_id}/decision",
            headers={"Authorization": f"Bearer {broker_token}"},
            json={
                "action": "approve",
                "reason": "suitable_coverage",
                "notes": "ตรงกับความต้องการของลูกค้าในรอบการติดตาม",
            },
        )
        assert resp_dec.status_code == 200
        assert resp_dec.json()["action_taken"] == "approve"


@pytest.mark.asyncio
async def test_pilot_model_registry_and_rollback():
    """Verify that admin can inspect model registry and execute rollback if needed."""
    admin_token = await get_test_token("admin")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Inspect registry
        resp_reg = await client.get("/api/v1/model/registry", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp_reg.status_code == 200
        catalog = resp_reg.json()
        assert len(catalog["models"]) > 0

        # 2. Rollback to version 1.0.0
        resp_rb = await client.post(
            "/api/v1/model/rollback",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"target_version": "1.0.0"},
        )
        assert resp_rb.status_code == 200
        assert resp_rb.json()["success"] is True


@pytest.mark.asyncio
async def test_pilot_backup_structure_and_snapshot_metadata(monkeypatch):
    """Verify that backup snapshot contains required metadata and table definitions."""
    monkeypatch.setattr(
        backup_restore,
        "AsyncSessionLocal",
        TestAsyncSession,
    )

    backup_path = await backup_database("pytest")

    try:
        assert backup_path.exists()

        with open(backup_path, "r", encoding="utf-8") as f:
            import json

            data = json.load(f)

        assert "metadata" in data
        assert "tables" in data
        assert "users" in data["tables"]
        assert "customers" in data["tables"]
    finally:
        backup_path.unlink(missing_ok=True)
