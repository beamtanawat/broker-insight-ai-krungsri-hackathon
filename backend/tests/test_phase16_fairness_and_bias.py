"""
Comprehensive test suite for Phase 16:
Fairness and Bias Analysis, Feature Classification Audit, Subgroup Parity Metrics,
Small Sample Size Flagging, and Non-Discrimination Disclaimers.
"""
import json
from pathlib import Path
import pytest
from httpx import AsyncClient, ASGITransport
import numpy as np
import pandas as pd

from app.main import app
from app.core.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User
from app.ml.features import FEATURE_COLUMNS
from app.ml.fairness import (
    FEATURE_AUDIT_CLASSIFICATION,
    compute_subgroup_metrics,
    generate_fairness_report,
)
from tests.conftest import TestAsyncSession

ARTIFACTS_DIR = Path(__file__).parent.parent / "app" / "ml" / "artifacts"


async def get_test_token(role: str = "broker") -> str:
    async with TestAsyncSession() as db:
        user = (await db.execute(User.__table__.select().where(User.email == f"{role}@demo.local"))).first()
        user_id = user.id if user else "test-user-id"
    return create_access_token(user_id, role)


def test_feature_audit_classification_and_sensitive_exclusion():
    """
    Verify feature classification and ensure that NO sensitive attributes or PII
    (e.g., gender, national_id, name, email, phone) are present in the prediction feature list.
    """
    prediction_features = FEATURE_COLUMNS
    assert len(prediction_features) == 17

    # Ensure excluded PII is strictly absent
    for pii in FEATURE_AUDIT_CLASSIFICATION["excluded_identifiers_and_pii"]:
        assert pii not in prediction_features, f"Illegal PII attribute '{pii}' found in model FEATURE_COLUMNS!"

    # Ensure audit-only demographic attributes are strictly absent
    for audit_attr in FEATURE_AUDIT_CLASSIFICATION["audit_only_attributes"]:
        assert audit_attr not in prediction_features, f"Audit-only attribute '{audit_attr}' found in model FEATURE_COLUMNS!"

    # Ensure demographic age is the only life-stage demographic feature
    assert "age" in prediction_features
    assert "gender" not in prediction_features
    assert "gender_audit" not in prediction_features


def test_subgroup_metrics_calculation_and_small_sample_flag():
    """Verify precision, recall, FPR, FNR, and small sample size flagging (< 30)."""
    # 1. Normal Sample (N >= 30)
    df_normal = pd.DataFrame({
        "y_true": [1] * 20 + [0] * 20,
        "y_pred": [1] * 18 + [0] * 2 + [1] * 4 + [0] * 16,
    })
    m_norm = compute_subgroup_metrics(df_normal, "Normal Group", min_sample_threshold=30)
    assert m_norm["sample_count"] == 40
    assert m_norm["is_small_sample"] is False
    assert m_norm["sample_warning"] is None
    assert 0.0 <= m_norm["precision"] <= 100.0
    assert 0.0 <= m_norm["recall"] <= 100.0
    assert 0.0 <= m_norm["f1_score"] <= 100.0
    assert 0.0 <= m_norm["false_positive_rate"] <= 100.0
    assert 0.0 <= m_norm["false_negative_rate"] <= 100.0

    # 2. Small Sample (N < 30)
    df_small = pd.DataFrame({
        "y_true": [1] * 5 + [0] * 10,
        "y_pred": [1] * 4 + [0] * 1 + [1] * 2 + [0] * 8,
    })
    m_small = compute_subgroup_metrics(df_small, "Small Cohort", min_sample_threshold=30)
    assert m_small["sample_count"] == 15
    assert m_small["is_small_sample"] is True
    assert m_small["sample_warning"] is not None


def test_generate_fairness_report_execution_and_schema():
    """Verify fairness report runs, produces valid JSON artifact, and separates prediction features from audit attributes."""
    report = generate_fairness_report(save_artifacts=True, n_samples=300)

    assert "audit_id" in report
    assert "evaluated_at" in report
    assert "subgroup_analyses" in report
    assert "age_cohorts" in report["subgroup_analyses"]
    assert "relationship_tiers" in report["subgroup_analyses"]
    assert "gender_audit_only" in report["subgroup_analyses"]

    gender_sub = report["subgroup_analyses"]["gender_audit_only"]
    assert gender_sub["is_model_feature"] is False
    assert len(gender_sub["groups"]) >= 2

    for grp in gender_sub["groups"]:
        assert 0.0 <= grp["precision"] <= 100.0
        assert 0.0 <= grp["recall"] <= 100.0
        assert 0.0 <= grp["f1_score"] <= 100.0

    assert "key_observations" in report
    assert len(report["key_observations"]) > 0
    assert "limitations_and_disclaimer" in report

    rep_file = ARTIFACTS_DIR / "fairness_report.json"
    assert rep_file.exists()


@pytest.mark.asyncio
async def test_model_fairness_api_endpoint():
    """Verify GET /model/fairness and /api/v1/model/fairness return fairness audit report."""
    await seed_database(num_customers=3)
    token = await get_test_token("broker")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/model/fairness", headers=headers)
        assert res.status_code == 200
        data = res.json()

        assert "audit_id" in data
        assert "feature_classification" in data
        assert "subgroup_analyses" in data
        assert "age_cohorts" in data["subgroup_analyses"]
        assert "relationship_tiers" in data["subgroup_analyses"]
        assert "gender_audit_only" in data["subgroup_analyses"]
        assert len(data["subgroup_analyses"]["gender_audit_only"]["groups"]) >= 2

        # Test v1 prefix
        v1_res = await client.get("/api/v1/model/fairness", headers=headers)
        assert v1_res.status_code == 200


@pytest.mark.asyncio
async def test_unauthenticated_fairness_rejection():
    """Verify unauthenticated requests to /model/fairness are rejected with 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/model/fairness")
        assert res.status_code == 401
