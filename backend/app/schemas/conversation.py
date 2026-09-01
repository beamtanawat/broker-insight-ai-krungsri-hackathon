"""Pydantic schemas for Conversation Assistant and Follow-ups."""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class ModelTraceabilityOut(BaseModel):
    model_name: str
    model_version: str
    timestamp: str
    provider: str
    disclaimer: str = "This conversation guide is an AI-assisted suggestion. The broker controls the final communication."


class ConversationAssistantResponse(BaseModel):
    customer_id: str
    customer_name: str
    external_ref: str
    conversation_objective: str
    suggested_opening: str
    suggested_questions: List[str]
    topics_to_explore: List[str]
    potential_concerns: List[str]
    follow_up_questions: List[str]
    model_metadata: ModelTraceabilityOut


class FollowUpCreate(BaseModel):
    scheduled_date: Optional[date] = None
    follow_up_window: Optional[str] = "Within 7 days"
    status: str = "open"
    priority: str = "medium"
    payment_status: str = "pending"
    notes: Optional[str] = None


class FollowUpUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    follow_up_window: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None


class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    timestamp: datetime
    user_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CustomerAuditHistoryResponse(BaseModel):
    customer_id: str
    total_events: int
    events: List[AuditLogOut]
