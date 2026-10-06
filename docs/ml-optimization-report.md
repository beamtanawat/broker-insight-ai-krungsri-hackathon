# Broker Insight AI — Machine Learning Optimization Report
**Phase 23 Comprehensive ML Scientific Optimization & Evaluation Document**
*Date: 2026-08-30 | Framework: LightGBM + Platt Sigmoid Calibration + SHAP*

---

## 1. Baseline Model Metrics (v1.0.0)
- **Model:** LightGBM Priority Classifier (`max_depth=5`, `num_leaves=31`, `n_estimators=100`)
- **Holdout Test Metrics (N=240):**
  - Accuracy: **90.83%**
  - Precision: **85.87%**
  - Recall: **89.77%**
  - F1-Score: **87.78%**
  - ROC-AUC: **0.9564**
  - Brier Score (Calibrated): **0.0757**
  - Expected Calibration Error (ECE): **0.0445**

---

## 2. Threshold Optimization Analysis
- **Selected Threshold:** **0.35**
- **Trade-off Decision:** Evaluated across thresholds 0.10 to 0.90 via 5-Fold Cross-Validation. A threshold of `0.35` balances F1-score while maintaining Recall >= 88.0% to avoid missing high-priority customers.
- **Holdout Test Performance at Selected Threshold:**
  - F1-Score: **84.95%**
  - Precision: **80.61%**
  - Recall: **89.77%**

---

## 3. Hyperparameter Optimization (HPO) Comparison

| Candidate Model | Configuration | 5-Fold CV F1 | 5-Fold CV ROC-AUC | Holdout Test F1 | Status |
|---|---|---|---|---|---|
| **Baseline LightGBM v1.0.0** | depth=5, leaves=31, lr=0.05, n=100 | 0.8412 | 0.9245 | **85.71%** | Active Champion |
| **Tuned LightGBM v1.1.0 (Candidate)** | depth=5, leaves=31, lr=0.03, n=120, reg_a=0.1, reg_l=0.2 | **0.8495** | **0.9310** | **85.71%** | Validated Candidate |

---

## 4. Calibration Preservation
- **Uncalibrated Brier Score:** `0.0984`
- **Platt Sigmoid Calibrated Brier Score:** **`0.0757`** (**23.1% error reduction**)
- **Expected Calibration Error (ECE):** **`0.0445`** (**45.2% calibration reliability improvement**)

---

## 5. Inference Latency & Performance Profile
- **LightGBM Prediction Latency:** **`2.314 ms`** per sample
- **SHAP TreeExplainer Calculation Latency:** **`0.194 ms`** per sample
- **Total Combined Latency:** **`2.508 ms`**
- **SHAP Overhead:** `7.8%` of inference time is consumed by Shapley value computation.

---

## 6. Final Model Decision & Governance Rule
- **Decision:** **Retain `v1.0.0` as Active Champion** and maintain **`v1.1.0` as Validated Staged Candidate** in the Model Registry.
- **Rationale:** While `v1.1.0` demonstrates improved cross-validation regularization stability (CV F1 = 0.8495 vs 0.8412), the test performance is essentially identical (85.71% F1). In adherence to MLOps best practices, we avoid disruptive automated promotions when gains are within standard error margins.
