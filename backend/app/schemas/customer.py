"""Pydantic schemas for customer and profile endpoints."""
from datetime import datetime, date
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, ConfigDict


class CustomerProfileOut(BaseModel):
    id: str
    customer_id: str
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    income_range: Optional[str] = None
    kyc_status: str
    kyc_channel: Optional[str] = None
    risk_tolerance: Optional[str] = None
    relationship_tier: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FinancialProfileOut(BaseModel):
    id: str
    customer_id: str
    total_assets: float
    total_liabilities: float
    monthly_savings: float
    has_active_loan: bool
    loan_details: Optional[str] = None
    products_held: List[Any] = []
    transaction_frequency_90d: int
    last_financial_activity: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class InsurancePolicyOut(BaseModel):
    id: str
    customer_id: str
    policy_number: str
    policy_type: str
    coverage_amount: float
    premium_amount: float
    start_date: Optional[date] = None
    renewal_date: Optional[date] = None
    status: str
    payment_status: str
    remarks: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AIScoreSummaryOut(BaseModel):
    id: str
    score: float
    score_display: int
    raw_probability: Optional[float] = None
    calibrated_probability: Optional[float] = None
    priority_level: str
    priority: Optional[str] = None
    calibration_method: Optional[str] = "platt_sigmoid"
    feature_importance: List[Any] = []
    scored_at: datetime
    model_version: str

    model_config = ConfigDict(from_attributes=True)


class CustomerNeedOut(BaseModel):
    id: str
    need_type: str
    severity: str
    description: str
    identified_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FollowUpSummaryOut(BaseModel):
    id: str
    scheduled_date: Optional[date] = None
    last_contact_date: Optional[date] = None
    follow_up_window: Optional[str] = None
    status: str
    priority: str
    payment_status: str
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CustomerListItem(BaseModel):
    id: str
    external_ref: str
    full_name: str
    kyc_status: str
    relationship_tier: Optional[str] = "Standard"
    score_display: Optional[int] = None
    priority_level: Optional[str] = None
    score_short_reason: Optional[str] = None
    why_now: Optional[str] = None
    recommended_action: Optional[str] = None
    action_state: Optional[str] = "action"  # action | review | no_action
    active_policies_count: int = 0
    has_overdue_followup: bool = False

    model_config = ConfigDict(from_attributes=True)


class CustomerListResponse(BaseModel):
    items: List[CustomerListItem]
    total: int
    page: int
    page_size: int


class CustomerDetailOut(BaseModel):
    id: str
    external_ref: str
    first_name: str
    last_name: str
    full_name: str
    assigned_broker_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    profile: Optional[CustomerProfileOut] = None
    financial_profile: Optional[FinancialProfileOut] = None
    insurance_policies: List[InsurancePolicyOut] = []
    latest_score: Optional[AIScoreSummaryOut] = None
    needs: List[CustomerNeedOut] = []
    follow_ups: List[FollowUpSummaryOut] = []

    model_config = ConfigDict(from_attributes=True)


class CustomerFullProfileResponse(BaseModel):
    customer_id: str
    external_ref: str
    full_name: str
    profile: Optional[CustomerProfileOut] = None
    financial_profile: Optional[FinancialProfileOut] = None
    active_policies: List[InsurancePolicyOut] = []
    total_coverage: float = 0.0


class SHAPFactor(BaseModel):
    feature: str
    label: str
    value: float
    shap_value: float
    importance: float
    impact: str  # "positive" | "negative"


class ModelMetadataOut(BaseModel):
    model_name: str
    model_version: str
    timestamp: str
    disclaimer: str = "Trained on synthetic demonstration data. Not real Krungsri production system."


class AnalyzeCustomerResponse(BaseModel):
    customer_id: str
    external_ref: str
    full_name: str
    score: int  # 0 - 100 display score based on calibrated probability
    probability: float  # raw model probability
    raw_probability: float  # alias
    calibrated_probability: float  # calibrated probability (Platt Sigmoid)
    priority: str  # "high" | "medium" | "low"
    priority_level: str  # alias
    calibration_method: str = "platt_sigmoid"
    calibration_explanation: str = (
        "Priority Score is derived from the validated model probability (calibrated via Platt Sigmoid scaling). "
        "It reflects statistical priority, not a guaranteed outcome."
    )
    factors: List[SHAPFactor]
    model_metadata: ModelMetadataOut
    features_used: Dict[str, Any]
