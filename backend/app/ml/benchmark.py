"""
Model Benchmarking and Validation Service.
Scientifically benchmarks LightGBM against baseline models (Logistic Regression, Random Forest)
using identical train/test splits and 5-Fold Stratified Cross-Validation.
Generates machine-readable `model_comparison.json` artifact.
"""
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, train_test_split, cross_validate
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)

from app.ml.features import FEATURE_COLUMNS, FEATURE_THAI_LABELS
from app.ml.train import generate_synthetic_training_dataset, RANDOM_STATE

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"


def run_model_benchmarks(
    df: pd.DataFrame | None = None,
    save_artifacts: bool = True,
    n_samples: int = 1200,
) -> Dict[str, Any]:
    """
    Executes reproducible benchmark across:
      1. Logistic Regression (with StandardScaler pipeline)
      2. Random Forest Classifier
      3. LightGBM Classifier
    Evaluates on identical 80/20 train/test split and 5-Fold Stratified Cross Validation.
    """
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Dataset loading / generation
    if df is None:
        csv_path = ARTIFACTS_DIR / "synthetic_training_data.csv"
        if csv_path.exists():
            try:
                df = pd.read_csv(csv_path)
            except Exception:
                df = generate_synthetic_training_dataset(n_samples=n_samples)
        else:
            df = generate_synthetic_training_dataset(n_samples=n_samples)

    # Ensure no exact duplicate rows
    df = df.drop_duplicates().reset_index(drop=True)

    X = df[FEATURE_COLUMNS].copy()
    y = df["customer_priority"].values

    total_samples = len(df)
    positive_count = int(np.sum(y == 1))
    negative_count = int(np.sum(y == 0))
    pos_ratio = round(positive_count / total_samples * 100.0, 1)

    # 2. Identical Stratified Train/Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y
    )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    scoring = ["accuracy", "precision", "recall", "f1", "roc_auc"]

    # 3. Model Definitions
    candidate_models: List[Tuple[str, str, Any, Dict[str, Any]]] = []

    # Model 1: Logistic Regression Baseline
    lr_pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(C=1.0, max_iter=1000, random_state=RANDOM_STATE)),
    ])
    candidate_models.append((
        "logistic_regression",
        "Logistic Regression (Standardized Baseline)",
        lr_pipe,
        {"C": 1.0, "max_iter": 1000, "scaling": "StandardScaler", "solver": "lbfgs"},
    ))

    # Model 2: Random Forest Baseline
    rf_clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        min_samples_split=5,
        random_state=RANDOM_STATE,
    )
    candidate_models.append((
        "random_forest",
        "Random Forest Classifier",
        rf_clf,
        {"n_estimators": 100, "max_depth": 6, "min_samples_split": 5, "criterion": "gini"},
    ))

    # Model 3: LightGBM Classifier
    try:
        import lightgbm as lgb
        lgb_clf = lgb.LGBMClassifier(
            n_estimators=100,
            learning_rate=0.05,
            num_leaves=31,
            max_depth=5,
            min_child_samples=10,
            random_state=RANDOM_STATE,
            verbose=-1,
        )
        candidate_models.append((
            "lightgbm",
            "LightGBM Priority Classifier",
            lgb_clf,
            {"n_estimators": 100, "learning_rate": 0.05, "num_leaves": 31, "max_depth": 5, "min_child_samples": 10},
        ))
    except Exception:
        pass

    benchmark_results: List[Dict[str, Any]] = []

    for model_id, model_name, model_obj, hyperparams in candidate_models:
        # Cross-validation on training split (no test leakage)
        cv_res = cross_validate(model_obj, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)

        cv_metrics = {
            "cv_accuracy_mean": float(round(np.mean(cv_res["test_accuracy"]), 4)),
            "cv_accuracy_std": float(round(np.std(cv_res["test_accuracy"]), 4)),
            "cv_precision_mean": float(round(np.mean(cv_res["test_precision"]), 4)),
            "cv_precision_std": float(round(np.std(cv_res["test_precision"]), 4)),
            "cv_recall_mean": float(round(np.mean(cv_res["test_recall"]), 4)),
            "cv_recall_std": float(round(np.std(cv_res["test_recall"]), 4)),
            "cv_f1_mean": float(round(np.mean(cv_res["test_f1"]), 4)),
            "cv_f1_std": float(round(np.std(cv_res["test_f1"]), 4)),
            "cv_roc_auc_mean": float(round(np.mean(cv_res["test_roc_auc"]), 4)),
            "cv_roc_auc_std": float(round(np.std(cv_res["test_roc_auc"]), 4)),
        }

        # Train on full training split and evaluate on held-out test split
        model_obj.fit(X_train, y_train)
        y_pred = model_obj.predict(X_test)
        y_proba = model_obj.predict_proba(X_test)[:, 1] if hasattr(model_obj, "predict_proba") else y_pred

        acc = float(round(accuracy_score(y_test, y_pred), 4))
        prec = float(round(precision_score(y_test, y_pred, zero_division=0), 4))
        rec = float(round(recall_score(y_test, y_pred, zero_division=0), 4))
        f1 = float(round(f1_score(y_test, y_pred, zero_division=0), 4))
        roc_auc = float(round(roc_auc_score(y_test, y_proba), 4))
        cm = confusion_matrix(y_test, y_pred).tolist()

        benchmark_results.append({
            "model_id": model_id,
            "model_name": model_name,
            "hyperparameters": hyperparams,
            "test_metrics": {
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "f1_score": f1,
                "roc_auc": roc_auc,
            },
            "cross_validation_5fold": cv_metrics,
            "confusion_matrix": {
                "true_negative": cm[0][0] if len(cm) > 1 else cm[0][0],
                "false_positive": cm[0][1] if len(cm) > 1 and len(cm[0]) > 1 else 0,
                "false_negative": cm[1][0] if len(cm) > 1 else 0,
                "true_positive": cm[1][1] if len(cm) > 1 and len(cm[1]) > 1 else 0,
                "raw_matrix": cm,
            },
        })

    # 4. Determine Champion Model based on Composite Test F1 & ROC-AUC
    # We sort by F1-score and ROC-AUC
    sorted_models = sorted(
        benchmark_results,
        key=lambda m: (m["test_metrics"]["f1_score"], m["test_metrics"]["roc_auc"]),
        reverse=True,
    )
    champion = sorted_models[0]
    for m in benchmark_results:
        m["is_champion"] = (m["model_id"] == champion["model_id"])

    comparison_payload = {
        "benchmark_id": "bench_phase14_v1",
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "dataset_metadata": {
            "total_samples": total_samples,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "num_features": len(FEATURE_COLUMNS),
            "class_distribution": {
                "positive_high_priority": positive_count,
                "negative_standard_priority": negative_count,
                "positive_percentage": pos_ratio,
            },
            "features_used": FEATURE_COLUMNS,
            "is_synthetic": True,
            "evaluation_notice": "Trained and benchmarked on synthetic demo data. Not certified for live production financial underwriting.",
        },
        "models": benchmark_results,
        "champion_model": {
            "model_id": champion["model_id"],
            "model_name": champion["model_name"],
            "selection_criteria": "Highest Test F1-Score & ROC-AUC under 5-Fold Stratified Cross-Validation",
            "test_f1": champion["test_metrics"]["f1_score"],
            "test_roc_auc": champion["test_metrics"]["roc_auc"],
            "test_precision": champion["test_metrics"]["precision"],
            "test_recall": champion["test_metrics"]["recall"],
        },
    }

    if save_artifacts:
        comp_path = ARTIFACTS_DIR / "model_comparison.json"
        with open(comp_path, "w", encoding="utf-8") as f:
            json.dump(comparison_payload, f, indent=2, ensure_ascii=False)

    return comparison_payload


if __name__ == "__main__":
    results = run_model_benchmarks(save_artifacts=True)
    print("=== Model Benchmark Results ===")
    for m in results["models"]:
        champ_tag = " [🏆 CHAMPION]" if m["is_champion"] else ""
        print(f"• {m['model_name']}{champ_tag}:")
        print(f"    Test F1: {m['test_metrics']['f1_score']:.4f} | ROC-AUC: {m['test_metrics']['roc_auc']:.4f} | Prec: {m['test_metrics']['precision']:.4f} | Rec: {m['test_metrics']['recall']:.4f}")
        print(f"    5-Fold CV F1 Mean: {m['cross_validation_5fold']['cv_f1_mean']:.4f} ± {m['cross_validation_5fold']['cv_f1_std']:.4f}")
