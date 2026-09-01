# Broker Dashboard and Customer List Redesign

> Version: Phase 33.3 · Broker Insight AI (Krungsri Financial Advisory)  
> Redesigned Pages: `/dashboard` and `/customers`

---

## 1. Primary UX Goals

* **Broker Dashboard (`/dashboard`):** Answers immediately *"What should I do today?"* by highlighting the highest-priority customers, overdue/pending tasks, actionable alerts, and quick actions.
* **Customer List (`/customers`):** Answers *"Which customer should I open next?"* through a decision-oriented directory equipped with search, priority and KYC filters, flexible sorting, and responsive table-to-card transformations.

---

## 2. Dashboard Structure (Before vs After)

| Tier | Before (Phase 33.0) | After (Phase 33.3 Redesign) |
|---|---|---|
| **Header** | Generic title & refresh button | Standardized `PageHeader` with Thai context & quick navigation |
| **KPIs** | Passive metrics | **Actionable & Clickable KPIs** (`/customers?priority=high`, `/customers?kyc=pending`) |
| **Queue** | Generic table with raw technical scores | **Priority Customer Queue** using `PriorityScore` (Score/100, Confidence tooltip), human-readable reasons, and suggested next action |
| **Tasks** | Static numbers | **Live Today's Tasks** fetching active follow-ups from `/api/v1/followup` with "เปิดงาน" buttons |
| **Alerts** | None | **Contextual Live Alerts** for overdue follow-ups and pending KYC |
| **Quick Actions** | Jargon and pilot shortcuts | Clean broker tools (Directory `/customers`, AI Copilot `/chat`) |

---

## 3. Customer List Structure (`/customers`)

1. **PageHeader:** Breadcrumbs (`Dashboard → Customers`), title, description, refresh.
2. **Search & Filter Bar:**
   - Real-time search across Name, External Ref, and Need Reason.
   - Priority Pills: All, High, Medium, Low (with dynamic counts).
   - KYC Dropdown: All, Verified, Pending, Rejected.
   - Sorting: AI Priority Score (desc/asc), Customer Name (A-Z/Z-A), Active Policies (desc).
   - "ล้างตัวกรองทั้งหมด" reset button.
3. **Dual Responsive View:**
   - **Desktop (≥ 768px):** High-density `Table` with sort indicators on headers, status badges, and `PriorityScore`.
   - **Mobile / Tablet (< 768px):** Card-based transformation with prominent priority badges, key reasons, policy counts, and full-width "เปิดข้อมูล" action.

---

## 4. Priority Queue Design & AI Trust Language

* **Score Display:** Utilizes the design system `PriorityScore` component. Never implies certainty; always indicates calibrated tier and confidence rating.
* **Human-Readable Reasons:** Extracts concise factors (e.g. "ทบทวนกรมธรรม์ใกล้ถึงกำหนด", "ไม่มีการติดต่อในช่วงที่ผ่านมา") rather than exposing raw SHAP mathematical values.
* **Suggested Next Actions:** Derived from customer state:
  * Overdue follow-up → "ติดต่อติดตามผล"
  * Pending KYC → "ตรวจสอบข้อมูล KYC"
  * High priority → "ทบทวนความคุ้มครอง"
  * 0 active policies → "นำเสนอแผนประกัน"
* **Broker Primacy:** The broker remains the ultimate decision maker. Language uses neutral advisory terms ("ลูกค้าที่ควรให้ความสนใจ", "ระบบจัดลำดับให้ความสำคัญสูง").

---

## 5. Navigation & Cross-Linking Workflow

```
Dashboard
 ├── High Priority KPI Card ───► /customers?priority=high ───► /customers/{id}
 ├── Pending KYC KPI Card ─────► /customers?kyc=pending ─────► /customers/{id}
 ├── Priority Queue Row ───────► /customers/{id} (Direct 360)
 ├── Today's Task Row ─────────► /customers/{id} (Follow-up context)
 └── Quick Action / Directory ─► /customers
```

---

## 6. Verification & Accessibility

* **WCAG 1.4.1 Compliance:** All priority levels, KYC statuses, and alerts combine explicit icons + text labels.
* **Keyboard Accessibility:** All actions and table rows support keyboard `:focus-visible` states.
* **Responsive Breakpoints:** Fully tested for desktop (≥ 1024px), tablet (768px - 1023px), and mobile (< 768px).
* **Automated Tests:** 100% build pass on Next.js 16 (12 routes) and 182/182 pytest backend regression tests pass.
