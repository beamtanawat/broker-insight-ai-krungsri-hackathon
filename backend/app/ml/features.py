"""
Feature Engineering module for Customer Priority Scoring.
Provides reusable extraction, transformation, and validation for tabular ML models.
"""
from datetime import date
from typing import Any, Dict, List, Optional
import pandas as pd
import numpy as np

# Canonical Feature Column Definitions
FEATURE_COLUMNS = [
    "age",
    "income_band_numeric",
    "relationship_tenure_months",
    "relationship_tier_encoded",
    "is_kyc_verified",
    "total_assets",
    "total_liabilities",
    "monthly_savings",
    "has_active_loan",
    "num_financial_products",
    "insurance_count",
    "days_to_renewal",
    "days_since_last_contact",
    "contact_frequency_90d",
    "transaction_activity_90d",
    "existing_coverage_amount",
    "has_overdue_followup",
]

# Human-friendly Thai Labels for SHAP & Feature Interpretability
FEATURE_THAI_LABELS = {
    "age": "อายุของลูกค้า",
    "income_band_numeric": "ระดับรายได้เฉลี่ยต่อเดือน",
    "relationship_tenure_months": "ระยะเวลาที่เป็นลูกค้า (เดือน)",
    "relationship_tier_encoded": "ระดับความสัมพันธ์ (Tier)",
    "is_kyc_verified": "สถานะยืนยันตัวตน KYC",
    "total_assets": "มูลค่าสินทรัพย์รวม",
    "total_liabilities": "ภาระหนี้สินรวม",
    "monthly_savings": "ยอดเงินออมต่อเดือน",
    "has_active_loan": "มีภาระสินเชื่อที่เปิดอยู่",
    "num_financial_products": "จำนวนผลิตภัณฑ์ทางการเงินที่ถือครอง",
    "insurance_count": "จำนวนกรมธรรม์ประกันที่มีผลบังคับ",
    "days_to_renewal": "จำนวนวันก่อนถึงกำหนดต่ออายุกรมธรรม์",
    "days_since_last_contact": "จำนวนวันนับจากการติดต่อครั้งล่าสุด",
    "contact_frequency_90d": "ความถี่ในการติดต่อรอบ 90 วัน",
    "transaction_activity_90d": "ความถี่การทำธุรกรรมรอบ 90 วัน",
    "existing_coverage_amount": "ทุนประกันความคุ้มครองรวม",
    "has_overdue_followup": "มีรายการติดตามค้างชำระ/เกินกำหนด",
}

INCOME_MAP = {
    "30,000 - 50,000 บาท/เดือน": 40.0,
    "50,001 - 100,000 บาท/เดือน": 75.0,
    "100,001 - 200,000 บาท/เดือน": 150.0,
    "มากกว่า 200,000 บาท/เดือน": 250.0,
}

TIER_MAP = {
    "Standard": 0,
    "Gold": 1,
    "Platinum": 2,
}


def extract_features_from_customer(customer: Any) -> Dict[str, Any]:
    """
    Extracts raw numerical/categorical values from a Customer ORM object
    and returns a clean dictionary matching FEATURE_COLUMNS.
    """
    today = date.today()
    prof = getattr(customer, "profile", None)
    fin = getattr(customer, "financial_profile", None)
    policies = getattr(customer, "insurance_policies", []) or []
    interactions = getattr(customer, "interactions", []) or []
    followups = getattr(customer, "follow_ups", []) or []

    # 1. Profile features
    age = getattr(prof, "age", 40) if prof and prof.age else 40
    income_str = getattr(prof, "income_range", "") if prof else ""
    income_num = INCOME_MAP.get(income_str, 50.0)
    tier_str = getattr(prof, "relationship_tier", "Standard") if prof else "Standard"
    tier_encoded = TIER_MAP.get(tier_str, 0)
    is_kyc = 1 if (prof and getattr(prof, "kyc_status", "") == "verified") else 0

    # 2. Tenure
    created_at = getattr(customer, "created_at", None)
    if created_at:
        created_date = created_at.date() if hasattr(created_at, "date") else today
        tenure_months = max(1, (today.year - created_date.year) * 12 + (today.month - created_date.month))
    else:
        tenure_months = 12

    # 3. Financial features
    assets = getattr(fin, "total_assets", 0.0) if fin else 0.0
    liabilities = getattr(fin, "total_liabilities", 0.0) if fin else 0.0
    savings = getattr(fin, "monthly_savings", 0.0) if fin else 0.0
    has_loan = 1 if (fin and getattr(fin, "has_active_loan", False)) else 0
    products_held = getattr(fin, "products_held", []) if fin else []
    num_products = len(products_held) if isinstance(products_held, list) else 1
    tx_freq = getattr(fin, "transaction_frequency_90d", 0) if fin else 0

    # 4. Insurance features
    active_policies = [p for p in policies if getattr(p, "status", "") == "Active"]
    ins_count = len(active_policies)
    total_cov = sum(getattr(p, "coverage_amount", 0.0) for p in active_policies)

    # Days to nearest renewal
    renewal_days = []
    for p in active_policies:
        ren_d = getattr(p, "renewal_date", None)
        if ren_d:
            delta = (ren_d - today).days
            if delta >= 0:
                renewal_days.append(delta)
    days_to_renewal = min(renewal_days) if renewal_days else 365

    # 5. Interaction & follow-up features
    contact_dates = [getattr(i, "interaction_date", None) for i in interactions if getattr(i, "interaction_date", None)]
    if contact_dates:
        latest_contact = max(contact_dates)
        days_last_contact = max(0, (today - latest_contact).days)
    else:
        days_last_contact = 90

    contact_90d = len([d for d in contact_dates if (today - d).days <= 90])

    has_overdue = 1 if any(
        getattr(f, "payment_status", "") == "overdue" or
        (getattr(f, "status", "") == "open" and getattr(f, "scheduled_date", None) and getattr(f, "scheduled_date") < today)
        for f in followups
    ) else 0

    return {
        "age": int(age),
        "income_band_numeric": float(income_num),
        "relationship_tenure_months": int(tenure_months),
        "relationship_tier_encoded": int(tier_encoded),
        "is_kyc_verified": int(is_kyc),
        "total_assets": float(assets),
        "total_liabilities": float(liabilities),
        "monthly_savings": float(savings),
        "has_active_loan": int(has_loan),
        "num_financial_products": int(num_products),
        "insurance_count": int(ins_count),
        "days_to_renewal": int(days_to_renewal),
        "days_since_last_contact": int(days_last_contact),
        "contact_frequency_90d": int(contact_90d),
        "transaction_activity_90d": int(tx_freq),
        "existing_coverage_amount": float(total_cov),
        "has_overdue_followup": int(has_overdue),
    }


def prepare_feature_dataframe(data_list: List[Dict[str, Any]]) -> pd.DataFrame:
    """Converts list of feature dicts into a validated pandas DataFrame."""
    df = pd.DataFrame(data_list)
    for col in FEATURE_COLUMNS:
        if col not in df.columns:
            df[col] = 0
    return df[FEATURE_COLUMNS].copy()
