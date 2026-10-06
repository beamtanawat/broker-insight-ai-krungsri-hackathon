"""
LightGBM training script — trains binary classifier and saves model + SHAP explainer.
All data is synthetic. Model is for prototype demonstration only.
"""
from pathlib import Path

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
import shap
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
DATA_PATH = ARTIFACTS_DIR / "synthetic_customers.csv"

FEATURE_COLS = [
    "days_to_renewal",
    "days_since_last_contact",
    "payment_status_code",
    "kyc_completeness_score",
    "num_active_policies",
    "num_financial_products",
    "has_active_loan",
    "transaction_recency_days",
    "crm_engagement_score",
    "customer_tenure_years",
]
TARGET_COL = "needs_attention"

# Thai feature labels for SHAP explanations shown in UI
FEATURE_THAI_LABELS = {
    "days_to_renewal": "กรมธรรม์ใกล้ครบกำหนดต่ออายุ",
    "days_since_last_contact": "ไม่ได้ติดต่อลูกค้ามาระยะหนึ่ง",
    "payment_status_code": "สถานะการชำระเบี้ย",
    "kyc_completeness_score": "ความสมบูรณ์ของข้อมูล KYC",
    "num_active_policies": "จำนวนกรมธรรม์ที่ใช้งานอยู่",
    "num_financial_products": "จำนวนผลิตภัณฑ์ทางการเงิน",
    "has_active_loan": "มีสินเชื่อที่ใช้งานอยู่",
    "transaction_recency_days": "ความถี่ในการทำธุรกรรม",
    "crm_engagement_score": "ระดับการมีส่วนร่วมของลูกค้า",
    "customer_tenure_years": "ระยะเวลาการเป็นลูกค้า",
}


def main():
    if not DATA_PATH.exists():
        print("Data file not found. Run generate_data.py first.")
        return

    df = pd.read_csv(DATA_PATH)
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    params = {
        "objective": "binary",
        "metric": "auc",
        "learning_rate": 0.05,
        "num_leaves": 31,
        "n_estimators": 200,
        "random_state": 42,
        "verbosity": -1,
    }

    print("Training LightGBM model...")
    model = lgb.LGBMClassifier(**params)
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        callbacks=[lgb.early_stopping(20, verbose=False), lgb.log_evaluation(period=50)],
    )

    y_pred = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_pred)
    print(f"✓ AUC-ROC: {auc:.4f}")
    print(classification_report(y_test, (y_pred > 0.5).astype(int)))

    # SHAP explainer (TreeSHAP — fast, exact)
    print("Building SHAP explainer...")
    explainer = shap.TreeExplainer(model)

    # Save artifacts
    model_path = ARTIFACTS_DIR / "model.pkl"
    explainer_path = ARTIFACTS_DIR / "shap_explainer.pkl"
    meta_path = ARTIFACTS_DIR / "model_meta.json"

    joblib.dump(model, model_path)
    joblib.dump(explainer, explainer_path)

    import json, os
    meta = {
        "model_version": os.getenv("ML_MODEL_VERSION", "1.0.0"),
        "auc_roc": round(auc, 4),
        "feature_cols": FEATURE_COLS,
        "feature_thai_labels": FEATURE_THAI_LABELS,
        "n_train": len(X_train),
        "n_test": len(X_test),
    }
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2))

    print(f"✓ model.pkl saved to {model_path}")
    print(f"✓ shap_explainer.pkl saved to {explainer_path}")
    print(f"✓ model_meta.json saved to {meta_path}")
    print("\nPrototype note: This model is trained on synthetic data only.")


if __name__ == "__main__":
    main()
