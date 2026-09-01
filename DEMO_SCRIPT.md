# Broker Insight AI — 60-90 Second Pitch & Live Demonstration Script

> **Goal**: Clearly demonstrate the business problem, AI-driven solution, explainability, broker governance, and enterprise auditability in under 90 seconds.

---

## 🎬 Act 1: The Problem (00:00 - 00:15)
- **Speaker**: 
  > *"Insurance brokers managing hundreds of commercial banking customers face a critical problem: customer data is fragmented across CRM, core banking, and policy administration systems. Brokers waste hours searching for who to contact, while urgent coverage gaps—such as high mortgage debt without protection—go unnoticed."*
- **Action on Screen**: 
  - Show Login screen (`/login`) with demo roles: **Broker**, **Manager**, **Admin**.
  - Log in with `broker@demo.local` (`demo1234`).

---

## ⚡ Act 2: Priority AI & Explainability (00:15 - 00:35)
- **Speaker**: 
  > *"Broker Insight AI solves this by aggregating real customer signals into a real LightGBM prioritization model with TreeSHAP explainability. Here on the Dashboard, customers are automatically ranked by contact urgency."*
- **Action on Screen**:
  - Point to **High-Priority** customer (e.g. `กนกวรรณ รุ่งเรือง` - Score 92/100).
  - Click on the customer to open the **Customer 360° Profile** (`/customers/[id]`).
  - Click **"⚡ Run AI Analysis"**.
  - Show the **SHAP Factor Breakdown** (Positive impacts: High mortgage debt, significant monthly savings; Negative impacts: Existing life policy).

---

## 💡 Act 3: AI Insights, Need Analysis & Product Matching (00:35 - 00:55)
- **Speaker**: 
  > *"Rather than black-box sales prompts, our structured Need Engine evaluates 5 canonical protection categories. The system identifies an urgent need for Loan Protection (MRTA) and matches it to 'Krungsri Mortgage Protection' with an 88% eligibility score and clear reasons."*
- **Action on Screen**:
  - Switch to **AI Insights** tab (Show structured summary, observations, and cautions).
  - Switch to **Needs & Products** tab (Show 5-category radar/bars and matched products).

---

## 🛡️ Act 4: Human-in-the-Loop Decision & AI Conversation Assistant (00:55 - 01:15)
- **Speaker**: 
  > *"Critically, the broker remains in complete control. The broker reviews the match, selects 'Approve' with structured reason 'Suitable Coverage', and generates a non-coercive conversation guide with objective, compliant opening, and suggested questions."*
- **Action on Screen**:
  - Select **"Approve"** and reason **"Suitable Coverage"** $\rightarrow$ Click **"บันทึกการตัดสินใจ (Submit)"**.
  - Switch to **Conversation Assistant** tab $\rightarrow$ Click **"สร้างบทสนทนาแนะนำ"** (Show dialogue objective, opening, and discovery questions).

---

## 📊 Act 5: Follow-Up, Enterprise Audit Trail & Analytics (01:15 - 01:30)
- **Speaker**: 
  > *"Every action is recorded in an immutable PostgreSQL audit trail for compliance. Managers and brokers can track team performance and model accuracy in the live Analytics Hub."*
- **Action on Screen**:
  - Create a quick Follow-up task in Tab 6.
  - Switch to **Audit Log** tab $\rightarrow$ Show recorded events (`AI_ANALYSIS_REQUESTED`, `RECOMMENDATION_DECISION`, `FOLLOW_UP_CREATED`).
  - Navigate to **Analytics Hub** (`/analytics`) $\rightarrow$ Show DB-derived priority distribution, 5-need breakdown, and recommendation conversion rates.
- **Closing**:
  > *"Broker Insight AI empowers brokers with intelligent, transparent, and compliant customer intelligence."*
