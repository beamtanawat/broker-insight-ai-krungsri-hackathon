# Operations and Administration UX/UI Redesign

> Version: Phase 33.5 · Broker Insight AI (Krungsri Financial Advisory)  
> Redesigned Routes: `/analytics`, `/model`, `/pilot`, `/admin/audit`

---

## 1. Information Architecture & Role Separation

```
OPERATIONS (Managers & Admins)
 ├── Business View (/analytics)       # Customer activity, priority mix, decision rates, AI usage
 ├── AI Health & MLOps (/model)      # Overall AI health, F1/ROC-AUC, calibration, drift, promotion/rollback
 └── Pilot & Evaluation (/pilot)     # Test scenarios, Likert trust/usability scorecard, freeze snapshot

ADMINISTRATION (Admins Only)
 └── System Audit (/admin/audit)     # Immutable audit trail with event metadata inspection drawer
```

### Role Visibility Matrix

| Section / Capability | Broker | Manager | Admin |
|---|:---:|:---:|:---:|
| **Workspace (Dashboard, Customers, Chat)** | ✅ | ✅ | ✅ |
| **Business View (`/analytics`)** | ❌ | ✅ | ✅ |
| **AI Health & Model Monitoring (`/model`)** | ❌ | ✅ | ✅ |
| **Model Promotion / Rollback Controls** | ❌ | ❌ | ✅ |
| **Pilot & Evaluation (`/pilot`)** | Scenario Testing | Full Scorecard | Full Scorecard + Freeze Snapshot |
| **System Audit Trail (`/admin/audit`)** | ❌ | ❌ | ✅ |

---

## 2. Before → After Structure Mapping

| Route | Before (Phase 33.0) | After (Phase 33.5 Redesign) |
|---|---|---|
| **`/analytics`** | Generic unorganized metric cards | **Structured Business View**: Customer Priority Breakdown, Follow-up Pipeline, Recommendation Decisions (Approve/Modify/Reject), and AI Workflow activity volume |
| **`/model`** | 12 dense, fragmented tabs | **4 Focused Operational Views**: AI Health Summary (Health status pill + P95 latency + Brier/ECE), Model Evidence, Model Monitoring (Feature PSI Drift & Promotion), and LLM/Recs Health |
| **`/pilot`** | Mixed test runner and raw developer forms | **3 Operational Tabs**: Scenario Runner, Evidence Scorecard (Participants, Likert 5-scale trust/usability), and Issues & Feedback |
| **`/admin/audit`** | Basic table without detailed inspection | **Enterprise Timeline Table** with action badges, pagination, and slide-out **Event Inspection Drawer** for full audit payload |

---

## 3. Metrics Single Source of Truth

All operational metrics displayed in the redesigned console are strictly fed from established backend services:

* **ML Scoring & Baseline:** `api.model.metrics()`, `api.model.calibration()`, `api.model.drift()`
* **Model Registry & Governance:** `api.model.registry()`, `api.model.promote()`, `api.model.rollback()`
* **LLM Health & Cost Reduction:** `api.model.llmPerformance()` (84% cache hit rate, P95 latency)
* **Product Recommendation Safety:** `api.recommendations.getPerformance()` (0% Gating Violations)
* **Pilot Human Evidence:** `api.pilot.dashboard()`, `api.pilot.freeze()`
* **Audit Trail:** `api.audit.list()`

---

## 4. Progressive Disclosure & Governance Safety

* **SHAP & Audit Payloads:** Technical feature rankings and raw JSON audit metadata are placed inside slide-out `Drawer` overlays to maintain visual clarity.
* **Destructive Action Confirmation:** Admin-only Model Promotion, Model Rollback, and Pilot Freeze Snapshots require explicit confirmation dialogs (`Modal`).

---

## 5. Verification Results

* **Frontend Production Build:** `cd frontend && npm run build` passes with 0 errors across 12 routes.
* **Backend Regression Tests:** `.venv/bin/pytest -v` passes 182/182 tests with 0 regressions.
