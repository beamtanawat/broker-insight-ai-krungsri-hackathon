# Broker Insight AI — Portfolio Descriptions

---

## 1. One-Line Summary (Cards & Project Headlines)
> **Broker Insight AI:** An end-to-end AI decision-support workspace for insurance brokers featuring calibrated LightGBM prioritization ($F1=0.878$, $\text{ROC-AUC}=0.956$), TreeSHAP explainability, hard eligibility gating (0% violation), and prompt-cached LLM conversation preparation.

---

## 2. 100-Word Summary (General Showcase & Portfolio Blurbs)
> **Broker Insight AI** is an enterprise-grade prototype designed to solve client prioritization and advisory bottlenecks for commercial insurance brokers. Powered by a calibrated LightGBM model ($F1=0.878$ on holdout test, $F1=0.857$ on 5-fold CV) and TreeSHAP feature attributions, the system explains exactly why a customer needs attention today. It pairs predictive scoring with a deterministic hard eligibility recommendation engine (0% violation rate) and a cost-optimized Gemini LLM copilot (sub-second cached latency) for conversation planning. Licensed brokers maintain full governance through an intuitive 5-tab workspace, while managers monitor MLOps drift and immutable audit trails in real time.

---

## 3. Full-Stack Engineering Showcase Version
> **Broker Insight AI — Enterprise Decision Support Platform**
> - **Architecture:** Engineered a high-throughput, low-latency decision platform with Next.js 16 (Turbopack, TypeScript, Vanilla CSS Design System) and FastAPI (Python 3.11+, Async SQLAlchemy, SQLite/PostgreSQL).
> - **Performance:** Achieved an End-to-End P95 latency of 64.8ms across composite requests including database queries, ML inference, TreeSHAP computation, and cached LLM generation in local benchmarks.
> - **Caching & Optimization:** Built an in-memory TTLCache strategy reducing LLM token latency by 95.8% for repeated queries while maintaining sub-second response times.
> - **Security & Governance:** Implemented role-based access control (Broker/Manager/Admin), rate limiting, PII sanitization, prompt injection defense, and an immutable audit trail with slide-out event inspection drawers.
> - **Testing & Reliability:** Developed an extensive automated test suite with 182 test cases across 35 phases, validating graceful offline fallbacks and 0% regression.

---

## 4. AI / ML Specialist Showcase Version
> **Broker Insight AI — Explainable AI & MLOps System**
> - **Predictive Modeling:** Trained and tuned a LightGBM binary classifier ($F1=0.878$, $\text{ROC-AUC}=0.956$ on holdout test; $F1=0.857$ on 5-fold CV) on 17 audited domain features to score renewal and cross-sell probability.
> - **Probability Calibration:** Applied Platt sigmoid scaling to correct overconfident tree outputs, achieving an Expected Calibration Error (ECE) of 0.0445 and Brier score of 0.0757.
> - **Explainability (XAI):** Integrated TreeSHAP to compute exact local feature attributions, translating mathematical Shapley values into human-readable positive and negative priority drivers for brokers.
> - **Safe Recommendation Engine:** Built a hybrid product matcher combining 5-category need assessment with deterministic hard eligibility gating, guaranteeing 0.0% compliance/age/income violations.
> - **MLOps & Drift Monitoring:** Constructed an active model registry with Champion/Candidate versioning, promotion/rollback controls, and continuous Population Stability Index (PSI) feature drift tracking.
