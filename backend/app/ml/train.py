"""
End-to-End ML Training Pipeline for Customer Priority Classification.
Pipeline:
  Dataset -> Validation -> Feature Engineering -> Train/Test Split
  -> Model Training (LightGBM with RandomForest Fallback)
  -> Real Metric Evaluation -> SHAP Explainer -> Save Artifacts
"""
import json
import random
from pathlib import Path
from typing import Any, Dict, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import shap

from app.ml.features import (
    FEATURE_COLUMNS,
    FEATURE_THAI_LABELS,
    prepare_feature_dataframe,
)
from app.ml.evaluate import evaluate_classifier

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)
random.seed(RANDOM_STATE)


def generate_synthetic_training_dataset(n_samples: int = 1000) -> pd.DataFrame:
    """
    Generates a realistic synthetic training dataset for customer priority scoring.
    Label logic:
      1 (High Priority) when:
        - Insurance renewal is within 30 days OR
        - Follow-up is overdue / payment overdue OR
        - Protection gap (high liabilities and low insurance coverage) OR
        - High tier customer with long time since contact (>60 days)
      0 (Standard/Low Priority) otherwise.
    """
    np.random.seed(RANDOM_STATE)
    random.seed(RANDOM_STATE)
    data = []
    for i in range(n_samples):
        age = int(np.clip(np.random.normal(45, 12), 22, 75))
        income = float(random.choice([40.0, 75.0, 150.0, 250.0]))
        tenure = int(random.randint(3, 120))
        tier = int(random.choices([0, 1, 2], weights=[0.6, 0.25, 0.15])[0])
        is_kyc = 1 if random.random() > 0.15 else 0

        has_loan = 1 if random.random() > 0.45 else 0
        assets = float(round(random.uniform(50000, 10000000), -3))
        liabilities = float(round(random.uniform(200000, 6000000), -3)) if has_loan else 0.0
        savings = float(round(random.uniform(3000, 80000), -2))
        num_prod = int(random.randint(1, 6))

        has_insurance = random.random() > 0.25
        ins_count = int(random.randint(1, 4)) if has_insurance else 0
        total_cov = float(ins_count * random.uniform(300000, 3000000)) if has_insurance else 0.0

        days_renewal = int(random.randint(5, 365)) if has_insurance else 365
        days_last_contact = int(random.randint(2, 240))
        contact_freq = int(random.randint(0, 8))
        tx_freq = int(random.randint(1, 50))
        has_overdue = 1 if (random.random() > 0.85 or days_last_contact > 120) else 0

        # Deterministic + stochastic target generation
        score_weight = 0.0
        if days_renewal <= 30:
            score_weight += 0.35
        if has_overdue == 1:
            score_weight += 0.30
        if has_loan == 1 and total_cov < liabilities * 0.5:
            score_weight += 0.25  # Protection gap
        if tier >= 1 and days_last_contact >= 60:
            score_weight += 0.20
        if is_kyc == 0:
            score_weight += 0.10

        # Add slight noise
        noise = np.random.normal(0, 0.08)
        prob = np.clip(score_weight + noise, 0.0, 1.0)
        target = 1 if prob >= 0.40 else 0

        data.append({
            "age": age,
            "income_band_numeric": income,
            "relationship_tenure_months": tenure,
            "relationship_tier_encoded": tier,
            "is_kyc_verified": is_kyc,
            "total_assets": assets,
            "total_liabilities": liabilities,
            "monthly_savings": savings,
            "has_active_loan": has_loan,
            "num_financial_products": num_prod,
            "insurance_count": ins_count,
            "days_to_renewal": days_renewal,
            "days_since_last_contact": days_last_contact,
            "contact_frequency_90d": contact_freq,
            "transaction_activity_90d": tx_freq,
            "existing_coverage_amount": total_cov,
            "has_overdue_followup": has_overdue,
            "customer_priority": target,
        })

    return pd.DataFrame(data)


