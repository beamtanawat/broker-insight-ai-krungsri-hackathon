"""
Phase 25 Test Suite: LLM Cost, Latency, and Quality Optimization.
Tests prompt optimization, token estimation, safe caching, cache invalidation,
cost calculation, performance monitoring endpoint, RBAC, and guardrail preservation.
"""
import json
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.security import create_access_token
from app.core.seed import seed_database
from app.models.user import User
from tests.conftest import TestAsyncSession
from app.ml.llm_optimizer import TokenEstimator, LLMSafeCache, LLMPerformanceTracker, run_llm_optimization_benchmark
from app.services.llm_service import LLMInsightService
from app.services.conversation_service import ConversationAssistantService


async def get_test_token(role: str = "broker") -> str:
    await seed_database(num_customers=5)
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


def test_prompt_construction_and_token_reduction():
    """Verifies that optimized prompt v2.0 uses fewer tokens than unoptimized v1.0."""
    service = LLMInsightService()
    sample_ctx = {
        "external_ref": "CUST-001",
        "full_name": "คุณสมชาย ใจดี",
        "age": 45,
        "occupation": "เจ้าของกิจการ",
        "income_range": "100,001 - 200,000 บาท/เดือน",
        "relationship_tier": "Gold",
        "total_assets": 5000000.0,
        "total_liabilities": 2000000.0,
        "has_active_loan": True,
        "loan_details": "สินเชื่อบ้าน",
        "monthly_savings": 30000.0,
        "policies": ["Krungsri Life 15/25"],
        "score": 85,
        "priority_level": "high",
        "top_factors": ["ภาระสินเชื่อบ้าน", "เงินออมสม่ำเสมอ"],
        "detected_needs": ["คุ้มครองสินเชื่อ", "ลดหย่อนภาษี"],
    }

    v1_prompt = service._build_prompt_payload_v1(sample_ctx)
    v2_prompt = service._build_prompt_payload(sample_ctx)

    tok_v1 = TokenEstimator.estimate_tokens(v1_prompt)
    tok_v2 = TokenEstimator.estimate_tokens(v2_prompt)

    assert tok_v2 < tok_v1
    reduction_pct = (tok_v1 - tok_v2) / tok_v1 * 100.0
    assert reduction_pct >= 15.0, f"Token reduction should be at least 15%, got {reduction_pct:.1f}%"


def test_token_estimator_accuracy():
    """Verifies multilingual token estimation behavior."""
    text_th = "สวัสดีครับ ลูกค้ามีความต้องการประกันชีวิตและสุขภาพ"
    toks = TokenEstimator.estimate_tokens(text_th)
    assert 5 <= toks <= 30

    empty_toks = TokenEstimator.estimate_tokens("")
    assert empty_toks == 0


def test_safe_cache_hit_and_latency_reduction():
    """Verifies content-hashed caching returns instantly on cache hit."""
    cache = LLMSafeCache(ttl_seconds=60)
    customer_data = {"id": "c-101", "age": 40, "total_assets": 1000000, "policies": ["P1"]}

    # Miss on first call
    res1 = cache.get("c-101", customer_data, "insight", "v2.0", "gemini-1.5-flash")
    assert res1 is None
    assert cache.misses == 1

    # Store
    data_to_cache = {"customer_summary": "สรุปข้อมูลการเงิน", "cautions": ["ระมัดระวัง"]}
    cache.set("c-101", customer_data, "insight", "v2.0", "gemini-1.5-flash", data_to_cache)

    # Hit on second call
    res2 = cache.get("c-101", customer_data, "insight", "v2.0", "gemini-1.5-flash")
    assert res2 is not None
    assert res2["cache_hit"] is True
    assert res2["customer_summary"] == "สรุปข้อมูลการเงิน"
    assert cache.hits == 1


def test_cache_invalidation_on_customer_data_change():
    """Verifies changing customer balance sheet produces a cache miss and invalidation works."""
    cache = LLMSafeCache(ttl_seconds=60)
    customer_data_initial = {"id": "c-102", "age": 40, "total_assets": 1000000, "policies": ["P1"]}

    cache.set("c-102", customer_data_initial, "insight", "v2.0", "gemini-1.5-flash", {"summary": "initial"})

    # Modified assets -> different data hash -> cache miss
    customer_data_modified = {"id": "c-102", "age": 40, "total_assets": 5000000, "policies": ["P1"]}
    res_mod = cache.get("c-102", customer_data_modified, "insight", "v2.0", "gemini-1.5-flash")
    assert res_mod is None

    # Explicit invalidation
    cleared_count = cache.invalidate_customer("c-102")
    assert cleared_count >= 1


def test_llm_performance_tracker_and_cost_calculation():
    """Verifies tracker cost aggregation and latency percentiles."""
    tracker = LLMPerformanceTracker()

    tracker.record_call("insight", "gemini-1.5-flash", "v2.0", 300, 200, 15.0, cache_hit=False)
    tracker.record_call("insight", "gemini-1.5-flash", "v2.0", 0, 0, 0.5, cache_hit=True)

    summary = tracker.get_summary()
    assert summary["total_requests"] == 2
    assert summary["cache_hit_rate"] == 50.0
    assert summary["total_estimated_cost_usd"] > 0.0
    assert summary["cost_per_1k_requests_usd"] > 0.0


@pytest.mark.asyncio
async def test_llm_performance_api_endpoint():
    """Verifies GET /model/llm-performance endpoint returns complete metrics."""
    token = await get_test_token("manager")
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/model/llm-performance", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert "active_model" in data
        assert "active_prompt_version" in data
        assert "avg_latency_ms" in data
        assert "cache_metrics" in data
        assert "baseline_vs_optimized" in data
        assert "pricing_rates" in data


@pytest.mark.asyncio
async def test_llm_performance_api_rbac_unauthenticated_rejection():
    """Verifies unauthenticated calls receive HTTP 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/model/llm-performance")
        assert res.status_code == 401


def test_guardrail_and_fallback_preservation():
    """Verifies deterministic fallback structure and safety compliance."""
    insight_service = LLMInsightService()
    conv_service = ConversationAssistantService()

    raw_ctx = {
        "id": "c-999",
        "full_name": "คุณสมศรี ทดสอบ",
        "total_assets": 2000000.0,
        "total_liabilities": 500000.0,
        "has_active_loan": True,
        "policies": [],
    }

    insight = insight_service.generate_insight(raw_ctx)
    assert "customer_summary" in insight
    assert len(insight.get("potential_needs", [])) >= 1
    assert "cautions" in insight

    conv = conv_service.generate_conversation_guide("c-999", raw_ctx)
    assert conv.conversation_objective != ""
    assert len(conv.suggested_questions) >= 2
