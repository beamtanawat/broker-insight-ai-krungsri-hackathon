"""
Scoring service — loads LightGBM model and SHAP explainer at startup,
computes priority score and SHAP reasons for a customer.
"""
import json
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.customer import Customer
from app.models.ai_score import AIScore

ARTIFACTS_DIR = Path(__file__).parent.parent / "ml" / "artifacts"


class ScoringService:
    def __init__(self):
        self._model = None
        self._explainer = None
        self._meta = None

    def _load(self):
        if self._model is None:
            model_path = ARTIFACTS_DIR / "model.pkl"
            explainer_path = ARTIFACTS_DIR / "shap_explainer.pkl"
            meta_path = ARTIFACTS_DIR / "model_meta.json"
            if not model_path.exists():
                raise FileNotFoundError(
                    "ML model not found. Run: python -m app.ml.generate_data && python -m app.ml.train_model"
                )
            self._model = joblib.load(model_path)
            self._explainer = joblib.load(explainer_path)
            self._meta = json.loads(meta_path.read_text())

    def _build_feature_row(self, customer: Customer) -> pd.DataFrame:
        """Extract features from a Customer ORM object."""
        snap = customer.financial_snapshot
        from datetime import date
        import math

        today = date.today()
        fu = customer.follow_up

        # Days to renewal: use follow_up.renewal_date if available
        days_to_renewal = 365
        if fu and fu.renewal_date:
            days_to_renewal = max(0, (fu.renewal_date - today).days)

        # Days since last contact
        days_since_contact = 180
        if snap and snap.crm_last_contact:
            days_since_contact = max(0, (today - snap.crm_last_contact).days)

        payment_ok = 1
        if fu and fu.payment_status == "overdue":
            payment_ok = 0

        kyc_completeness = {"verified": 1.0, "pending": 0.6, "rejected": 0.3}.get(
            customer.kyc_status, 0.6
        )

        num_policies = len(snap.policies) if snap else 1
        num_products = len(snap.products) if snap else 1
        has_loan = 1 if snap and snap.loan_status and "ผ่อนชำระ" in snap.loan_status else 0
        transaction_recency = 90  # default
        crm_engagement = 0.5
        tenure_years = 3.0

        return pd.DataFrame([{
            "days_to_renewal": days_to_renewal,
            "days_since_last_contact": days_since_contact,
            "payment_status_code": payment_ok,
            "kyc_completeness_score": kyc_completeness,
            "num_active_policies": num_policies,
            "num_financial_products": num_products,
            "has_active_loan": has_loan,
            "transaction_recency_days": transaction_recency,
            "crm_engagement_score": crm_engagement,
            "customer_tenure_years": tenure_years,
        }])

    def score(self, customer: Customer) -> dict:
        self._load()
        features = self._build_feature_row(customer)
        feature_cols = self._meta["feature_cols"]
        X = features[feature_cols]

        prob = float(self._model.predict_proba(X)[0, 1])
        score_display = round(prob * 100)

        if prob >= 0.65:
            level = "high"
        elif prob >= 0.35:
            level = "medium"
        else:
            level = "low"

        # SHAP values
        shap_values = self._explainer.shap_values(X)
        if isinstance(shap_values, list):
            sv = shap_values[1][0]
        else:
            sv = shap_values[0]

        thai_labels = self._meta["feature_thai_labels"]
        feature_importance = []
        for feat, impact in sorted(
            zip(feature_cols, sv), key=lambda x: abs(x[1]), reverse=True
        )[:5]:
            feature_importance.append({
                "feature": feat,
                "value": float(features[feat].iloc[0]),
                "impact": round(float(impact), 4),
                "label": thai_labels.get(feat, feat),
            })

        return {
            "score": round(prob, 4),
            "score_display": score_display,
            "priority_level": level,
            "shap_values": dict(zip(feature_cols, [round(float(v), 4) for v in sv])),
            "feature_importance": feature_importance,
            "model_version": self._meta["model_version"],
        }


_service = ScoringService()


async def score_customer(customer: Customer, db: AsyncSession) -> AIScore:
    result = _service.score(customer)
    ps = AIScore(
        customer_id=customer.id,
        score=result["score"],
        score_display=result["score_display"],
        priority_level=result["priority_level"],
        shap_values=result["shap_values"],
        feature_importance=result["feature_importance"],
        model_version=result["model_version"],
    )
    db.add(ps)
    await db.flush()
    return ps
