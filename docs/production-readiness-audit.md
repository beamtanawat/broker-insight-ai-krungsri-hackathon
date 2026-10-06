# รายงานการตรวจสอบความพร้อมสำหรับการใช้งานจริง (Production Readiness Audit)

> **โครงการ:** Broker Insight AI — Krungsri Hackathon  
> **ระยะการพัฒนา:** Phase 28 — Production Readiness, Observability, and Metrics Consistency Audit  
> **การจัดประเภทระบบ:** **Production-like Enterprise Prototype (ต้นแบบพร้อมสำหรับการทดสอบนำร่องระดับองค์กร)**  
> **วันที่จัดทำ:** 30 สิงหาคม 2026  

---

## 1. ตารางคะแนนความพร้อมแยกตาม 14 มิติ (Production Readiness Scorecard)

| มิติการประเมิน (Domain) | สถานะความพร้อม (Status) | หลักฐานเชิงประจักษ์ (Evidence) | ช่องว่างที่ต้องพัฒนาต่อสำหรับ Full Production (Remaining Gap) |
| :--- | :---: | :--- | :--- |
| **1. Architecture** | **READY** | โครงสร้างแยกส่วนชัดเจน (Next.js ↔ FastAPI ↔ PostgreSQL), ไม่มี Circular Dependency | ออกแบบรองรับการแยก Stateless API scale-out |
| **2. Backend API** | **READY** | FastAPI + Starlette, มี Global Exception Handler ไม่ทำ Stack Trace รั่วไหล, รองรับ CORS Config | เพิ่ม Circuit Breaker กรณี External LLM Down ติดต่อกัน |
| **3. Database** | **READY WITH LIMITATIONS** | Async SQLAlchemy, Connection Pooling, Foreign Keys, Indexes และ `selectinload` ตัด N+1 | ยังไม่มี Automated Database Migration (Alembic) และ Auto-failover Cluster |
| **4. Frontend** | **READY** | Next.js 16 (Turbopack), Typescript Strict, Clean Production Build, Error Boundaries | เพิ่ม Offline Local State Persistence สำหรับ Mobile View |
| **5. Machine Learning** | **READY** | LightGBM v1.0.0 Calibrated, SHAP Explainability, Model Registry พร้อม Promote / Rollback | Automated Continuous Training Pipeline (CI/CD Retraining Trigger) |
| **6. LLM Pipeline** | **READY** | Prompt v2.0-optimized, Safe In-memory Caching, Fallback Deterministic กฎเกณฑ์, Guardrails | ปรับจาก In-memory Cache เป็น Distributed Cache (Redis) เมื่อ Deploy แบบ Multi-pod |
| **7. Recommendation** | **READY** | Pre-ranking Hard Eligibility Gate, 4-Part Structured Explanation, Ineligible Rate 0% | Dynamic Product Catalog Sync จาก Core Banking / Insurance APIs |
| **8. Security & RBAC** | **READY** | JWT Token Hashing (bcrypt), Role Matrix (Broker, Manager, Admin) ตรวจสอบฝั่ง Backend | Single Sign-On (SSO / SAML 2.0 / OAuth2 กับ Krungsri Active Directory) |
| **9. Observability** | **READY** | Request Tracing (`X-Request-ID`), Response Duration (`X-Response-Time-MS`), Health Probes (`/health/live`, `/health/ready`) | เชื่อมต่อไปยัง Central APM (OpenTelemetry / Prometheus / Datadog) |
| **10. Testing** | **READY** | 150 Automated Tests (100% Pass), Unit, Integration, Load, Security และ Optimization Tests | End-to-End Cypress / Playwright UI Browser Automation Tests |
| **11. Deployment** | **READY WITH LIMITATIONS** | Dockerfile และ Docker Compose รองรับ Containerization พร้อมใช้งาน | Kubernetes Helm Charts และ Multi-Region Disaster Recovery Setup |
| **12. Data Governance** | **READY** | ข้อมูลสังเคราะห์ (Synthetic Dataset $N=1,200$), PII Masking กรองเลขบัตร ปชช./บัญชี ก่อนเข้า LLM | Data Retention & Automatic Purging Policy ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) |
| **13. Disaster Recovery** | **NEEDS WORK** | ฐานข้อมูลสามารถ Dump/Restore ได้ด้วยคำสั่งมาตรฐาน | ยังไม่มี Automated Point-in-Time Recovery (PITR) และ Off-site Cross-region Backups |
| **14. CI/CD Pipeline** | **READY WITH LIMITATIONS** | โครงสร้าง Repo มีชุดทดสอบพร้อมรันใน Github Actions / Gitlab CI | Automated Deployment Script สู่ Staging/Production Cloud Environment |

