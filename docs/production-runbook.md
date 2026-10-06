# คู่มือการปฏิบัติการและการแก้ไขปัญหาในสภาวะจริง (Production Runbook)

> **โครงการ:** Broker Insight AI — Krungsri Hackathon  
> **ระยะการพัฒนา:** Phase 28 — Production Readiness, Observability, and Metrics Consistency Audit  
> **กลุ่มเป้าหมาย:** DevOps Engineers, MLOps Engineers, และ System Administrators  
> **วันที่จัดทำ:** 30 สิงหาคม 2026  

---

## 1. คำสั่งการเริ่มต้นและการตรวจสอบสถานะระบบ (Startup & Health Checks)

### A. การเริ่มระบบด้วย Docker Compose
```bash
# เริ่มต้นบริการ Backend, PostgreSQL, และ Next.js Frontend
docker-compose up -d --build

# ตรวจสอบสถานะ Containers
docker-compose ps
```

### B. การเริ่มระบบแบบ Local Development
```bash
# 1. Backend (FastAPI)
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 2. Frontend (Next.js)
cd frontend
npm run dev
```

### C. การตรวจสอบสุขภาพของระบบ (Health & Readiness Probes)
```bash
# 1. ตรวจสอบสถานะ Liveness (Process ทำงานอยู่หรือไม่)
curl -i http://localhost:8000/health/live
# Expected: HTTP 200 {"status": "alive", ...}

# 2. ตรวจสอบสถานะ Readiness (Database เชื่อมต่อได้ และ ML Model พร้อมทำงานหรือไม่)
curl -i http://localhost:8000/health/ready
# Expected: HTTP 200 {"status": "ready", "database": "connected", "ml_model": {"ready": true}}
```

---

## 2. ขั้นตอนการกู้คืนและการย้อนกลับโมเดล ML (Model Rollback Procedure)

กรณีที่โมเดล Champion ปัจจุบันเกิดความคลาดเคลื่อนหรือได้รับ Feedback เชิงลบจากนายหน้า:

### A. ตรวจสอบเวอร์ชันโมเดลใน Registry
```bash
# เรียกดูประวัติโมเดลผ่าน API
curl -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:8000/api/v1/model/registry
```

### B. สั่ง Rollback ไปยังเวอร์ชันก่อนหน้าผ่าน REST API
```bash
curl -X POST http://localhost:8000/api/v1/model/rollback \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"target_version": "1.0.0"}'
```

### C. หรือดำเนินการผ่าน UI ในหน้า AI Evidence Dashboard
1. เข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ (`admin@demo.local`)
2. ไปที่เมนู `/model` และเลือกแท็บ **"📦 แค็ตตาล็อกโมเดล (MLOps Model Registry)"**
3. คลิกปุ่ม **"Rollback"** ในการ์ดโมเดลที่ผ่านการตรวจสอบก่อนหน้า

---

## 3. การล้างแคช LLM ในสภาวะฉุกเฉิน (LLM Safe Cache Purging)

หากต้องการบังคับให้ระบบสร้าง Insight ใหม่ทั้งหมดทันที:

```python
# รันคำสั่ง Python ผ่าน Backend Terminal
python3 -c "from app.ml.llm_optimizer import llm_cache; llm_cache.clear(); print('LLM Cache Cleared Successfully')"
```

---

## 4. การจัดการปัญหาที่พบบ่อย (Common Incident Triage)

| อาการที่พบ (Symptom) | สาเหตุที่เป็นไปได้ (Possible Cause) | ขั้นตอนการแก้ไข (Remediation Steps) |
| :--- | :--- | :--- |
| **HTTP 503 ใน `/health/ready`** | ฐานข้อมูล PostgreSQL ดับหรือ Connection Pool เต็ม | 1. ตรวจสอบสถานะ DB container: `docker logs broker-db`<br>2. ตรวจสอบพารามิเตอร์ `DATABASE_URL` ใน `.env`<br>3. สั่ง Restart DB: `docker-compose restart db` |
| **LLM Insights แสดงผลแบบ Fallback** | `GOOGLE_API_KEY` หมดอายุหรือ Quota เต็ม | 1. ตรวจสอบ Error Log ใน backend: `docker logs broker-api`<br>2. อัปเดต API Key ใน `.env`<br>3. ระบบจะทำงานต่อได้โดยอัตโนมัติด้วย Rule-based Fallback โดยไม่เกิดข้อผิดพลาดกับผู้ใช้ |
| **Request ช้าผิดปกติ (&gt; 500 ms)** | Cache Miss ติดต่อกัน หรือ Traffic Surge | 1. ตรวจสอบ Header `X-Response-Time-MS` เพื่อแยกดูว่าช้าที่จุดใด<br>2. ตรวจสอบสถานะ Concurrency ใน `/model/e2e-performance` |
