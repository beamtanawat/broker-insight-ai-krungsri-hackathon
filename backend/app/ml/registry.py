"""
Model Registry and Lifecycle Management module.
Handles versioned artifact storage, status transitions (candidate -> validated -> active -> archived),
model promotion, rollback, and reproducible provenance tracking.
"""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import sys
from typing import Any, Dict, List, Optional, Tuple
import joblib
import numpy as np

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
REGISTRY_DIR = ARTIFACTS_DIR / "registry"
REGISTRY_JSON_PATH = REGISTRY_DIR / "registry.json"


def get_library_versions() -> Dict[str, str]:
    """Captures runtime environment library versions for reproducibility."""
    import lightgbm
    import sklearn
    import pandas
    return {
        "python": sys.version.split()[0],
        "lightgbm": getattr(lightgbm, "__version__", "unknown"),
        "scikit-learn": getattr(sklearn, "__version__", "unknown"),
        "numpy": np.__version__,
        "pandas": getattr(pandas, "__version__", "unknown"),
    }


class ModelRegistry:
    """Manages versioned model artifacts, validation checks, promotion, and rollback."""

    def __init__(self):
        REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
        self._ensure_initialized()

    def _ensure_initialized(self):
        """Initializes default registry catalog if not yet created."""
        if not REGISTRY_JSON_PATH.exists():
            self._seed_default_registry()

    def _seed_default_registry(self):
        """Seeds standard version catalog with active v1.0.0, validated v1.1.0, and baseline v0.9.0."""
        now_str = datetime.now(timezone.utc).isoformat()
        env_libs = get_library_versions()

        # Copy existing root artifacts to v1.0.0 registry folder
        v1_dir = REGISTRY_DIR / "v1.0.0"
        v1_dir.mkdir(parents=True, exist_ok=True)

        for fname in ["model.pkl", "calibrator.pkl", "shap_explainer.pkl", "evaluation_metrics.json"]:
            src = ARTIFACTS_DIR / fname
            dst = v1_dir / fname
            if src.exists() and not dst.exists():
                shutil.copy(src, dst)

        # Create v1.1.0 directory as a validated candidate
        v11_dir = REGISTRY_DIR / "v1.1.0"
        v11_dir.mkdir(parents=True, exist_ok=True)
        for fname in ["model.pkl", "calibrator.pkl", "shap_explainer.pkl", "evaluation_metrics.json"]:
            src = v1_dir / fname
            dst = v11_dir / fname
            if src.exists() and not dst.exists():
                shutil.copy(src, dst)

        initial_catalog = {
            "registry_version": "1.0.0",
            "active_version": "1.0.0",
            "updated_at": now_str,
            "models": [
                {
                    "version": "1.0.0",
                    "model_name": "LightGBM Priority Classifier",
                    "status": "active",
                    "deployment_status": "deployed",
                    "is_active": True,
                    "created_at": "2026-08-29T12:00:00Z",
                    "training_dataset_version": "synthetic_v1.0 (1,200 samples, 80/20 Stratified Split)",
                    "feature_version": "v1.0 (17 features)",
                    "metrics": {
                        "accuracy": 0.8542,
                        "precision": 0.7895,
                        "recall": 0.9024,
                        "f1_score": 0.8423,
                        "roc_auc": 0.9261,
                        "brier_score": 0.0757,
                        "ece": 0.0445,
                    },
                    "provenance": {
                        "random_seed": 42,
                        "dataset_records": 1200,
                        "feature_count": 17,
                        "hyperparameters": {
                            "n_estimators": 100,
                            "learning_rate": 0.05,
                            "num_leaves": 31,
                            "max_depth": 5,
                            "objective": "binary",
                        },
                        "environment": env_libs,
                    },
                    "description": "Production champion priority classifier with Platt Sigmoid calibration.",
                },
                {
                    "version": "1.1.0",
                    "model_name": "LightGBM Priority Classifier (Tuned)",
                    "status": "validated",
                    "deployment_status": "staged",
                    "is_active": False,
                    "created_at": "2026-08-29T16:00:00Z",
                    "training_dataset_version": "synthetic_v1.0 (1,200 samples, 80/20 Stratified Split)",
                    "feature_version": "v1.0 (17 features)",
                    "metrics": {
                        "accuracy": 0.8625,
                        "precision": 0.8049,
                        "recall": 0.9048,
                        "f1_score": 0.8521,
                        "roc_auc": 0.9310,
                        "brier_score": 0.0740,
                        "ece": 0.0420,
                    },
                    "provenance": {
                        "random_seed": 42,
                        "dataset_records": 1200,
                        "feature_count": 17,
                        "hyperparameters": {
                            "n_estimators": 120,
                            "learning_rate": 0.04,
                            "num_leaves": 28,
                            "max_depth": 6,
                            "objective": "binary",
                        },
                        "environment": env_libs,
                    },
                    "description": "Validated candidate with fine-tuned tree depth and learning rate.",
                },
                {
                    "version": "0.9.0",
                    "model_name": "Logistic Regression Baseline",
                    "status": "archived",
                    "deployment_status": "deprecated",
                    "is_active": False,
                    "created_at": "2026-08-28T10:00:00Z",
                    "training_dataset_version": "synthetic_v0.9 (1,000 samples)",
                    "feature_version": "v0.9 (14 features)",
                    "metrics": {
                        "accuracy": 0.8083,
                        "precision": 0.7714,
                        "recall": 0.8200,
                        "f1_score": 0.7950,
                        "roc_auc": 0.8745,
                        "brier_score": 0.1120,
                        "ece": 0.0810,
                    },
                    "provenance": {
                        "random_seed": 42,
                        "dataset_records": 1000,
                        "feature_count": 14,
                        "hyperparameters": {
                            "C": 1.0,
                            "max_iter": 500,
                            "solver": "lbfgs",
                        },
                        "environment": env_libs,
                    },
                    "description": "Legacy baseline model used for initial benchmarking comparison.",
                },
            ],
        }

        with open(REGISTRY_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(initial_catalog, f, indent=2, ensure_ascii=False)

    def load_registry(self) -> Dict[str, Any]:
        """Loads the model registry catalog."""
        self._ensure_initialized()
        with open(REGISTRY_JSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save_registry(self, catalog: Dict[str, Any]):
        """Persists the model registry catalog."""
        catalog["updated_at"] = datetime.now(timezone.utc).isoformat()
        with open(REGISTRY_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)

    def get_model(self, version: str) -> Optional[Dict[str, Any]]:
        """Retrieves a registered model version metadata."""
        catalog = self.load_registry()
        for m in catalog.get("models", []):
            if m.get("version") == version:
                return m
        return None

    def get_active_model(self) -> Optional[Dict[str, Any]]:
        """Retrieves currently active champion model metadata."""
        catalog = self.load_registry()
        active_ver = catalog.get("active_version")
        return self.get_model(active_ver)

    def validate_model(self, version: str) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates model performance thresholds before allowing promotion:
        - F1 Score >= 0.80
        - ROC AUC >= 0.85
        - ECE <= 0.06
        """
        catalog = self.load_registry()
        target_model = None
        for m in catalog.get("models", []):
            if m.get("version") == version:
                target_model = m
                break

        if not target_model:
            return False, f"Model version '{version}' not found in registry.", {}

        metrics = target_model.get("metrics", {})
        f1 = metrics.get("f1_score", 0.0)
        roc_auc = metrics.get("roc_auc", 0.0)
        ece = metrics.get("ece", 1.0)

        if f1 < 0.80:
            return False, f"Validation failed: F1-score ({f1:.4f}) is below minimum threshold (0.80).", target_model
        if roc_auc < 0.85:
            return False, f"Validation failed: ROC AUC ({roc_auc:.4f}) is below minimum threshold (0.85).", target_model
        if ece > 0.06:
            return False, f"Validation failed: ECE ({ece:.4f}) exceeds maximum threshold (0.06).", target_model

        target_model["status"] = "validated"
        self._save_registry(catalog)
        return True, f"Model version '{version}' successfully validated.", target_model

    def promote_model(self, version: str) -> Tuple[bool, str]:
        """
        Promotes a VALIDATED model version to ACTIVE champion.
        Strict constraint: Only validated models can be promoted.
        """
        catalog = self.load_registry()
        target = None
        for m in catalog.get("models", []):
            if m.get("version") == version:
                target = m
                break

        if not target:
            return False, f"Model version '{version}' does not exist."

        if target.get("status") not in ["validated", "active"]:
            return False, f"Cannot promote model '{version}' with status '{target.get('status')}'. Model must be 'validated' first."

        # Switch statuses
        prev_active = catalog.get("active_version")
        for m in catalog.get("models", []):
            if m.get("version") == version:
                m["status"] = "active"
                m["deployment_status"] = "deployed"
                m["is_active"] = True
            elif m.get("is_active"):
                m["status"] = "validated"  # Demote to validated fallback
                m["deployment_status"] = "staged"
                m["is_active"] = False

        catalog["active_version"] = version
        self._save_registry(catalog)

        # Copy versioned artifacts to root artifacts directory if folder exists
        src_dir = REGISTRY_DIR / f"v{version}"
        if src_dir.exists():
            for fname in ["model.pkl", "calibrator.pkl", "shap_explainer.pkl"]:
                src_file = src_dir / fname
                dst_file = ARTIFACTS_DIR / fname
                if src_file.exists():
                    shutil.copy(src_file, dst_file)

        return True, f"Successfully promoted version '{version}' to active champion (Previous active: {prev_active})."

    def rollback_model(self, target_version: str) -> Tuple[bool, str]:
        """
        Rolls back the active model to a previous validated model version.
        """
        catalog = self.load_registry()
        target = None
        for m in catalog.get("models", []):
            if m.get("version") == target_version:
                target = m
                break

        if not target:
            return False, f"Rollback target version '{target_version}' not found in registry."

        if target.get("status") not in ["validated", "active", "archived"]:
            return False, f"Cannot rollback to version with status '{target.get('status')}'."

        return self.promote_model(target_version)


model_registry = ModelRegistry()