---

## 2. การจำแนกประเภทข้อตรวจพบ (Issue Classification: P0 / P1 / P2)

### 🔴 P0 — ปัญหาขั้นวิกฤต (Blocking - ต้องแก้ไขก่อน Go-Live ระดับองค์กร)
*ไม่มีข้อตรวจพบระดับ P0 ใน Prototype ปัจจุบัน* (ระบบมีความเสถียร, ปลอดภัยจาก Stack Trace Leak, มี RBAC เข้มงวด, และผ่านการทดสอบ 100%)

---

### 🟡 P1 — ปัญหาสำคัญ (Important - ควรได้รับการพัฒนาสำหรับการขยายผลระดับ Enterprise)

#### 1. In-Memory State Limitations (Rate Limiting & LLM Cache)
- **ข้อตรวจพบ:** Rate Limiting และ `LLMSafeCache` ทำงานในหน่วยความจำระดับ Single Python Process
- **หลักฐาน:** `backend/app/core/rate_limit.py` และ `backend/app/ml/llm_optimizer.py` ใช้ In-memory Dictionaries
- **ผลกระทบ:** หาก Deploy แบบ Horizontal Pod Autoscaling (Multi-instance) Cache และ Rate Limit จะไม่แชร์ข้าม Node
- **แนวทางแก้ไข:** กำหนดคอนฟิกสลับไปใช้ Redis เป็น Shared State เมื่อเข้าสู่สภาพแวดล้อม Multi-Pod Production

#### 2. Absence of Automated Migration Framework (Alembic)
- **ข้อตรวจพบ:** โครงสร้างตารางปัจจุบันสร้างผ่าน `Base.metadata.create_all` และ `seed.py`
- **หลักฐาน:** `backend/app/core/seed.py`
- **ผลกระทบ:** การอัปเดต Schema ใน Production ฐานข้อมูลเดิมอาจเกิดความยุ่งยากในการ Alter Table
- **แนวทางแก้ไข:** นำ Alembic Migration Scripts มาใช้สำหรับจัดการ Schema Changes ในรอบพัฒนาถัดไป

#### 3. Single Region & Backup Automation
- **ข้อตรวจพบ:** ระบบยังไม่มี Scheduled Backup Daemon อัตโนมัติในตัว
- **หลักฐาน:** ข้อมูลจัดเก็บในเครื่องแม่ข่ายหลัก
- **ผลกระทบ:** ความเสี่ยงข้อมูลสูญหายกรณี Hardware Failure
- **แนวทางแก้ไข:** ติดตั้ง Cronjob ทำ Daily PostgreSQL Dumps และส่งต่อไปยัง S3 / GCS Encrypted Storage

---

### 🟢 P2 — ข้อเสนอแนะเพื่อเพิ่มประสิทธิภาพ (Enhancements)

#### 1. Centralized APM / OpenTelemetry Exporter
- **ข้อตรวจพบ:** Request Tracing ส่ง Headers ออกทาง HTTP และ Structlog เท่านั้น
- **แนวทางแก้ไข:** ติดตั้ง OpenTelemetry SDK เพื่อส่ง Spans ตรงไปยัง Jaeger / Grafana Tempo

#### 2. Enterprise Single Sign-On (SSO / OIDC)
- **ข้อตรวจพบ:** ระบบปัจจุบันใช้ Local JWT Authentication (Email / Password)
- **แนวทางแก้ไข:** ผูกระบบ Login กับ Krungsri Azure AD / Keycloak OIDC Provider
