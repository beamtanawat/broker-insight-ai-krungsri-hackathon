"""
Model Evaluation module.
Computes real classification metrics (Precision, Recall, F1, ROC-AUC, Confusion Matrix)
and saves the evaluation output to JSON artifact.
"""
import json
from pathlib import Path
from typing import Any, Dict
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"


def evaluate_classifier(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_proba: np.ndarray,
    model_name: str = "LightGBM Priority Classifier",
    model_version: str = "1.0.0",
    save_artifact: bool = True,
) -> Dict[str, Any]:
    """
    Computes all standard binary classification metrics.
    No hard-coded values — all calculated directly from actual predictions.
    """
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_true, y_proba))
    cm = confusion_matrix(y_true, y_pred).tolist()

    report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)

    metrics = {
        "model_name": model_name,
        "model_version": model_version,
        "dataset_type": "Synthetic/Demonstration Data (Not Real Krungsri Production)",
        "sample_count": len(y_true),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "confusion_matrix": {
            "true_negative": cm[0][0] if len(cm) > 1 else cm[0][0],
            "false_positive": cm[0][1] if len(cm) > 1 and len(cm[0]) > 1 else 0,
            "false_negative": cm[1][0] if len(cm) > 1 else 0,
            "true_positive": cm[1][1] if len(cm) > 1 and len(cm[1]) > 1 else 0,
            "matrix_raw": cm,
        },
        "classification_report": report,
    }

    if save_artifact:
        ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
        eval_path = ARTIFACTS_DIR / "evaluation_metrics.json"
        with open(eval_path, "w", encoding="utf-8") as f:
            json.dump(metrics, f, indent=2, ensure_ascii=False)

    return metrics
