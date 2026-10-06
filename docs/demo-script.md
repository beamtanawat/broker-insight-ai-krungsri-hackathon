# Broker Insight AI — Demo Scripts & Presentation Guide

---

## 1. Quick 60–90 Second Elevator Pitch Demo

**Goal:** Deliver a fast, high-impact overview of the core broker problem, AI prioritization, explainable recommendation, human decision, and follow-up.

| Timestamp | Screen / Route | Action | Narration (English / Thai) |
|---|---|---|---|
| **00:00 - 00:15** | `/login` → `/dashboard` | Click Quick-Fill "Broker" → Sign In | *"In commercial insurance, brokers manage hundreds of accounts and waste hours deciding who to call first. Broker Insight AI instantly prioritizes the queue using calibrated machine learning."* |
| **00:15 - 00:35** | `/dashboard` | View Priority Customer Queue → Click Customer `KS-00001` | *"On the dashboard, brokers immediately see today's high-priority opportunities, urgent renewal deadlines, and overdue tasks. Let's open Khun Nattaporn Warin (KS-00001), scored 92/100."* |
| **00:35 - 00:55** | `/customers/{id}` (Tab 2: Priority) | Inspect PriorityScore & Top Drivers | *"Instead of a black-box number, the broker sees the top 3 drivers: policy expiring in 14 days, platinum tier, and low contact frequency. Technical SHAP attributions are available in a slide-out drawer."* |
| **00:55 - 01:15** | `/customers/{id}` (Tab 3: Recommend) | Review Top Match & Click [เห็นชอบ (Approve)] | *"In Recommendations, AI identifies a Protection Gap and matches Krungsri Health Max. Hard eligibility gates ensure zero compliance violations. The broker clicks 'เห็นชอบ' (Approve) to confirm."* |
| **01:15 - 01:30** | `/customers/{id}` (Tab 4 & 5) | View Copilot opening & Create Task | *"Under Prep, the LLM Copilot generates tailored conversation starters and probing questions with quick copy buttons. Under Tasks, a follow-up is scheduled. The broker is ready in under 2 minutes."* |

---

## 2. 3–5 Minute Deep Technical Demo

**Goal:** Showcase system architecture, SHAP explainability, model calibration, hard eligibility safety, LLM caching, MLOps model registry, and immutable audit logs to technical judges or interviewers.

### Segment 1: Broker Decision Workspace (00:00 – 01:45)
1. **Dashboard:** Highlight actionable 6-tier hierarchy; explain why raw ML metrics were intentionally separated from the primary broker screen.
2. **Customer 360:** Demonstrate the 5-tab continuous workflow:
   - **Overview:** Factual profile and existing policies marked with `--verified-*` tokens.
   - **Priority:** Show calibrated LightGBM score ($F1=0.842$). Click *"ดูรายละเอียดการคำนวณ (SHAP)"* to reveal the slide-out Drawer showing positive/negative TreeSHAP feature attributions.
   - **Recommend:** Show Top-1 match structured across 4 parts (Need Signal, Profile Fit, Eligibility, Coverage Assessment). Contrast with alternatives. Click *"เห็นชอบ"* and show decision feedback recording.
   - **Prep:** Demonstrate the conversation assistant with copy-to-clipboard feedback.
   - **Tasks:** Schedule a follow-up task.

### Segment 2: Safety & Gating Demo — Scenario H (01:45 – 02:45)
1. **Pilot Scenarios:** Navigate to `/pilot` and select **Scenario H: การคัดกรองคุณสมบัติ (Eligibility Gate)** (Customer aged 68).
2. **Safety Verification:** Open customer workspace and inspect product recommendations.
3. **Observation:** Note that products requiring maximum entry age $\le 65$ (e.g. Critical Illness Max) are pre-filtered out by the deterministic Hard Eligibility Gate, achieving **0% Ineligible Recommendation Violations**.

### Segment 3: Operations & AI Governance Console (02:45 – 04:00)
1. **Business View (`/analytics`):** Highlight business pipeline metrics: 100% follow-up completion, 85% recommendation approval rate, and AI workflow activity.
2. **AI Health (`/model`):**
   - **Health Summary:** Point to the top status pill (`● Healthy`), P95 latency (480ms), and calibration score (Brier: 0.076, ECE: 0.045).
   - **Model Evidence:** Inspect Confusion Matrix and Demographic Fairness report (0.96 Disparate Impact).
   - **Model Monitoring (MLOps):** Show Champion vs Candidate comparison and feature PSI drift table. Demonstrate Admin-only Model Promotion modal.
   - **LLM Optimization:** Highlight 84% cache hit rate and token cost reduction.

### Segment 4: System Audit Trail (04:00 – 04:30)
1. **Audit Ledger (`/admin/audit`):** Open the security timeline.
2. **Payload Drawer:** Click *"ดูรายละเอียด"* on a recent recommendation decision event to inspect the full JSON metadata, model version, and trace ID.
3. **Closing Statement:** *"Broker Insight AI delivers a production-like, safe, explainable, and human-governed advisory platform ready for enterprise sandbox deployment."*

---

## 3. Demo Scenarios Cheat Sheet

| Scenario ID | Test Persona | Key Conditions | Demonstrated Feature |
|---|---|---|---|
| **Scenario A** | Khun Nattaporn Warin (KS-00001) | Platinum, renewal in 14 days, high score (92) | Primary Priority, SHAP Explainability & Top Recommendation |
| **Scenario B** | Khun Natcha Pearl (KS-00002) | Motor Type 1 renewal in 21 days, Silver, score (89) | Motor Expiry Urgency & Cross-sell Opportunity |
| **Scenario D** | Khun Wipa Chaiyo (KS-00004) | Home loan 5.5M, existing coverage only 500k | Protection Gap Analysis & MRTA recommendation |
| **Scenario E** | Khun Thanapoom Yimyaem (KS-00005) | AUM 14.2M, age 52, retirement planning | Smart Pension 85/60 & High-AUM Wealth Advisory |
| **Scenario G** | Khun Arnon Kawnah (KS-00007) | Simulated external network disconnection | Offline Rule-Based Fallback Engine preservation |
| **Scenario H** | Khun Nattaporn Thaweepol (KS-00008) | Senior citizen aged 68 years | Hard Eligibility Gate pre-filtering (Safety guarantee) |
