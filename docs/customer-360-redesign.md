# Customer 360 Workspace Redesign

> Version: Phase 33.4 · Broker Insight AI (Krungsri Financial Advisory)  
> Redesigned Target: `/customers/{id}` (Customer 360 Workspace)

---

## 1. UX Objective & Core Principle

Transform Customer 360 into **one intelligent broker decision workspace** rather than a fragmented collection of separate AI cards.

The page addresses 7 essential broker questions in logical sequence:
1. **Who is this customer?** → Customer Header & Overview
2. **What is their current situation?** → Financial & Insurance Snapshot
3. **Why should I pay attention to them?** → Priority Hero & Top Drivers
4. **What potential needs should I review?** → 5-Category Need Analysis
5. **What recommendations should I consider?** → Primary Recommendation & 4-Part Structured Explanation
6. **How should I prepare the conversation?** → Conversation Copilot (Prep)
7. **What should I do next?** → Tasks & Follow-up creation

---

## 2. Page Structure (Before vs After)

| Level | Before (Old Architecture) | After (Phase 33.4 Decision Workspace) |
|---|---|---|
| **Header** | Disconnected basic title with scattered metadata | **Persistent [`CustomerHeader`](file:///Users/chalermsak/Downloads/broker-insight-ai-krungsri-hackathon-main/frontend/src/components/domain/CustomerHeader.tsx)** (Avatar initial, ID, Tier, KYC status, contact dates, primary action) |
| **Alerts** | Hard-coded or scattered warnings | **[`CustomerAlerts`](file:///Users/chalermsak/Downloads/broker-insight-ai-krungsri-hackathon-main/frontend/src/components/customer/CustomerAlerts.tsx)**: Real-data alert strip (overdue follow-ups, pending KYC) |
| **Decision Brief** | None | **[`DecisionSummary`](file:///Users/chalermsak/Downloads/broker-insight-ai-krungsri-hackathon-main/frontend/src/components/customer/DecisionSummary.tsx)**: 10-second summary bar of Priority, Driver, Need, Top Rec, and Action |
| **Tabs** | 8 technical tabs (Scoring, SHAP, LLM, Needs, Products, Decisions, Followup, Audit) | **Exact 5 Workflow Tabs**: `Overview`, `Priority`, `Recommend`, `Prep`, `Tasks` |

---

## 3. Tab Responsibilities

### Tab 1 — Overview (`CustomerOverview.tsx`)
* **Customer Snapshot:** Relationship tier, KYC status, Age, Occupation, Risk tolerance.
* **Financial Snapshot:** Total assets, liabilities/loans, monthly savings.
* **Insurance Snapshot:** Active policies held, policy numbers, sums assured, annual premium, renewal dates.
* **Trust Provenance:** Clearly marked as `Verified Customer Data` (`AILabel type="verified"`).

### Tab 2 — Priority (`CustomerPriority.tsx`)
* **Priority Hero:** `PriorityScore` with calibrated probability, confidence indicator, and level badge.
* **Top 3 Drivers:** Human-readable explanations of why the customer received this priority.
* **Progressive Disclosure:** Advanced SHAP feature importance table and model metadata in a slide-out `Drawer`.
* **AI Customer Insight:** LLM summary, key observations, potential needs, and cautions (`AILabel type="ai"`).
* **5-Category Needs Analysis:** Health, Life, Savings, Accident, and Property protection gaps with severity badges.

### Tab 3 — Recommend (`CustomerRecommendations.tsx`)
* **Primary Recommendation:** Top-1 product match with clear eligibility status badge (`✓ ผ่านเกณฑ์`, `⚠ รอตรวจสอบ`, `✕ ไม่ผ่านเกณฑ์`).
* **4-Part Structured Explanation:**
  1. สัญญาณความต้องการ (Need Signal)
  2. ความเหมาะสมกับโปรไฟล์ (Profile Fit)
  3. การตรวจสอบคุณสมบัติ (Eligibility)
  4. ความคุ้มครองเดิม (Coverage Assessment)
* **Alternatives & Comparison:** Top-3 eligible alternatives with deep comparison `Drawer`.
* **Broker Decision Section:** Distinct human action block ([เห็นชอบ (Approve)], [ปรับเปลี่ยน (Modify)], [ปฏิเสธ (Reject)]) with structured feedback modal.

### Tab 4 — Prep (`CustomerPrep.tsx`)
* **Conversation Copilot:** Structured guide with Conversation Objective, Suggested Opening (with copy button), Questions to Ask (with quick copy buttons), Topics to Explore, and Cautions.
* **AI Trust:** Clearly marked with `AILabel type="ai"` ("AI-Assisted").

### Tab 5 — Tasks (`CustomerTasks.tsx`)
* **Follow-up Management:** Active and completed customer follow-ups.
* **Task Creation:** Integrated modal form to schedule date, priority, and task notes via `api.customers.createFollowup()`.

---

## 4. AI Trust & Provenance Architecture

* **Verified Customer Data (`--verified-*`):** Confirmed profile, financial, and policy holdings.
* **System Rules (`--rule-*`):** Deterministic product eligibility gating.
* **AI Insights & Recommendations (`--ai-*`):** Calibrated ML priority scores, LLM summaries, and product match rankings.
* **Broker Decisions (`--broker-*`):** Human broker approval, modification, and rejection records.

---

## 5. Verification Results

* **Frontend Production Build:** `cd frontend && npm run build` passes with 0 errors across 12 routes.
* **Backend Regression Tests:** `.venv/bin/pytest -v` passes 182/182 tests with 0 regressions.
