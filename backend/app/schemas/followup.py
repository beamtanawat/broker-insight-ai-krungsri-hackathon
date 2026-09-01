"""Pydantic schemas for follow-up endpoints."""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class FollowUpOut(BaseModel):
    id: str
    customer_id: str
    broker_id: Optional[str] = None
    scheduled_date: Optional[date] = None
    last_contact_date: Optional[date] = None
    follow_up_window: Optional[str] = None
    status: str
    priority: str
    payment_status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FollowUpListResponse(BaseModel):
    items: List[FollowUpOut]
    total: int
