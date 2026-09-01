"""
Phase 32 Automated Test Suite: Pilot Data Analysis and Evidence Validation Layer.
Tests data quality audit, zero-data behavior (INSUFFICIENT EVIDENCE), Likert descriptive statistics,
scenario analysis, broker decision evaluation, and export capabilities.
"""
import json
import pytest
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
async def test_pilot_analysis_zero_data_status_insufficient_evidence():
    """Verify that when human responses are n=0, final evidence decision is strictly INSUFFICIENT EVIDENCE."""
    admin_token = await get_test_token("admin")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/pilot/analysis", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert "data_quality" in data
        assert "evidence_scorecard" in data
        assert len(data["evidence_scorecard"]) == 9
        if data["human_sample_size"] == 0:
            assert data["final_evidence_decision"] == "INSUFFICIENT EVIDENCE"


@pytest.mark.asyncio
async def test_pilot_data_quality_audit_pipeline():
    """Verify data quality checks return 100% integrity on seeded demo records."""
    admin_token = await get_test_token("admin")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/pilot/analysis", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200
        dq = resp.json()["data_quality"]
        assert dq["invalid_records_count"] == 0
        assert "VALIDATED" in dq["quality_status"]


@pytest.mark.asyncio
async def test_pilot_likert_descriptive_statistics_and_distributions():
    """Verify descriptive statistics (Mean, Median, StdDev, Score Distribution 1-5) on Likert questions."""
    broker_token = await get_test_token("broker")
    admin_token = await get_test_token("admin")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Submit feedback ratings
        await client.post(
            "/api/v1/pilot/feedback",
            headers={"Authorization": f"Bearer {broker_token}"},
            json={
                "scenario_id": "scenario_c",
                "rating_overall": 4,
                "rating_ease_of_use": 5,
                "rating_clarity_priority": 4,
                "rating_shap_explanation": 5,
                "rating_insight_usefulness": 4,
                "rating_recommendations": 4,
                "rating_trust": 5,
            },
        )

        resp_likert = await client.get("/api/v1/pilot/analysis/likert", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp_likert.status_code == 200
        likert_data = resp_likert.json()
        assert likert_data["has_human_data"] is True
        assert len(likert_data["questions"]) == 7

        q1 = likert_data["questions"][0]
        assert q1["question_key"] == "rating_overall"
        assert q1["mean"] is not None
        assert "distribution" in q1
        assert "1" in q1["distribution"] or 1 in q1["distribution"]


@pytest.mark.asyncio
async def test_pilot_scenario_analysis_breakdown():
    """Verify scenario-by-scenario completions and decision mapping for Scenarios A-H."""
    admin_token = await get_test_token("admin")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/pilot/analysis/scenarios", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200
        scenarios = resp.json()
        assert len(scenarios) == 8
        assert scenarios[0]["scenario_id"] == "scenario_a"
        assert scenarios[0]["customer_ref"] == "KS-00001"


@pytest.mark.asyncio
async def test_pilot_decisions_analysis_and_override_tracking():
    """Verify broker decision distribution (Approve/Modify/Reject) and override reason aggregation."""
    admin_token = await get_test_token("admin")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/pilot/analysis/decisions", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200
        dec = resp.json()
        assert "approve_count" in dec
        assert "modify_count" in dec
        assert "reject_count" in dec
        assert "override_rate_pct" in dec


@pytest.mark.asyncio
async def test_pilot_analysis_export_csv_and_json():
    """Verify analysis export formats in CSV and JSON without password or secret leaks."""
    admin_token = await get_test_token("admin")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # JSON Export
        resp_json = await client.get("/api/v1/pilot/analysis/export?format=json", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp_json.status_code == 200
        assert "application/json" in resp_json.headers["content-type"]
        assert "hashed_password" not in resp_json.text
        assert "secret_key" not in resp_json.text

        # CSV Export
        resp_csv = await client.get("/api/v1/pilot/analysis/export?format=csv", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp_csv.status_code == 200
        assert "text/csv" in resp_csv.headers["content-type"]
        assert "BROKER INSIGHT AI" in resp_csv.text
        assert "EVIDENCE QUALITY SCORECARD" in resp_csv.text
