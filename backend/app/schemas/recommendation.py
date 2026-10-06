"""Pydantic schemas for AI Insights, Need Analysis, Product Matching, Broker Decisions, and Optimization Analytics (Phases 6, 11, 26)."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator


# ── 1. LLM Customer Insight Schemas ──
class LLMInsightResponse(BaseModel):
    customer_id: str
    customer_summary: str
    key_observations: List[str]
    potential_needs: List[str]
    conversation_topics: List[str]
    cautions: List[str]
    provider: str  # "gemini-1.5-flash" | "deterministic_rule_engine"
    model_version: str
    generated_at: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None


# ── 2. Need Analysis Schemas ──
class NeedCategoryScore(BaseModel):
    category: str  # Health protection, Life protection, Financial protection, Retirement planning, Coverage review
    label_th: str
    score: float  # 0.0 - 1.0
    severity: str  # high, medium, low, none
    supporting_signals: List[str]
    explanation: str


class CustomerNeedAnalysisResponse(BaseModel):
    customer_id: str
    external_ref: str
    full_name: str
    overall_need_summary: str
    needs: List[NeedCategoryScore]
    evaluated_at: str
    disclaimer: str = "Potential needs are AI-assisted indicators. Broker discretion is required."


# ── 3. Product Matching & Recommendation Schemas (Phase 26 Optimized) ──
class StructuredExplanation(BaseModel):
    need_signal: str
    profile_fit: str
    eligibility_result: str
    existing_coverage_assessment: str


class ProductMatchOut(BaseModel):
    recommendation_id: Optional[str] = None
    product_id: str
    product_code: str
    product_name: str
    category: str
    match_score: int  # 0 - 100
    eligibility_status: str  # eligible, needs_verification, ineligible
    reasons: List[str]
    unmet_criteria: List[str]
    coverage_range: str
    status: str = "proposed"  # proposed, accepted, modified, rejected
    priority_rank: int = 1
    confidence_level: str = "high"  # high, medium, low
    missing_information: List[str] = []
    structured_explanation: Optional[StructuredExplanation] = None
    rank_rationale: Optional[str] = None


class CustomerRecommendationsResponse(BaseModel):
    customer_id: str
    external_ref: str
    full_name: str
    recommendations: List[ProductMatchOut]
    generated_at: str
    disclaimer: str = "This is an AI-assisted recommendation match, not a final sales decision."


# ── 4. Broker Decision Schemas (Phase 11 Enhanced) ──
VALID_DECISION_ACTIONS = {"approve", "modify", "reject", "accepted", "modified", "declined"}

class BrokerDecisionCreate(BaseModel):
    action: str = Field(..., description="Decision action: approve, modify, or reject")
    reason: Optional[str] = Field(None, description="Structured reason for the decision")
    feedback: Optional[str] = Field(None, description="Additional feedback or notes")
    adjusted_coverage: Optional[float] = None
    notes: Optional[str] = None

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in VALID_DECISION_ACTIONS:
            raise ValueError(f"Invalid decision action '{v}'. Must be 'approve', 'modify', or 'reject'.")
        return clean


class BrokerDecisionOut(BaseModel):
    id: str
    customer_id: str
    recommendation_id: Optional[str] = None
    product_id: Optional[str] = None
    action_taken: str
    reason: Optional[str] = None
    ai_recommendation: Optional[str] = None
    feedback: Optional[str] = None
    decision_date: datetime
    broker_id: str
    broker_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ── 5. Recommendation Analytics Schemas ──
class RecommendationAnalyticsResponse(BaseModel):
    total_recommendations: int
    total_decisions: int
    approval_count: int
    approval_rate: float
    modification_count: int
    modification_rate: float
    rejection_count: int
    rejection_rate: float
    recommendations_by_category: Dict[str, int]
    common_modification_reasons: Dict[str, int]
    common_rejection_reasons: Dict[str, int]
    common_approval_reasons: Dict[str, int]
    as_of: str


# ── 6. Phase 26 Recommendation Optimization & Governance Schemas ──
class RecommendationPerformanceResponse(BaseModel):
    engine_version: str
    status: str
    total_recommendations: int
    total_decisions: int
    approval_rate_pct: float
    modification_rate_pct: float
    rejection_rate_pct: float
    top_1_match_rate_pct: float
    top_k_match_rate_pct: float
    ineligible_recommendation_rate_pct: float
    recommendation_coverage_pct: float
    avg_recommendation_latency_ms: float
    hard_eligibility_gate_active: bool
    as_of: str


class RecommendationBenchmarkResponse(BaseModel):
    baseline_version: str
    candidate_version: str
    promoted_status: str
    evaluation_timestamp: str
    comparison: Dict[str, Any]
    candidate_metrics: Dict[str, Any]
    failure_patterns_eliminated: List[str]


class RecommendationErrorAnalysisResponse(BaseModel):
    total_evaluated_cases: int
    total_broker_overrides: int
    override_rate_pct: float
    override_reasons_breakdown: Dict[str, int]
    override_rate_by_category: Dict[str, float]
    override_rate_by_segment: Dict[str, float]
    failure_patterns: List[Dict[str, Any]]
    representative_cases: List[Dict[str, Any]]


class RecommendationConfigResponse(BaseModel):
    engine_version: str
    hard_eligibility_gate: bool
    weights: Dict[str, float]
    coverage_gap_penalty: float
    top_k_limit: int
    active_catalog_products_count: int
