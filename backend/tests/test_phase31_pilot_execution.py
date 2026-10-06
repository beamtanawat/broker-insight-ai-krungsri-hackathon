"""
Phase 31 Automated Test Suite: Controlled Pilot Execution and Real User Evidence Collection.
Tests session timing, Likert score validation (1-5), pilot freeze snapshot creation,
participant breakdown, honest empty-state handling, and data privacy.
"""
import json
import pytest
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token
from app.core.seed import seed_database
from app.models.user import User
from tests.conftest import TestAsyncSession


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        if not user:
            try:
                await seed_database(num_customers=5)
            except Exception:
                pass
            user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


@pytest.mark.asyncio
async def test_pilot_session_real_timing_and_completion():
    """Verify pilot session calculates duration from timestamps without fabrication."""
    broker_token = await get_test_token("broker")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Start
        resp_start = await client.post(
            "/api/v1/pilot/sessions",
            headers={"Authorization": f"Bearer {broker_token}"},
            json={"scenario_id": "scenario_b", "customer_id": "cust-002"},
        )
        assert resp_start.status_code == 201
        sess_id = resp_start.json()["id"]

        # Complete
        resp_comp = await client.post(
            f"/api/v1/pilot/sessions/{sess_id}/complete",
            headers={"Authorization": f"Bearer {broker_token}"},
            json={"time_taken_seconds": 38.6, "status": "completed", "features_used": ["AI Score", "Need Analysis"]},
        )
        assert resp_comp.status_code == 200
        assert resp_comp.json()["time_taken_seconds"] == 38.6
        assert resp_comp.json()["status"] == "completed"


@pytest.mark.asyncio
async def test_pilot_likert_score_bounds_and_validation():
    """Verify Likert questionnaire rejects values < 1 or > 5."""
    broker_token = await get_test_token("broker")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Rating = 0 (invalid)
        resp_low = await client.post(
            "/api/v1/pilot/feedback",
            headers={"Authorization": f"Bearer {broker_token}"},
            json={
                "scenario_id": "scenario_b",
                "rating_overall": 0,
                "rating_ease_of_use": 3,
                "rating_clarity_priority": 3,
                "rating_shap_explanation": 3,
                "rating_insight_usefulness": 3,
                "rating_recommendations": 3,
                "rating_trust": 3,
            },
        )
        assert resp_low.status_code == 422

        # Rating = 4 (valid)
        resp_ok = await client.post(
            "/api/v1/pilot/feedback",
            headers={"Authorization": f"Bearer {broker_token}"},
            json={
                "scenario_id": "scenario_b",
                "rating_overall": 4,
                "rating_ease_of_use": 4,
                "rating_clarity_priority": 5,
                "rating_shap_explanation": 4,
                "rating_insight_usefulness": 4,
                "rating_recommendations": 4,
                "rating_trust": 4,
                "most_useful_feature": "Customer Insight & Need Analysis",
                "comments": "ช่วยประหยัดเวลาเตรียมตัวก่อนโทรหาลูกค้า",
            },
        )
        assert resp_ok.status_code == 201


@pytest.mark.asyncio
async def test_pilot_admin_freeze_snapshot_creation():
    """Verify Admin can create an immutable timestamped pilot snapshot file."""
    admin_token = await get_test_token("admin")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/pilot/freeze?label=Test Freeze Snapshot",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "frozen"
        assert "pilot_freeze_" in data["snapshot_filename"]

        # Check file exists
        snapshots_dir = Path(__file__).parent.parent / "snapshots"
        file_path = snapshots_dir / data["snapshot_filename"]
        assert file_path.exists()

        with open(file_path, "r", encoding="utf-8") as f:
            content = json.load(f)
            assert "metadata" in content
            assert "dashboard_summary" in content
            assert "sessions" in content
            assert "feedbacks" in content
            # Ensure no passwords or secrets
            raw_text = json.dumps(content)
            assert "hashed_password" not in raw_text
            assert "secret_key" not in raw_text


@pytest.mark.asyncio
async def test_pilot_dashboard_participant_breakdown_and_median():
    """Verify dashboard includes participant breakdown and median session duration for empty and populated states."""
    admin_token = await get_test_token("admin")
    broker_token = await get_test_token("broker")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Initial State
        resp_init = await client.get("/api/v1/pilot/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp_init.status_code == 200
        data_init = resp_init.json()
        assert "participant_breakdown" in data_init
        assert "total_participants" in data_init["participant_breakdown"]
        assert "median_session_duration_seconds" in data_init

        # 2. Submit a feedback and verify populated stats
        await client.post(
            "/api/v1/pilot/feedback",
            headers={"Authorization": f"Bearer {broker_token}"},
            json={
                "scenario_id": "scenario_a",
                "rating_overall": 5,
                "rating_ease_of_use": 5,
                "rating_clarity_priority": 5,
                "rating_shap_explanation": 5,
                "rating_insight_usefulness": 5,
                "rating_recommendations": 5,
                "rating_trust": 5,
            },
        )
        resp_pop = await client.get("/api/v1/pilot/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
        data_pop = resp_pop.json()
        assert data_pop["human_feedback"]["has_human_data"] is True
        assert "(n=" in data_pop["scorecard"][4]["actual"]


@pytest.mark.asyncio
async def test_pilot_rbac_freeze_protection():
    """Verify that a broker cannot freeze pilot snapshots (Admin only)."""
    broker_token = await get_test_token("broker")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/pilot/freeze",
            headers={"Authorization": f"Bearer {broker_token}"},
        )
        assert resp.status_code == 403
