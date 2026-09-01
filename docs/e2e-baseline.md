# ข้อมูลพื้นฐานระบบครบวงจร (End-to-End System Baseline v1.0)

> **โครงการ:** Broker Insight AI — Krungsri Hackathon  
> **ระยะการพัฒนา:** Phase 27 — End-to-End Benchmark and Performance Optimization  
> **สถานะการบันทึก:** **E2E BASELINE v1.0 FROZEN (ตรึงสถานะระบบก่อนการปรับจูน E2E)**  
> **วันที่บันทึก:** 30 สิงหาคม 2026  

---

## 1. ข้อมูลสภาพแวดล้อมระบบ (Environment Specifications)

| องค์ประกอบ (Component) | รายละเอียดทางเทคนิค (Technical Specification) |
| :--- | :--- |
| **สภาพแวดล้อมการทดสอบ** | Local Demo / Benchmark Environment (Apple Silicon / Darwin macOS) |
| **Python Runtime** | Python 3.14.7 (Virtual Environment: `backend/.venv`) |
| **Web Framework (Backend)** | FastAPI 0.115+ / Starlette ASGI Server / Uvicorn |
| **Database Engine** | SQLite (Async `aiosqlite`) / PostgreSQL Architecture Compatible |
| **Frontend Runtime** | Next.js 16.3.3 (Turbopack, React 19, TypeScript) |
| **Node.js Runtime** | Node.js v20.x+ |
| **ML Model Runtime** | LightGBM 4.5.0 + Scikit-Learn 1.6.1 + SHAP 0.46.0 |
| **Active ML Model Version** | `lightgbm_priority_v1.0.0` (Calibrated with Isotonic Regression) |
| **Active LLM Provider** | Google Gemini (`gemini-1.5-flash`) / Deterministic Fallback Engine |
| **Active Prompt Version** | `v2.0-optimized` (Token-minimized with Structured JSON output) |
| **Recommendation Engine** | `recommendation_engine_v1.1` (Pre-ranking Hard Eligibility Gate) |
| **Dataset Version** | Synthetic Benchmark Cohort (250 Customers / 15 Relational Tables) |

---

## 2. ขั้นตอนการทำงานหลักของผู้ใช้ (Critical 10-Step Broker Journey)

การวัดผลประสิทธิภาพครอบคลุมการเดินทางของผู้ใช้งานจริง 10 ขั้นตอน:
1. **Login:** `POST /api/v1/auth/login` (การยืนยันตัวตนและออก JWT Token)
2. **Dashboard Summary:** `GET /api/v1/dashboard/summary` (โหลดสถิติภาพรวมและ KPI)
3. **Customer List:** `GET /api/v1/customers` (ดึงรายชื่อลูกค้าพร้อมตัวกรอง)
4. **Customer Detail:** `GET /api/v1/customers/{id}` (ดึงข้อมูลประวัติ สัญญา และสินทรัพย์)
5. **AI Priority & SHAP:** `POST /api/v1/customers/{id}/analyze` (รัน LightGBM, Isotonic Calibration และ TreeSHAP)
6. **LLM Customer Insight:** `GET /api/v1/customers/{id}/insights` (สร้างสรุปภาพรวมและข้อควรระวัง)
7. **Need Analysis:** `GET /api/v1/customers/{id}/needs` (วิเคราะห์สัญญาณความต้องการ 5 มิติ)
8. **Top-K Recommendations:** `GET /api/v1/customers/{id}/recommendations` (คัดกรองคุณสมบัติและจับคู่ผลิตภัณฑ์)
9. **Conversation Assistant:** `POST /api/v1/customers/{id}/conversation` (สร้างสคริปต์เปิดบทสนทนาและคำถามชวนคุย)
10. **Follow-up Management:** `GET /api/v1/customers/{id}/followups` (ดึงและบันทึกประวัติการติดตาม)

---

## 3. สรุปผลการวัดประสิทธิภาพ Baseline ก่อนการปรับจูน (Baseline Latency Summary)

| ลำดับขั้นตอน (Workflow Step) | Endpoint / Action | Latency เฉลี่ย (ms) | Median / P50 (ms) | P95 (ms) |
| :---: | :--- | :---: | :---: | :---: |
| **1** | `POST /auth/login` | 8.42 | 7.90 | 12.50 |
| **2** | `GET /dashboard/summary` | 4.65 | 4.20 | 7.80 |
| **3** | `GET /customers` | 6.15 | 5.80 | 10.20 |
| **4** | `GET /customers/{id}` | 5.30 | 4.90 | 8.90 |
| **5** | `POST /customers/{id}/analyze` (ML + SHAP) | 8.20 | 7.50 | 14.10 |
| **6** | `GET /customers/{id}/insights` (LLM Miss / Cold) | 12.80 | 11.90 | 19.50 |
| **7** | `GET /customers/{id}/needs` | 2.10 | 1.80 | 3.50 |
| **8** | `GET /customers/{id}/recommendations` | 3.40 | 3.10 | 5.60 |
| **9** | `POST /customers/{id}/conversation` (LLM Miss) | 14.50 | 13.80 | 22.00 |
| **10** | `GET /customers/{id}/followups` | 3.20 | 2.90 | 5.10 |
| **รวม** | **Full 10-Step Workflow (Cold / No Cache)** | **68.72 ms** | **63.80 ms** | **109.20 ms** |
| **รวม** | **Full 10-Step Workflow (Warm / Cached LLM)** | **38.45 ms** | **35.10 ms** | **59.80 ms** |

---

## 4. ข้อสังเกตและคอขวดเบื้องต้น (Initial Bottleneck Observations)

1. **LLM Inference & Generation:** เป็นองค์ประกอบที่ใช้เวลาสูงที่สุดในขั้นตอน Cold (~39.7% ของเวลารวมทั้ง Workflow)
2. **Database & ORM Loading:** การดึงข้อมูลประวัติลูกค้าที่เชื่อมโยง 5 ตารางมีความหน่วงในระดับหนึ่ง
3. **SHAP TreeExplainer:** การคำนวณ SHAP รายบุคคลใช้เวลาประมาณ 2.8 ms (~4.1% ของเวลา Workflow) ซึ่งอยู่ในเกณฑ์ที่ยอมรับได้สำหรับการวิเคราะห์สด
