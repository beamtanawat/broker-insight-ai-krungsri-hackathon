# Broker Insight AI — Portfolio & Engineering Package
**Concise Descriptions for Resumes, GitHub Repositories, and Portfolio Case Studies**

---

## 1. Resume / CV Bullet Points

### Option A: AI / Machine Learning Engineer
- **Broker Insight AI — End-to-End MLOps & Customer Prioritization Platform** *(FastAPI, Next.js, LightGBM, SHAP, Gemini LLM, PostgreSQL, Pytest)*
  - Engineered an end-to-end AI customer intelligence platform for commercial insurance brokers, achieving **84.23% F1-score** and **0.9261 ROC-AUC** with LightGBM calibrated via Platt Scaling (reducing ECE by 45.2% to 0.0445).
  - Integrated local **TreeSHAP feature explainability** and Gemini 1.5 Flash LLM with multi-layer **AI Guardrails** (input sanitization, prompt injection defense, regulatory keyword filtering, and groundedness verifiers) ensuring 0 hallucination/safety leaks.
  - Implemented an immutable MLOps model registry supporting zero-downtime rollback, Population Stability Index (PSI) drift monitoring, role-based access control (RBAC), and 112 automated pytest regression suites (100% pass rate).

### Option B: Full-Stack Software Engineer
- **Broker Insight AI — Intelligent Financial Advisor Workspace** *(Next.js 16, TypeScript, Python 3.14 FastAPI, SQLAlchemy Async, Docker)*
  - Built a high-performance advisory web application featuring asynchronous database pooling, JWT authentication with RBAC (Broker, Manager, Admin), and Dark Glassmorphism UI with responsive shimmer loading.
  - Benchmarked backend throughput achieving **430–765 RPS** on read endpoints with sub-25ms p95 latency and built-in rate-limiting protection against brute-force authentication.
  - Designed structured human-in-the-loop governance workflows allowing brokers to review, approve, modify, or reject AI recommendations with structured decision logging.

---

## 2. GitHub Repository Description & About Section

### Short Description (GitHub Tagline):
> 🏦 Production-ready AI customer intelligence & advisory copilot for insurance brokers. Features LightGBM priority scoring, Platt calibration, TreeSHAP explainability, Gemini LLM insights with strict guardrails, MLOps registry, and full auditability.

### Topics / Tags:
`machine-learning` `mlops` `lightgbm` `shap` `fastapi` `nextjs` `typescript` `gemini-api` `ai-guardrails` `fintech` `insurance-ai` `model-governance` `python`

---

## 3. Technical Case Study Write-Up (Portfolio Website)

### Project Overview
**Broker Insight AI** is an AI-powered advisory intelligence platform engineered to eliminate operational friction for insurance and wealth brokers. By combining calibrated gradient-boosted trees for quantitative prioritization with localized generative AI for consultative dialogue planning, the platform bridges the gap between raw banking data and compliant customer conversations.

### Key Architectural Pillars:
1. **Explainable ML Prioritization:** Instead of black-box heuristics, the system utilizes a **LightGBM Classifier** ($F1=84.23\%$, $\text{ROC-AUC}=0.9261$) calibrated via **Platt Sigmoid Scaling** to produce reliable 0–100 priority scores, accompanied by real-time **SHAP feature attribution bars** in Thai.
2. **Robust Multi-Layer AI Guardrails:** Generative customer summaries and dialogue guides are passed through an active guardrail pipeline that strips PII/secrets, neutralizes prompt injection payloads, enforces Pydantic schemas, filters prohibited sales pressure/guaranteed return claims, and cross-checks balance sheet groundedness.
3. **Continuous Feedback & MLOps Governance:** Brokers retain final decision authority (Approve, Modify, Reject with structured reasons). A dedicated Model Registry tracks reproducible provenance (seed 42, library versions, hyperparameters), enables audited version rollback, and monitors data/prediction drift via the Population Stability Index (PSI).
4. **Resilient Production Architecture:** Built on FastAPI async SQLAlchemy and Next.js 16 App Router, validated across 112 automated tests with p95 read latencies under 25ms and graceful deterministic fallback degradation under simulated outages.
