"""Pydantic schemas for Advanced Broker and Manager Analytics."""
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel


class ScoreDistributionItem(BaseModel):
    bucket: str
    count: int
    percentage: float


class AnalyticsOverviewResponse(BaseModel):
    role_scope: str  # "broker" | "manager" | "admin"
    user_name: str
    total_customers: int
    high_priority_customers: int
    medium_priority_customers: int
    low_priority_customers: int
    follow_ups_due: int
    follow_ups_completed: int
    follow_ups_overdue: int
    ai_analysis_count: int
    recommendation_count: int
    approval_rate: float
    modification_rate: float
    rejection_rate: float
    as_of: str


class PriorityTrendItem(BaseModel):
    period: str
    high: int
    medium: int
    low: int


class PriorityAnalyticsResponse(BaseModel):
    role_scope: str
    total_scored_customers: int
    priority_distribution: Dict[str, int]
    average_priority_score: float
    score_distribution: List[ScoreDistributionItem]
    priority_trends: List[PriorityTrendItem]
    as_of: str


class NeedCategoryDistributionItem(BaseModel):
    category: str
    label_th: str
    count: int
    percentage: float


class NeedAnalyticsResponse(BaseModel):
    role_scope: str
    total_needs_identified: int
    categories_distribution: List[NeedCategoryDistributionItem]
    top_identified_needs: List[Dict[str, str | int]]
    as_of: str


class RecommendationAnalyticsDetailResponse(BaseModel):
    role_scope: str
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


class FollowUpAnalyticsResponse(BaseModel):
    role_scope: str
    total_follow_ups: int
    due_count: int
    completed_count: int
    overdue_count: int
    upcoming_count: int
    status_distribution: Dict[str, int]
    payment_status_distribution: Dict[str, int]
    as_of: str


class AIUsageAnalyticsResponse(BaseModel):
    role_scope: str
    active_model_version: str
    model_name: str
    total_ai_scoring_requests: int
    total_llm_insight_requests: int
    total_conversation_requests: int
    total_feedback_recorded: int
    feedback_breakdown: Dict[str, int]
    as_of: str
