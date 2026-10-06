"""
Model Interpretability and Explainability module using SHAP.
Generates genuine TreeSHAP explanations with positive and negative contributing factors.
"""
from typing import Any, Dict, List, Optional
import pandas as pd
import numpy as np
import shap

from app.ml.features import FEATURE_COLUMNS, FEATURE_THAI_LABELS


def explain_prediction(
    explainer: Any,
    feature_row: pd.DataFrame,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Computes genuine SHAP values for a single customer feature vector.
    Returns sorted list of contributing factors with impact (positive/negative),
    importance magnitude, and human-readable Thai description.
    """
    # Ensure columns match training order
    X = feature_row[FEATURE_COLUMNS].copy()
    raw_shap = explainer.shap_values(X)

    # Handle multi-class / binary array shapes from SHAP
    if isinstance(raw_shap, list) and len(raw_shap) == 2:
        values = raw_shap[1][0]  # Positive class (high priority)
    elif isinstance(raw_shap, np.ndarray):
        if raw_shap.ndim == 3:
            values = raw_shap[0, :, 1]
        elif raw_shap.ndim == 2:
            values = raw_shap[0]
        else:
            values = raw_shap
    else:
        values = np.zeros(len(FEATURE_COLUMNS))

    factors = []
    for col, shap_val in zip(FEATURE_COLUMNS, values):
        val = feature_row[col].iloc[0] if hasattr(feature_row[col], "iloc") else feature_row[col]
        impact_type = "positive" if shap_val > 0 else "negative"
        factors.append({
            "feature": col,
            "label": FEATURE_THAI_LABELS.get(col, col),
            "value": float(val),
            "shap_value": round(float(shap_val), 4),
            "importance": round(abs(float(shap_val)), 4),
            "impact": impact_type,
        })

    # Sort by absolute SHAP importance descending
    factors.sort(key=lambda x: x["importance"], reverse=True)
    return factors[:top_k]
