# คู่มือการปฏิบัติการสำหรับสภาพแวดล้อมทดสอบนำร่อง (Pilot Operations Runbook)

> **ระบบ:** Broker Insight AI — Krungsri Hackathon  
> **วัตถุประสงค์:** คู่มือขั้นตอนการติดตั้ง เปิดใช้งาน ทดสอบ และรับมือเหตุขัดข้องใน Pilot Sandbox  
> **สถานะ:** Pilot Ready  

---

## 1. ข้อมูลบัญชีผู้ใช้งานสำหรับ Pilot Sandbox

| บทบาท (Role) | อีเมล (Login Email) | รหัสผ่าน (Password) | สิทธิ์การเข้าถึง (Permissions) |
| :--- | :--- | :--- | :--- |
| **Broker** | `broker@demo.local` | `demo1234` | ดึงรายชื่อลูกค้า, รัน AI Prioritization, ขอ Insight, จับคู่ผลิตภัณฑ์, บันทึกการตัดสินใจ, นัดหมายติดตาม |
| **Manager** | `manager@demo.local` | `demo1234` | สิทธิ์ Broker + ดูรายงานภาพรวมสาขา Analytics และการกระจายงาน |
| **Admin** | `admin@demo.local` | `demo1234` | สิทธิ์เต็มระบบ + บริหารผู้ใช้, ตรวจสอบ Audit Log, เลื่อนขั้น/ถอยกลับโมเดล ML |

---

## 2. ขั้นตอนการเริ่มต้นระบบ (Setup & Startup Workflow)

### ขั้นตอนที่ 1: เตรียมสภาพแวดล้อมและ Environment Variables
```bash
# คัดลอกคอนฟิกสำหรับ Pilot Sandbox
cp .env.example .env

# ตรวจสอบการตั้งค่าสำคัญ
# PILOT_MODE=true
# APP_ENV=staging
```

### ขั้นตอนที่ 2: ดำเนินการ Database Migration ด้วย Alembic
```bash
cd backend
# อัปเกรด Schema สู่เวอร์ชันล่าสุด
alembic upgrade head

# เติมข้อมูลลูกค้าจำลอง 50 ราย
DATABASE_URL="sqlite+aiosqlite:///./broker_insight_pilot.db" .venv/bin/python3 scripts/backup_restore.py reset --count 50
```

### ขั้นตอนที่ 3: เปิดเซิร์ฟเวอร์ Backend และ Frontend
```bash
# Terminal 1: FastAPI Backend
cd backend
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Next.js Frontend
cd frontend
npm run dev
```

### ขั้นตอนที่ 4: ตรวจสอบความพร้อมของระบบ (Health Probes)
```bash
# ตรวจสอบ Liveness
curl -s http://localhost:8000/health/live | jq .

# ตรวจสอบ Readiness (Live DB Ping + ML Model Status)
curl -s http://localhost:8000/health/ready | jq .
```

---

## 3. สถานการณ์ทดสอบนำร่อง (Pilot Demo Scenarios A - H)

| สถานการณ์ (Scenario) | รหัสลูกค้า | โปรไฟล์และเงื่อนไขทางธุรกิจ | ผลลัพธ์ที่คาดหวังจาก AI |
| :--- | :---: | :--- | :--- |
| **A. ลูกค้าความสำคัญสูง** | `KS-00001` | กรมธรรม์ใกล้ครบกำหนดใน 14 วัน, Platinum tier | AI Score &ge; 90, SHAP ชี้ `days_to_renewal` เป็นปัจจัยหลัก |
| **B. ลูกค้าความสำคัญปานกลาง**| `KS-00002` | กรมธรรม์ครบกำหนดใน 65 วัน, Gold tier | AI Score 50-70, แนะนำทบทวนแผนประจำปี |
| **C. ลูกค้าความสำคัญต่ำ** | `KS-00003` | เพิ่งติดต่อเมื่อ 7 วันก่อน, กรมธรรม์ยังเหลือ 280 วัน | AI Score &lt; 40, ไม่จำเป็นต้องเร่งติดต่อ |
| **D. ช่องว่างความคุ้มครอง (Gap)** | `KS-00004` | สินเชื่อบ้าน 5.5 ล้านบาท แต่ประกันคุ้มครอง 5 แสน | Need Analysis ระบุ Protection Gap, แนะนำ MRTA |
| **E. ทบทวนความคุ้มครองเดิม** | `KS-00005` | มี 3 กรมธรรม์ active, วัยใกล้เกษียณ (อายุ 52) | แนะนำประกันบำนาญ (Smart Pension) และสุขภาพเสริม |
| **F. ข้อมูลลูกค้ายังไม่สมบูรณ์** | `KS-00006` | สถานะ KYC: Pending, ยังไม่มีประกันเดิม | แจ้งเตือนสถานะ KYC และแนะนำผลิตภัณฑ์พื้นฐาน |
| **G. การสลับโหมดสำรอง (Fallback)**| `KS-00007` | ทดสอบเมื่อปิดการเชื่อมต่อ LLM หรือ API ขัดข้อง | ระบบส่งกลับ Deterministic Rule-based Insight ไร้ Error |
| **H. การคัดกรองคุณสมบัติ (Gate)** | `KS-00008` | ลูกค้าสูงอายุ 68 ปี | คัดกรองผลิตภัณฑ์ที่จำกัดอายุเกินเกณฑ์ออก 100% |

---

## 4. ขั้นตอนการสำรองและกู้คืนฐานข้อมูล (Backup & Restore Procedure)

```bash
# 1. สำรองข้อมูล (Backup to JSON Snapshot)
cd backend
DATABASE_URL="sqlite+aiosqlite:///./broker_insight_pilot.db" .venv/bin/python3 scripts/backup_restore.py backup

# 2. กู้คืนข้อมูล (Restore from Snapshot)
DATABASE_URL="sqlite+aiosqlite:///./broker_insight_pilot.db" .venv/bin/python3 scripts/backup_restore.py restore --file backups/pilot_backup_<timestamp>.json

# 3. ล้างและสร้างข้อมูลจำลองใหม่ทั้งหมด (Clean Synthetic Reset)
DATABASE_URL="sqlite+aiosqlite:///./broker_insight_pilot.db" .venv/bin/python3 scripts/backup_restore.py reset --count 50
```

---

## 5. ขั้นตอนการถอยกลับโมเดล AI (Model Rollback Procedure)

หากพบว่าโมเดลเวอร์ชันใหม่มีพฤติกรรมผิดปกติ หรือ Drift &gt; 0.20:
1. เข้าสู่ระบบด้วยบัญชี Admin (`admin@demo.local`)
2. ส่งคำขอ Rollback ไปยัง Endpoint `/api/v1/model/rollback`:
```bash
curl -X POST http://localhost:8000/api/v1/model/rollback \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"target_version": "1.0.0"}'
```
3. ตรวจสอบสถานะโมเดลที่ `/api/v1/model/registry` เพื่อยืนยันว่าสถานะ Active ถูกคืนค่าสำเร็จ
