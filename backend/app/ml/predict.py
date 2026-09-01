"""
Prediction and Inference module for Customer Priority Scoring.
Loads pre-trained model and SHAP explainer artifacts to score customers in milliseconds.
"""
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import pandas as pd

from app.ml.features import (
    FEATURE_COLUMNS,
    extract_features_from_customer,
    prepare_feature_dataframe,
)
from app.ml.explain import explain_prediction

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.pkl"
EXPLAINER_PATH = ARTIFACTS_DIR / "shap_explainer.pkl"
CALIBRATOR_PATH = ARTIFACTS_DIR / "calibrator.pkl"


class PriorityPredictor:
    """Singleton-style predictor loading model, calibrator & explainer on startup."""

    def __init__(self):
        self._model = None
        self._calibrator = None
        self._explainer = None
        self.model_name = "LightGBM Priority Classifier"
        self.model_version = "1.0.0"
        self.calibration_method = "platt_sigmoid"
        self.calibration_explanation = (
            "Priority Score is derived from the validated model probability (calibrated via Platt Sigmoid scaling). "
            "It reflects statistical priority, not a guaranteed outcome."
        )

    def _ensure_loaded(self):
        if self._model is None or self._explainer is None:
            if not MODEL_PATH.exists() or not EXPLAINER_PATH.exists():
                # Trigger training on synthetic data if artifacts don't exist yet
                from app.ml.train import train_pipeline
                train_pipeline(save_artifacts=True)

            self._model = joblib.load(MODEL_PATH)
            self._explainer = joblib.load(EXPLAINER_PATH)

        if self._calibrator is None:
            if CALIBRATOR_PATH.exists():
                self._calibrator = joblib.load(CALIBRATOR_PATH)
            else:
                try:
                    from app.ml.calibrate import train_calibrated_pipeline
                    train_calibrated_pipeline(save_artifacts=True)
                    if CALIBRATOR_PATH.exists():
                        self._calibrator = joblib.load(CALIBRATOR_PATH)
                except Exception:
                    self._calibrator = None

    def predict_customer(self, customer: Any) -> Dict[str, Any]:
        """
        Runs ML inference on a Customer ORM object.
        Returns: raw probability, calibrated probability, score 0-100, priority_level, SHAP factors, and metadata.
        """
        self._ensure_loaded()

        # 1. Feature extraction
        raw_features = extract_features_from_customer(customer)
        df_features = prepare_feature_dataframe([raw_features])

        # 2. Raw model prediction
        proba = self._model.predict_proba(df_features[FEATURE_COLUMNS])[0]
        raw_score = float(proba[1]) if len(proba) > 1 else float(proba[0])

        # 3. Calibrated probability
        if self._calibrator is not None:
            cal_proba = self._calibrator.predict_proba(df_features[FEATURE_COLUMNS])[0]
            cal_score = float(cal_proba[1]) if len(cal_proba) > 1 else float(cal_proba[0])
        else:
            cal_score = raw_score

        # 4. Data-driven score mapping & thresholds
        score_display = int(round(cal_score * 100))
        score_display = max(0, min(100, score_display))

        if score_display >= 70:
            priority_level = "high"
        elif score_display >= 40:
            priority_level = "medium"
        else:
            priority_level = "low"

        # 5. SHAP Explanation
        factors = explain_prediction(self._explainer, df_features, top_k=5)

        return {
            "score": score_display,
            "probability": round(raw_score, 4),
            "raw_probability": round(raw_score, 4),
            "calibrated_probability": round(cal_score, 4),
            "priority": priority_level,
            "priority_level": priority_level,
            "calibration_method": self.calibration_method,
            "calibration_explanation": self.calibration_explanation,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "factors": factors,
            "feature_importance": factors,
            "features_used": raw_features,
        }


# Global instance
predictor = PriorityPredictor()
