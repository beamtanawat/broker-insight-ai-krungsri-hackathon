"""Pydantic schemas for dashboard summary endpoint."""
from typing import Dict, Any
from pydantic import BaseModel


class PriorityBreakdown(BaseModel):
    high: int
    medium: int
    low: int
    unscored: int


class KYCBreakdown(BaseModel):
    verified: int
    pending: int
    rejected: int


class DashboardSummaryResponse(BaseModel):
    total_customers: int
    priority_breakdown: PriorityBreakdown
    overdue_followups_count: int
    open_followups_count: int
    kyc_breakdown: KYCBreakdown
    total_active_policies: int
    total_coverage_amount: float
    total_products_available: int
    as_of: str
