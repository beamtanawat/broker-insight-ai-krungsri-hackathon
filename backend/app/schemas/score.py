"""Pydantic schemas for scoring and insights."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class SHAPReason(BaseModel):
    feature: str
    value: Any
    impact: float
    label: str  # Thai human-readable label


class ScoreOut(BaseModel):
    id: str
    customer_id: str
    score: float
    score_display: int
    priority_level: str
    shap_reasons: List[SHAPReason]
    scored_at: datetime
    model_version: str

    model_config = {"from_attributes": True}


class InsightOut(BaseModel):
    id: str
    customer_id: str
    score_id: Optional[str] = None
    insight_text: str
    discussion_topics: List[str]
    model: str
    generated_at: datetime
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class InsightReviewRequest(BaseModel):
    reviewed_by: str


class FollowUpOut(BaseModel):
    id: str
    customer_id: str
    broker_id: str
    renewal_date: Optional[str] = None
    last_contact_date: Optional[str] = None
    payment_status: str
    follow_up_window: Optional[str] = None
    engagement_status: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FollowUpUpdate(BaseModel):
    notes: Optional[str] = None
    status: Optional[str] = None
    payment_status: Optional[str] = None


class ChatMessage(BaseModel):
    content: str
    customer_id: Optional[str] = None
    session_id: Optional[str] = None


class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    timestamp: datetime

    model_config = {"from_attributes": True}
