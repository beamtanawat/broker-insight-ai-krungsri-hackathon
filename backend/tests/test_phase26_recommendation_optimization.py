"""
Automated Test Suite for Phase 26 — Recommendation Optimization and Decision Quality.
Tests pre-ranking hard eligibility gating, existing coverage gap analysis,
structured 4-part explanations, Top-K ranking, confidence scoring,
offline benchmark execution, and recommendation monitoring endpoints.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.security import create_access_token
from app.core.seed import seed_database
from app.models.user import User
from tests.conftest import TestAsyncSession
from app.ml.recommendation_optimizer import (
    RecommendationEngineEvaluator,
    run_recommendation_optimization_suite,
    PRODUCT_CATALOG,
    BENCHMARK_PROFILES,
)
from app.services.matching_service import matching_service


async def get_test_token(role: str = "broker") -> str:
    await seed_database(num_customers=5)
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


# ── 1. Benchmark & Optimizer Suite Tests ──

def test_recommendation_optimization_benchmark_execution():
    """Verify offline benchmark runs and generates candidate artifacts."""
    result = run_recommendation_optimization_suite(save_artifacts=True)
    assert result is not None
    assert result["decision"] == "PROMOTE"
    assert "baseline" in result
    assert "candidates" in result
    assert "evaluation" in result

    eval_data = result["evaluation"]
    comp = eval_data["baseline_vs_candidate_comparison"]
    assert comp["ineligible_recommendation_rate"]["candidate_v1_1"] == 0.0
    assert comp["ineligible_recommendation_rate"]["baseline_v1"] > 0.0
    assert len(eval_data["failure_patterns_eliminated"]) >= 3


def test_pre_ranking_hard_eligibility_gate():
    """Verify ineligible products are never included in Top-K eligible recommendations."""
    evaluator = RecommendationEngineEvaluator()

    # Profile: Elderly customer (68 years old) with no loans
    elderly_profile = {
        "case_id": "TEST-ELDERLY",
        "name": "ทดสอบ ผู้สูงอายุ",
        "age": 68,
        "income": 80.0,
        "assets": 5000000.0,
        "liabilities": 0.0,
        "has_loan": False,
        "loan_type": "",
        "savings": 30000.0,
        "held_policies": [],
        "need_scores": {"Health protection": 0.85, "Life protection": 0.30, "Financial protection": 0.10, "Retirement planning": 0.20},
    }

    recs = evaluator.run_engine_v1_1_candidate(elderly_profile, enforce_hard_gate=True)
    for r in recs:
        assert r["is_eligible"] is True
        assert r["eligibility_status"] == "eligible"
        # MRTA (max age 60) and CI Protect (max age 60) and Retire Smart (max age 55) must NOT be present
        assert r["product_code"] not in ("KRUNGSRI-MORTGAGE-PROT", "KRUNGSRI-CI-PROTECT", "KRUNGSRI-RETIRE-SMART")


def test_existing_coverage_gap_damping_and_warning():
    """Verify holding existing insurance applies damping penalty and attaches coverage review notice."""
    evaluator = RecommendationEngineEvaluator()

    covered_profile = {
        "case_id": "TEST-COVERED",
        "name": "ทดสอบ ถือประกันสุขภาพเต็ม",
        "age": 35,
        "income": 100.0,
        "assets": 4000000.0,
        "liabilities": 0.0,
        "has_loan": False,
        "loan_type": "",
        "savings": 40000.0,
        "held_policies": ["Health", "Protection"],
        "need_scores": {"Health protection": 0.90, "Life protection": 0.85, "Financial protection": 0.10, "Retirement planning": 0.60},
    }

    recs = evaluator.run_engine_v1_1_candidate(covered_profile, enforce_hard_gate=True)
    assert len(recs) > 0

    # Life Plus (no existing life held) should rank #1 over Health Max
    top_rec = recs[0]
    assert top_rec["product_code"] == "KRUNGSRI-LIFE-01"

    # Find Health product in candidates if present and verify gap note
    for r in recs:
        if r["category"] == "Health":
            assert "Coverage Gap" in r["structured_explanation"]["existing_coverage_assessment"]


def test_structured_4_part_explanation_completeness():
    """Verify structured explanation contains all 4 analytical pillars."""
    evaluator = RecommendationEngineEvaluator()
    sample_prof = BENCHMARK_PROFILES[0]

    recs = evaluator.run_engine_v1_1_candidate(sample_prof, enforce_hard_gate=True)
    assert len(recs) > 0

    top_rec = recs[0]
    expl = top_rec["structured_explanation"]
    assert "need_signal" in expl and len(expl["need_signal"]) > 5
    assert "profile_fit" in expl and len(expl["profile_fit"]) > 5
    assert "eligibility_result" in expl and len(expl["eligibility_result"]) > 5
    assert "existing_coverage_assessment" in expl and len(expl["existing_coverage_assessment"]) > 5


def test_top_k_ranking_and_rank_rationale():
    """Verify top-3 candidate limit and rank comparative rationales."""
    evaluator = RecommendationEngineEvaluator()
    sample_prof = BENCHMARK_PROFILES[0]

    recs = evaluator.run_engine_v1_1_candidate(sample_prof, enforce_hard_gate=True)
    assert len(recs) <= 3

    for rank, r in enumerate(recs, start=1):
        assert r["priority_rank"] == rank
        assert "rank_rationale" in r
        if rank == 1:
            assert "อันดับ 1" in r["rank_rationale"]


# ── 2. API Endpoints Integration Tests ──

@pytest.mark.asyncio
async def test_get_recommendation_performance_api():
    """Test GET /api/v1/recommendations/performance endpoint."""
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/recommendations/performance", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["engine_version"] == "recommendation_engine_v1.1"
        assert data["status"] == "promoted_champion"
        assert data["hard_eligibility_gate_active"] is True
        assert data["ineligible_recommendation_rate_pct"] == 0.0
        assert data["top_1_match_rate_pct"] == 100.0


@pytest.mark.asyncio
async def test_get_recommendation_benchmark_api():
    """Test GET /api/v1/recommendations/benchmark endpoint."""
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/recommendations/benchmark", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["baseline_version"] == "recommendation_engine_v1.0"
        assert data["candidate_version"] == "recommendation_engine_v1.1"
        assert "comparison" in data
        assert "failure_patterns_eliminated" in data
        assert len(data["failure_patterns_eliminated"]) >= 3


@pytest.mark.asyncio
async def test_get_recommendation_errors_api():
    """Test GET /api/v1/recommendations/errors endpoint."""
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/recommendations/errors", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total_evaluated_cases"] > 0
        assert "override_reasons_breakdown" in data
        assert "failure_patterns" in data
        assert len(data["failure_patterns"]) >= 3


@pytest.mark.asyncio
async def test_get_recommendation_config_api():
    """Test GET /api/v1/recommendations/config endpoint."""
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/recommendations/config", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["engine_version"] == "recommendation_engine_v1.1"
        assert data["hard_eligibility_gate"] is True
        assert data["weights"]["need_weight"] == 0.50
        assert data["top_k_limit"] == 3


@pytest.mark.asyncio
async def test_customer_recommendations_integration():
    """Test customer product matching endpoint delivers Phase 26 optimized structure."""
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Get customer list first
        cust_res = await ac.get("/api/v1/customers", headers=headers)
        assert cust_res.status_code == 200
        customers = cust_res.json().get("items", [])
        if not customers:
            pytest.skip("No customers available for recommendation integration test")

        cust_id = customers[0]["id"]
        rec_res = await ac.get(f"/api/v1/customers/{cust_id}/recommendations", headers=headers)
        assert rec_res.status_code == 200
        rec_data = rec_res.json()
        assert "recommendations" in rec_data
        recs = rec_data["recommendations"]
        assert len(recs) <= 3

        for r in recs:
            assert r["eligibility_status"] in ("eligible", "needs_verification")
            assert "structured_explanation" in r
            assert r["confidence_level"] in ("high", "medium", "low")
