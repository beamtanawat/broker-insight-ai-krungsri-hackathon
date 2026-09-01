"""
Pydantic Schemas for Pilot Evaluation and User Feedback (Phase 30).
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


# ── Pilot Session Schemas ──
class PilotSessionCreate(BaseModel):
    scenario_id: str = Field(..., description="Pilot scenario ID (e.g. scenario_a, scenario_b)")
    customer_id: Optional[str] = Field(None, description="Associated customer UUID or ref")


class PilotSessionComplete(BaseModel):
    time_taken_seconds: float = Field(..., ge=0.0, description="Time spent completing the scenario in seconds")
    status: str = Field("completed", description="Session status: completed or abandoned")
    features_used: Optional[List[str]] = Field(default=[], description="List of major features used during the session")


class PilotSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    scenario_id: str
    customer_id: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    time_taken_seconds: Optional[float] = None
    features_used: Optional[List[str]] = None
    created_at: datetime


# ── Pilot Feedback Questionnaire Schemas ──
class PilotFeedbackCreate(BaseModel):
    scenario_id: str = Field(..., description="Scenario ID evaluated")
    rating_overall: int = Field(..., ge=1, le=5, description="Overall usefulness (1-5)")
    rating_ease_of_use: int = Field(..., ge=1, le=5, description="Ease of use (1-5)")
    rating_clarity_priority: int = Field(..., ge=1, le=5, description="Clarity of customer priority (1-5)")
    rating_shap_explanation: int = Field(..., ge=1, le=5, description="Usefulness of SHAP explanation (1-5)")
    rating_insight_usefulness: int = Field(..., ge=1, le=5, description="Usefulness of customer insight (1-5)")
    rating_recommendations: int = Field(..., ge=1, le=5, description="Usefulness of product recommendations (1-5)")
    rating_trust: int = Field(..., ge=1, le=5, description="Trust in AI outputs (1-5)")

    most_useful_feature: Optional[str] = Field(None, description="Most useful feature identified by broker")
    least_useful_feature: Optional[str] = Field(None, description="Least useful or unnecessary feature")
    confusing_part: Optional[str] = Field(None, description="Confusing or unclear parts")
    comments: Optional[str] = Field(None, description="Additional qualitative feedback or suggestions")


class PilotFeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: Optional[str] = None
    user_id: str
    scenario_id: str
    rating_overall: int
    rating_ease_of_use: int
    rating_clarity_priority: int
    rating_shap_explanation: int
    rating_insight_usefulness: int
    rating_recommendations: int
    rating_trust: int
    most_useful_feature: Optional[str] = None
    least_useful_feature: Optional[str] = None
    confusing_part: Optional[str] = None
    comments: Optional[str] = None
    created_at: datetime


# ── Pilot Issue Logging Schemas ──
class PilotIssueCreate(BaseModel):
    severity: str = Field(..., description="P0 (Critical), P1 (Major), P2 (Enhancement)")
    scenario_id: Optional[str] = Field(None, description="Associated scenario ID")
    component: str = Field(..., description="System component (e.g. AI Score, Need Analysis, UI, Tracing)")
    description: str = Field(..., description="Clear description of the issue or anomaly")
    steps_to_reproduce: Optional[str] = Field(None, description="Steps to reproduce")
    request_id: Optional[str] = Field(None, description="X-Request-ID from headers or logs")

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in {"P0", "P1", "P2"}:
            raise ValueError("Severity must be one of: P0, P1, P2")
        return v_upper


class PilotIssueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: Optional[str] = None
    user_id: str
    severity: str
    scenario_id: Optional[str] = None
    component: str
    description: str
    steps_to_reproduce: Optional[str] = None
    request_id: Optional[str] = None
    status: str
    created_at: datetime


# ── Pilot Dashboard Aggregation Schemas ──
class TechnicalKPIs(BaseModel):
    api_error_rate: float
    p50_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    system_availability_pct: float
    failed_requests_count: int


class AIQualityKPIs(BaseModel):
    model_name: str
    model_version: str
    f1_score: float
    roc_auc: float
    brier_score: float
    calibration_ece: float
    recommendation_ineligible_rate: float
    llm_fallback_rate: float
    guardrail_violation_rate: float


class HumanFeedbackAggregates(BaseModel):
    total_feedback_count: int
    has_human_data: bool
    status_label: str  # "Awaiting pilot data" or "Active Pilot Feedback"
    avg_overall_usefulness: Optional[float] = None
    avg_ease_of_use: Optional[float] = None
    avg_clarity_priority: Optional[float] = None
    avg_shap_usefulness: Optional[float] = None
    avg_insight_usefulness: Optional[float] = None
    avg_recommendation_usefulness: Optional[float] = None
    avg_trust_score: Optional[float] = None
    top_useful_features: List[Dict[str, Any]] = []
    top_confusing_parts: List[str] = []


class PilotScorecardRow(BaseModel):
    dimension: str
    metric: str
    target: str
    actual: str
    status: str  # PASS, PENDING, REVIEW


class ParticipantBreakdown(BaseModel):
    total_participants: int
    broker_participants: int
    manager_participants: int
    admin_participants: int


class PilotDashboardResponse(BaseModel):
    environment: str
    pilot_mode: bool
    total_sessions: int
    completed_sessions: int
    avg_session_duration_seconds: Optional[float] = None
    median_session_duration_seconds: Optional[float] = None
    participant_breakdown: ParticipantBreakdown
    technical_kpis: TechnicalKPIs
    ai_quality_kpis: AIQualityKPIs
    human_feedback: HumanFeedbackAggregates
    scorecard: List[PilotScorecardRow]
    recent_issues: List[PilotIssueOut]
    generated_at: str


class PilotSnapshotResponse(BaseModel):
    pilot_version: str
    snapshot_filename: str
    created_at: str
    total_sessions: int
    total_feedbacks: int
    total_issues: int
    status: str

