"""
Pydantic Schemas for Pilot Data Analysis and Evidence Validation Layer (Phase 32).
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class DataQualityReport(BaseModel):
    total_sessions_checked: int
    total_feedbacks_checked: int
    total_issues_checked: int
    valid_records_count: int
    invalid_records_count: int
    duplicate_records_count: int
    anomalies: List[str] = []
    quality_status: str  # e.g. "VALIDATED - 100% Data Integrity"


class LikertQuestionAnalysis(BaseModel):
    question_key: str
    question_title: str
    sample_size: int
    mean: Optional[float] = None
    median: Optional[float] = None
    std_dev: Optional[float] = None
    distribution: Dict[int, int]  # score 1 -> count, 2 -> count, ...
    response_rate_pct: float
    confidence_status: str  # "Awaiting pilot data", "Insufficient sample for reliable statistical inference", or "Reliable sample"


class LikertAnalysisReport(BaseModel):
    has_human_data: bool
    total_responses: int
    status_label: str
    questions: List[LikertQuestionAnalysis]


class ScenarioAnalysisRow(BaseModel):
    scenario_id: str
    scenario_name: str
    customer_ref: str
    sessions_started: int
    sessions_completed: int
    completion_rate_pct: float
    avg_duration_seconds: Optional[float] = None
    median_duration_seconds: Optional[float] = None
    feedback_count: int
    issue_count: int
    decisions: Dict[str, int] = {"approve": 0, "modify": 0, "reject": 0}


class DecisionAnalysisReport(BaseModel):
    total_decisions: int
    approve_count: int
    modify_count: int
    reject_count: int
    approve_rate_pct: float
    modify_rate_pct: float
    reject_rate_pct: float
    override_rate_pct: float
    top_modify_reasons: List[Dict[str, Any]] = []
    top_reject_reasons: List[Dict[str, Any]] = []


class EvidenceQualityRow(BaseModel):
    evidence_area: str
    status: str  # "VERIFIED", "INSUFFICIENT DATA", "PENDING"
    sample_size: str
    confidence: str
    source: str


class PilotAnalysisSummaryResponse(BaseModel):
    analysis_version: str
    generated_at: str
    data_quality: DataQualityReport
    human_sample_size: int
    sessions_count: int
    scenarios_coverage: int
    likert_summary: LikertAnalysisReport
    decision_summary: DecisionAnalysisReport
    scenario_breakdown: List[ScenarioAnalysisRow]
    technical_summary: Dict[str, Any]
    ai_evidence_summary: Dict[str, Any]
    evidence_scorecard: List[EvidenceQualityRow]
    final_evidence_decision: str  # "INSUFFICIENT EVIDENCE", "PASS WITH IMPROVEMENTS", "PASS", "FAIL/BLOCKED"
    decision_rationale: str
