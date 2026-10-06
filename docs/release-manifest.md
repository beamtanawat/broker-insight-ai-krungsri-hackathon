# Broker Insight AI — Release Manifest

> **Release Tag:** `v1.0.0-release-freeze`  
> **Release Date:** August 30, 2026  
> **Release Environment:** Demo Sandbox / Portfolio / Pilot Prototype  
> **Release Status:** ✅ **READY FOR PORTFOLIO & DEMO** *(Not Certified for Live Banking Operations)*

---

## 1. System Component Versions

| Component | Repository Subpath | Version | Description / Active Artifact |
|---|---|:---:|---|
| **Core Application** | `/` | `1.0.0` | Unified Broker Decision Support Workspace |
| **Frontend UI** | `/frontend` | `0.1.0` | Next.js 16.3 (Turbopack, React 19, TypeScript 5, Vanilla CSS Tokens) |
| **Backend API** | `/backend` | `1.0.0` | FastAPI 0.115+, Python 3.11+, Async SQLAlchemy |
| **ML Priority Model** | `/backend/app/ml` | `1.0.0` | LightGBM Binary Classifier (`model.pkl`, $F1=0.878$, $\text{ROC-AUC}=0.956$) |
| **Probability Calibrator** | `/backend/app/ml` | `1.0.0` | Platt Sigmoid Calibrator (`calibrator.pkl`, $\text{ECE}=0.0445$, $\text{Brier}=0.0757$) |
| **Explainability Explainer** | `/backend/app/ml` | `1.0.0` | TreeSHAP Explainer (`shap_explainer.pkl`, Polynomial-time exact local attributions) |
| **Recommendation Engine** | `/backend/app/services` | `1.1.0` | Pre-Ranking Hard Eligibility Gate (0% Gating Violations) |
| **LLM Copilot & Insights** | `/backend/app/services` | `2.0.0` | Gemini 1.5 Flash + Prompt `v2.0-optimized` (TTLCache 3600s + Offline Rule Fallback) |
| **Synthetic Dataset** | `/backend/app/ml/artifacts` | `1.0.0` | 1,200 Synthetic Customer Profiles + 12 Krungsri-branded products |
| **Master Evidence Registry** | `/docs` | `1.0.0` | Authoritative metrics registry (`docs/master-evidence-registry.json`) |

---

## 2. Release Integrity & Quality Verification

* **Backend Automated Tests:** 182 / 182 tests passing (100% pass rate in `.venv/bin/pytest -v`).
* **Frontend Production Build:** Clean compilation with 0 TypeScript/Turbopack errors (`next build` 12/12 static/dynamic routes).
* **Security & Secret Scrubbing:** Zero secrets or real personal customer data in the codebase; all credentials explicitly labeled `DEMO ONLY`.
* **Single Source of Truth:** 100% alignment between experiment JSON files, database endpoints, frontend UI cards, and documentation.
