# เมทริกซ์การสังเกตการณ์ระบบ (Observability & Monitoring Matrix)

> **โครงการ:** Broker Insight AI — Krungsri Hackathon  
> **ระยะการพัฒนา:** Phase 28 — Production Readiness, Observability, and Metrics Consistency Audit  
> **วันที่จัดทำ:** 30 สิงหาคม 2026  

---

## 1. ตารางครอบคลุมการสังเกตการณ์ระบบ (Observability Coverage Matrix)

| องค์ประกอบระบบ (Component) | ตัวชี้วัดที่เก็บ (Metrics Collected) | รูปแบบ Log (Logs Format) | การส่งผ่าน Correlation ID | เกณฑ์การแจ้งเตือน (Alert Conditions) | สถานะความพร้อม (Status) |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **API Gateway & Routing** | Request Count, Error Rate (4xx/5xx), Response Duration | JSON Structured (`structlog`) | `X-Request-ID`<br>`X-Response-Time-MS` | Error Rate &gt; 1.0% ในรอบ 5 นาที | ✅ **FULL** |
| **Database (PostgreSQL / SQLite)** | Query Execution Time, Connection Pool Utilization | Engine Log & Exception Handlers | Trace Header ใน Request Context | Connection Saturation &gt; 80% หรือ Query &gt; 500 ms | ✅ **FULL** |
| **Machine Learning (LightGBM)** | Inference Latency, Score Distribution, Feature Values | Versioned Prediction Logs | `X-Request-ID` ใน Audit Table | Inference Latency &gt; 50 ms หรือ Invalid Feature Input | ✅ **FULL** |
| **Explainability (TreeSHAP)** | SHAP Calculation Duration, Top-5 Feature Contributions | Attribution Factors Payload | ผูกกับ Score Record ID | SHAP Generation Failures &gt; 0 | ✅ **FULL** |
| **LLM Customer Insights** | Prompt Tokens, Output Tokens, Estimated USD Cost, Latency | Guardrail Audit Log & Fallback Flag | `X-Request-ID` ใน Prompt Context | Fallback Rate &gt; 5.0% หรือ Token Surge &gt; 1,000 | ✅ **FULL** |
| **LLM Conversation Assistant** | Response Latency, Groundedness Check, Guardrail Status | Guardrail Verification Log | `X-Request-ID` ใน Chat Event | Guardrail Violation &gt; 0 (Prohibited Words) | ✅ **FULL** |
| **Recommendation Engine** | Top-K Match Rate, Eligibility Rejection Count, Gap Score | Recommendation Decision Log | ผูกกับ Customer ID & Request ID | Ineligible Recommendation Rate &gt; 0.0% | ✅ **FULL** |
| **Semantic Safe Cache** | Hits, Misses, Hit Rate %, Eviction Count | Cache Hit/Miss Event Log | Tracked in Monitoring Service | Hit Rate &lt; 30% หรือ Eviction Spike | ✅ **FULL** |
| **Authentication & RBAC** | Login Attempts, Failed Auth Count, Token Expirations | Security Audit Logs (No Password) | `X-Request-ID` ใน Auth Request | Failed Login Spike (&gt; 10 ครั้ง/นาที จาก IP เดียวกัน) | ✅ **FULL** |
| **Model Drift Monitoring** | Feature PSI (Population Stability Index), Drift Status | Drift Report JSON Artifact | Tracked per Retraining Cycle | PSI &gt; 0.20 (Significant Drift Detected) | ✅ **FULL** |
| **System Audit Trail** | Action Type, User ID, Role, Resource, Timestamp | Tamper-evident Relational Table | `X-Request-ID` ใน Audit Record | Unauthorized Privilege Escalation Attempt | ✅ **FULL** |

---

## 2. การตอบคำถามเชิงปฏิบัติการสำคัญ 4 ประการ (Key Operational Questions Answered)

### 1. เกิดอะไรขึ้นในระบบ? (What happened?)
- **กลไกการติดตาม:** ทุกการกระทำถูกบันทึกลงในตาราง `audit_logs` และ Application Logs พร้อม `X-Request-ID` ระบุ User ID, Role, Endpoint และ Payload ที่ถูก Mask PII แล้ว

### 2. แต่ละขั้นตอนใช้เวลาเท่าใด? (How long did it take?)
- **กลไกการติดตาม:** Header `X-Response-Time-MS` แนบไปกับทุก Response และ `e2e_benchmark.py` บันทึกค่า P50, P95, P99 แยกตามแต่ละ Component ชัดเจน

### 3. เหตุใด AI จึงให้ผลลัพธ์เช่นนี้? (Why did AI produce this result?)
- **กลไกการติดตาม:** 
  - ผลคะแนน ML มาจาก Model Version + Feature Extraction Version + Top-5 SHAP Contribution Factors
  - ผลแนะนำสินค้ามาจาก 4-Pillar Explanation (`need_signal`, `profile_fit`, `eligibility_result`, `existing_coverage_assessment`)

### 4. มีจุดใดล้มเหลวหรือไม่? (Did something fail?)
- **กลไกการติดตาม:** ตรวจสอบผ่าน `/health/ready`, Fallback Activation Status ใน LLM Services, และ Guardrail Rejection Logs