def train_pipeline(save_artifacts: bool = True) -> Dict[str, Any]:
    """
    Executes the complete training and evaluation pipeline:
    1. Generates and validates synthetic dataset
    2. Feature engineering & Train/Test split
    3. Model training (LightGBM with RandomForest fallback)
    4. Real evaluation metric calculation
    5. SHAP TreeExplainer generation
    6. Saves artifacts and returns evaluation metrics
    """
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    print("=== [1/5] Generating Synthetic Training Dataset ===")
    df = generate_synthetic_training_dataset(n_samples=1200)
    csv_path = ARTIFACTS_DIR / "synthetic_training_data.csv"
    df.to_csv(csv_path, index=False)
    print(f"  ✓ Saved {len(df)} samples to {csv_path}")
    print(f"  ✓ Class Distribution: {df['customer_priority'].value_counts().to_dict()}")

    # 2. Features and Target
    X = df[FEATURE_COLUMNS].copy()
    y = df["customer_priority"].values

    # 3. Train / Test Split
    print("=== [2/5] Splitting Data (80% Train, 20% Test) ===")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y
    )

    # 4. Model Training
    print("=== [3/5] Training Model ===")
    model = None
    model_name = "LightGBM Priority Classifier"

    try:
        import lightgbm as lgb
        model = lgb.LGBMClassifier(
            n_estimators=100,
            learning_rate=0.05,
            num_leaves=31,
            max_depth=5,
            min_child_samples=10,
            random_state=RANDOM_STATE,
            verbose=-1,
        )
        model.fit(X_train, y_train)
        print("  ✓ LightGBM training succeeded.")
    except Exception as e:
        print(f"  ⚠️ LightGBM training failed ({e}), falling back to RandomForestClassifier...")
        model_name = "RandomForest Priority Classifier"
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            min_samples_split=5,
            random_state=RANDOM_STATE,
        )
        model.fit(X_train, y_train)
        print("  ✓ RandomForest fallback training succeeded.")

    # 5. Evaluation on Test Split
    print("=== [4/5] Evaluating on Test Split ===")
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    metrics = evaluate_classifier(
        y_true=y_test,
        y_pred=y_pred,
        y_proba=y_proba,
        model_name=model_name,
        model_version="1.0.0",
        save_artifact=save_artifacts,
    )
    print(f"  ✓ Actual Accuracy: {metrics['accuracy']:.4f}")
    print(f"  ✓ Actual Precision: {metrics['precision']:.4f}")
    print(f"  ✓ Actual Recall: {metrics['recall']:.4f}")
    print(f"  ✓ Actual F1-Score: {metrics['f1_score']:.4f}")
    print(f"  ✓ Actual ROC-AUC: {metrics['roc_auc']:.4f}")
    print(f"  ✓ Confusion Matrix: {metrics['confusion_matrix']}")

    # 6. Fit TreeSHAP Explainer
    print("=== [5/5] Building SHAP TreeExplainer & Saving Artifacts ===")
    explainer = shap.TreeExplainer(model)

    if save_artifacts:
        joblib.dump(model, ARTIFACTS_DIR / "model.pkl")
        joblib.dump(explainer, ARTIFACTS_DIR / "shap_explainer.pkl")

        metadata = {
            "model_name": model_name,
            "model_version": "1.0.0",
            "feature_columns": FEATURE_COLUMNS,
            "feature_labels": FEATURE_THAI_LABELS,
            "metrics": metrics,
            "is_synthetic": True,
            "disclaimer": "Trained on synthetic data for hackathon prototype demonstration only.",
        }
        with open(ARTIFACTS_DIR / "model_meta.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        print(f"  ✓ All artifacts successfully saved in {ARTIFACTS_DIR}")

    return {
        "model": model,
        "explainer": explainer,
        "metrics": metrics,
    }


if __name__ == "__main__":
    train_pipeline(save_artifacts=True)
