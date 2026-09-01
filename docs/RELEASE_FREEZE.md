# Broker Insight AI — Formal Release Freeze Declaration

> **Release Version:** `v1.0.0-release-freeze`  
> **Effective Date:** August 30, 2026  
> **Release Authority:** Broker Insight AI Engineering Team  
> **Status:** 🔒 **OFFICIALLY FROZEN & READY FOR PORTFOLIO / DEMO**

---

## 1. Release Freeze Declaration

As of Phase 35, the **Broker Insight AI** codebase, documentation, machine learning models, and evidence registries have completed full quality assurance, reconciliation, and verification. 

**Effective immediately, the codebase is under a formal Release Freeze:**
* No new features or UI redesigns may be introduced.
* No ML hyperparameter tuning or retraining is permitted without a formal registry version bump.
* No changes to prompts, recommendation weights, or hard eligibility rules are permitted.
* All displayed metrics are locked to the authoritative [`docs/master-evidence-registry.json`](file:///Users/chalermsak/Downloads/broker-insight-ai-krungsri-hackathon-main/docs/master-evidence-registry.json).

---

## 2. Frozen Configuration Matrix

| Artifact / Layer | Frozen Identifier | Verification Hash / Status |
|---|---|:---:|
| **ML Priority Model** | `LightGBM Classifier v1.0.0` | `model.pkl` (F1: 0.878, ROC-AUC: 0.956) |
| **Probability Calibrator** | `Platt Sigmoid Calibrator v1.0.0` | `calibrator.pkl` (ECE: 0.0445, Brier: 0.0757) |
| **Explainability Explainer** | `TreeSHAP Explainer v1.0.0` | `shap_explainer.pkl` (Exact local polynomial attributions) |
| **Recommendation Engine** | `Engine v1.1.0 (Hard Gate Gated)` | 0.0% Gating Violations |
| **LLM Inference** | `gemini-1.5-flash / prompt v2.0-optimized` | TTLCache (3600s) + Deterministic Offline Fallback |
| **Evidence Registry** | `Master Registry v1.0.0` | [`docs/master-evidence-registry.json`](file:///Users/chalermsak/Downloads/broker-insight-ai-krungsri-hackathon-main/docs/master-evidence-registry.json) |
| **Frontend UI Shell** | `Next.js 16.3 / Vanilla CSS Tokens` | 12/12 routes compiled in Turbopack |

---

## 3. Verified Test & Build Evidence

```bash
# Frontend Build Verification
▲ Next.js 16.3.3 (Turbopack)
✓ Generating static pages using 9 workers (12/12) in 118ms
✓ Finished TypeScript in 550ms (0 errors)

# Backend Pytest Regression Suite
================ 182 passed, 910 warnings in 113.12s (0:01:53) =================
```

---

## 4. Explicit Known Limitations

1. **Synthetic Sandbox Data:** All customer records, financial balances, and insurance policies are synthetic. Production deployment requires live core banking ETL pipelines.
2. **Prototype Authentication:** The application uses localized JWT tokens with demo accounts (`broker@demo.local`, `manager@demo.local`, `admin@demo.local`). Live operations require enterprise SAML/OAuth2 SSO.
3. **Human Pilot Evidence:** Survey instrumentation and session logging are fully operational in `/pilot`; live broker empirical evidence remains $n=0$ pending enterprise deployment.
4. **Regulatory Certification:** The prototype demonstrates compliance-aware guardrails but has not completed formal banking Model Risk Management (MRM) certification.
