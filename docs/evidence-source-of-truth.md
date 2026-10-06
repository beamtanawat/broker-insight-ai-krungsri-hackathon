# Evidence Source of Truth & Consumer Mapping

This document provides a single reference mapping every metric, version, and technical evidence item to its authoritative JSON source artifact and consuming frontend UI / backend API endpoint.

---

## 1. Master Evidence Mapping Table

| Evidence Domain | Metric / Property | Authoritative Source Artifact | Consuming API Endpoint | Consuming UI Route / Component |
|---|---|---|---|---|
| **ML Scoring** | Model Name & Version (`LightGBM v1.0.0`) | `backend/app/ml/experiments/baseline.json` | `GET /model/registry` | `/model` (Health & Governance) |
| | Holdout Test F1 (`0.8778`), Precision (`0.8587`), Recall (`0.8977`) | `backend/app/ml/experiments/baseline.json` | `GET /model/metrics` | `/model` (Health & Evidence) |
| | 5-Fold Cross-Validation F1 (`0.8571`), Precision (`0.8298`), Recall (`0.8864`) | `backend/app/ml/artifacts/evaluation_metrics.json` | `GET /model/benchmark` | `/model` (Model Comparison) |
| | ROC-AUC (`0.9564` Holdout / `0.9526` CV) | `backend/app/ml/experiments/baseline.json` | `GET /model/metrics` | `/model` (ROC Curve Modal) |
| | Confusion Matrix (TN:139, FP:13, FN:9, TP:79) | `backend/app/ml/experiments/baseline.json` | `GET /model/evidence/errors` | `/model` (Confusion Matrix Tab) |
| **Calibration** | Platt Scaling Brier Score (`0.0757`), ECE (`0.0445` Holdout / `0.0811` CV) | `backend/app/ml/artifacts/calibration_metrics.json` | `GET /model/calibration` | `/model` (Calibration Curves) |
| | Calibrated Probability ($0-100\%$) | Dynamic runtime model inference | `POST /customers/{id}/analyze` | `/customers/[id]` (`PriorityScore`) |
| **Explainability** | TreeSHAP Feature Attributions | Dynamic runtime TreeExplainer | `POST /customers/{id}/analyze` | `/customers/[id]` (SHAP Drawer) |
| **Fairness** | Disparate Impact Ratio (`0.96`), Sensitive Exclusion | `backend/app/ml/artifacts/fairness_report.json` | `GET /model/fairness` | `/model` (Fairness Tab) |
| **Drift** | Feature Population Stability Index (PSI) | `backend/app/ml/artifacts/drift_report.json` | `GET /model/drift` | `/model` (Feature Drift Table) |
| **Recommendation** | Engine Version (`v1.1`), Hard Gate Violations (`0.0%`) | `backend/app/ml/experiments/recommendation_evaluation.json` | `GET /recommendations/performance` | `/model` (AI Health Summary) |
| | Top-1 Match Rate (`100.0%`), Top-K (`100.0%`) | `backend/app/ml/experiments/recommendation_evaluation.json` | `GET /recommendations/benchmark` | `/model` (Recommendations) |
| | Average Matching Latency (`0.86 ms`) | `backend/app/ml/experiments/recommendation_evaluation.json` | `GET /recommendations/performance` | `/model` (Latency Strip) |
| **LLM Optimization** | Gemini 1.5 Flash + Prompt `v2.0-optimized` | `backend/app/ml/experiments/llm_optimized.json` | `GET /model/llm-performance` | `/model` (LLM Health Tab) |
| | Token Reduction (`16.6%`), Cost Reduction (`33.5%`) | `backend/app/ml/experiments/llm_optimized.json` | `GET /model/llm-performance` | `/model` (Cost Analysis) |
| | Cached Latency Reduction (`95.8%`, 0.15ms vs 3.45ms) | `backend/app/ml/experiments/llm_optimized.json` | `GET /model/llm-performance` | `/model` (Cache Metrics) |
| | Guardrail Failure Rate (`0.0%`), Structured Validity (`100.0%`) | `backend/app/ml/experiments/llm_optimized.json` | `GET /model/llm-performance` | `/model` (Safety Badges) |
| **E2E Performance** | Workflow Cold Latency (`57.4 ms`), Warm (`34.2 ms`) | `backend/app/ml/experiments/e2e_optimized.json` | `GET /performance/e2e` | `/model` (E2E Performance Tab) |
| | Workflow P50 (`37.1 ms`), P95 (`64.8 ms`), P99 (`77.8 ms`) | `backend/app/ml/experiments/e2e_optimized.json` | `GET /performance/e2e` | `/model` (SLA Compliance) |
| | Max Benchmark Throughput (`3,480 req/sec`) | `backend/app/ml/experiments/e2e_optimized.json` | `GET /performance/e2e` | `/model` (Concurrency Scaling) |
| **Pilot Evaluation** | Participant Count (`0`, "Awaiting pilot data") | `pilot_sessions` database table | `GET /pilot/dashboard` | `/pilot` (Scorecard) |
| | Completed Sessions (`0`, "Awaiting pilot data") | `pilot_sessions` database table | `GET /pilot/dashboard` | `/pilot` (Session Metrics) |
| **Audit Ledger** | Security Events & Timestamped Hashes | `audit_logs` database table | `GET /admin/audit-logs` | `/admin/audit` (Audit Table & Drawer) |

---

## 2. Evidence Verification Rules

1. **Strict Origin Enforcement:** No frontend component may display a hardcoded metric that is not backed by an API route or authoritative JSON artifact.
2. **Evaluation Protocol Distinction:** Reports must explicitly state whether an ML metric represents **Holdout Test ($F1=0.878$)** or **5-Fold Cross-Validation ($F1=0.857$)**.
3. **Environment Qualification:** Latency and throughput figures must be qualified as **Local / Demo Sandbox Benchmark** on Apple Silicon Darwin macOS, not production cloud SLA guarantees.
4. **Zero-Data State for Pilot Evidence:** When database records indicate $n=0$ human participants, the application displays *"Awaiting pilot data"*, maintaining absolute evidence integrity.
