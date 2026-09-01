# รายงานการออกแบบ UX/UI ใหม่ (Complete UX/UI Redesign Report)
**โครงการ:** Broker Insight AI — Krungsri Hackathon Prototype to Enterprise Workspace  
**เวอร์ชัน:** Phase 33  
**สถานะ:** Production-like Pilot Sandbox Ready  

---

## 1. วัตถุประสงค์และกลุ่มเป้าหมาย (UX Objectives & Target Persona)

การออกแบบ UX/UI ใหม่ใน Phase 33 มุ่งเน้นการยกระดับจากแดชบอร์ดงานแข่งขัน (Hackathon Prototype) สู่ **พื้นที่ทำงานของนายหน้าประกันภัยระดับองค์กร (Enterprise Broker Workspace)** ที่มีความสุขุม น่าเชื่อถือ เรียบง่าย (Calm, Trustworthy, Minimal) และให้ความหนาแน่นของข้อมูลสูงแต่ยังคงอ่านง่ายและสบายตา

### คำถามหลัก 4 ข้อที่หน้าระบบต้องตอบนายหน้าได้ทันที:
1. **"วันนี้ฉันควรติดต่อลูกค้ารายไหนก่อน?"** &rarr; แสดงผ่าน Actionable KPI Strip, Priority Queue Table ที่จัดอันดับด้วยคะแนน AI (0–100) และ Today's Action Plan Side Panel
2. **"ทำไม AI ถึงแนะนำลูกค้ารายนี้?"** &rarr; แสดงผ่านปัจจัยสนับสนุนหลัก (Top Positive Factors) และปัจจัยลดทอน (Mitigating Factors) พร้อมตัวเลือกเปิดดูค่า TreeExplainer SHAP
3. **"ฉันควรพูดคุยและแนะนำอะไรแก่ลูกค้า?"** &rarr; แสดงผ่านสรุปพฤติกรรมลูกค้า (LLM Insight), ความต้องการ 5 ด้าน (Needs 5 Categories), ผลิตภัณฑ์แนะนำที่มี 4-Pillar Rationale และบทสนทนาแนะนำพร้อมคำถามเจาะลึก (AI Conversation Copilot)
4. **"ฉันจะบันทึกการตัดสินใจและติดตามงานได้อย่างไร?"** &rarr; รองรับปุ่ม Approve, Modify, Reject พร้อมบันทึกเหตุผลในคลิกเดียว และระบบ Follow-up Task Timeline

---

## 2. สถาปัตยกรรมสารสนเทศ (Information Architecture & App Shell)

ระบบจัดหมวดหมู่เมนูนำทางตามสิทธิ์ของผู้ใช้งาน (RBAC) ผ่าน **Global App Shell** ประกอบด้วย Sidebar ทางซ้าย, Topbar ด้านบนพร้อมป้ายระบุสภาวะแวดล้อม **"Pilot Sandbox"** และส่วนเนื้อหาหลัก:

```
├── 🏢 พื้นที่ทำงานนายหน้า (Workspace - Broker / Manager / Admin)
│   ├── 📋 แดชบอร์ด (Priority Queue & Action Plan)    -> /dashboard
│   ├── 👤 ข้อมูลลูกค้า 360 & AI (Customer 360 AI)     -> /customers/[id]
│   └── 💬 ผู้ช่วยสนทนา AI (Conversation Copilot)     -> /chat
│
├── 📊 การบริหารจัดการ (Management - Manager / Admin)
│   ├── 📈 รายงานและการวิเคราะห์ (Portfolio Analytics) -> /analytics
│   └── 🧠 โมเดล AI & ประสิทธิภาพ (AI Evidence)       -> /model
│
└── 🔒 การดูแลระบบและการทดสอบ (Administration & Pilot)
    ├── 🧪 ทดสอบนำร่อง (Pilot Evaluation Sandbox)     -> /pilot
    └── 📜 บันทึกการตรวจสอบ (Audit Trail)              -> /admin/audit
```

---

## 3. ระบบการออกแบบ (Design System & Reusable Primitives)

ระบบการออกแบบถูกสร้างขึ้นภายใต้โฟลเดอร์ `frontend/src/components/ui/` และ `frontend/src/components/layout/` โดยใช้โทนสีมาตรฐานองค์กร (Deep Slate Navy, Krungsri Warm Amber, Subtle Light Backgrounds) ตามข้อกำหนด WCAG 2.1 Level AA:

### 3.1 โทเค็นสีและตัวแปรหลัก (`globals.css`)
* **Primary / Brand:** Deep Slate Navy (`#0f172a`, `#1e293b`, `#334155`)
* **Accent / Krungsri Gold:** Warm Amber (`#f59e0b`, `#d97706`, `#b45309`)
* **Priority High (ความสำคัญสูง):** Soft Red (`#fef2f2` bg / `#991b1b` text / `#dc2626` solid)
* **Priority Medium (ปานกลาง):** Soft Amber (`#fffbeb` bg / `#92400e` text / `#d97706` solid)
* **Priority Low (ต่ำ):** Soft Emerald (`#f0fdf4` bg / `#166534` text / `#16a34a` solid)
* **Surfaces:** Light Neutral Cards (`#ffffff`), Subtle Backgrounds (`#f8fafc`, `#f1f5f9`), Borders (`#e2e8f0`)

### 3.2 คอมโพเนนต์มาตรฐาน (`frontend/src/components/ui/`)
1. [`Card.tsx`](file:///Users/chalermsak/Downloads/broker-insight-ai-krungsri-hackathon-main/frontend/src/components/ui/Card.tsx): กล่องคอนเทนเนอร์พร้อม Header, Subtitle, HeaderAction, Footer และตัวเลือก Padding/Border
2. [`Badge.tsx`](file:///Users/chalermsak/Downloads/broker-insight-ai-krungsri-hackathon-main/frontend/src/components/ui/Badge.tsx): ป้ายสถานะสำหรับระดับความสำคัญ (High, Med, Low), ความพร้อมใช้งาน, และ AI Tags
3. [`Button.tsx`](file:///Users/chalermsak/Downloads/broker-insight-ai-krungsri-hackathon-main/frontend/src/components/ui/Button.tsx): ปุ่มมาตรฐานพร้อมตัวแปร `primary`, `outline`, `ghost`, `danger`, `approve`, `modify`, `reject` และไอคอน Loading Spinner
4. [`Table.tsx`](file:///Users/chalermsak/Downloads/broker-insight-ai-krungsri-hackathon-main/frontend/src/components/ui/Table.tsx): ตารางระดับองค์กร รองรับ Sticky Header, Hover Rows, Alignment และ TableSkeleton
5. [`Modal.tsx`](file:///Users/chalermsak/Downloads/broker-insight-ai-krungsri-hackathon-main/frontend/src/components/ui/Modal.tsx): กล่องข้อความโต้ตอบแบบ Accessible ปิดด้วย Escape หรือการคลิก Backdrop
6. [`Tabs.tsx`](file:///Users/chalermsak/Downloads/broker-insight-ai-krungsri-hackathon-main/frontend/src/components/ui/Tabs.tsx): ระบบแท็บนำทางรองรับ Badge ประกอบ
7. [`Alert.tsx`](file:///Users/chalermsak/Downloads/broker-insight-ai-krungsri-hackathon-main/frontend/src/components/ui/Alert.tsx): แถบแจ้งเตือนข้อมูล, ข้อผิดพลาด, คำเตือน และความสำเร็จ
8. [`EmptyState.tsx`](file:///Users/chalermsak/Downloads/broker-insight-ai-krungsri-hackathon-main/frontend/src/components/ui/EmptyState.tsx): หน้าว่างเมื่อไม่มีข้อมูลพร้อมไอคอนและปุ่มดำเนินการ

---

## 4. รายละเอียดการปรับปรุงหน้าระบบ (Screen-by-Screen Improvements)

| หน้าจอ | ก่อนปรับปรุง (Before) | หลังปรับปรุง (After Enterprise Workspace) |
|---|---|---|
| **Login** (`/login`) | ฟอร์มธรรมดากลางหน้าจอ ไม่มีคำแนะนำบทบาทที่ชัดเจน | คอนเทนเนอร์เข้าสู่ระบบระดับสถาบันการเงิน พร้อมปุ่มคลิกเดียวเลือกบัญชีสาธิตตามบทบาท (Broker, Manager, Admin) และแถบแจ้งเตือน Pilot Sandbox ปลอดภัย |
| **Dashboard** (`/dashboard`) | ตารางรายการลูกค้ายาวเดี่ยวๆ ขาดสรุปงานประจำวัน | แดชบอร์ด 3 ส่วน: (1) KPI Strip สรุปลูกค้าและงานเร่งด่วน (2) Priority Queue Table ค้นหาและกรองแบบ Real-time พร้อมแถบจัดลำดับ AI (3) Today's Action Plan Side Panel แสดง 5 ลูกค้าที่ต้องติดต่อด่วนที่สุด |
| **Customer 360** (`/customers/[id]`) | หน้าจอยาวเลื่อนยาก รวมข้อมูลทุกอย่างปนกัน | พื้นที่ทำงาน AI แบบแท็บ 8 หมวดหมู่: (1) AI Decision & SHAP (2) LLM Insights (3) Needs 5 Categories (4) Product Recommendations & Decision Modals (5) Copilot Playbook (6) Profile 360 (7) Follow-up Timeline (8) Audit Logs |
| **Conversation Copilot** (`/chat`) | กล่องแช็ตสนทนาทั่วไป | ผู้ช่วยสนทนา AI แบบ Split-View: Quick Prompt Chips (สรุปบทสนทนา, แนะนำการปิดการขาย, วิเคราะห์ความต้องการ), สตรีมมิ่งข้อความ และตัวช่วยเลือกบริบทลูกค้า |
| **Analytics** (`/analytics`) | กราฟผสมระหว่างงานขายและระบบหลังบ้าน | แยกสัดส่วนชัดเจนระหว่าง (1) Business Workflow: อัตราการแปลงลูกค้า, ความเร็วในการปิด Follow-up, สัดส่วนความสำคัญ (2) AI Operations: Latency, Ineligible Gate Pass Rate 0.0%, LLM Safety |
| **Model Evidence** (`/model`) | ตารางค่าสถิติเชิงเดี่ยว | แดชบอร์ดตรวจสอบความเที่ยงตรงของ AI: Champion Model Card, 12 แท็บเจาะลึก (Test Holdout N=240, PSI Drift, E2E Latency, SHAP Feature Importance, Fairness & Bias, Model Registry) |
| **Pilot Evaluation** (`/pilot`) | ฟอร์มทดสอบกระจาย | แดชบอร์ดประเมินผลการทดสอบนำร่อง: 8 สถานการณ์จำลองมาตรฐาน (A–H), จับเวลาการทำงาน Real-time, แบบสอบถามความพึงพอใจ Likert Scale 1–5 และกล่องรายงานปัญหา |
| **Audit Trail** (`/admin/audit`) | รายการ JSON ดิบๆ | ตารางบันทึกกิจกรรมการตรวจสอบระบบ (Audit Trail) แบบแบ่งหน้า ค้นหาตามผู้ใช้และประเภท Entity ได้อย่างเป็นระเบียบ |

---

## 5. การตรวจสอบความถูกต้องและการสร้างผลลัพธ์ (Verification)

1. **Frontend Production Build:** ผ่านการคอมไพล์สำเร็จ 100% ด้วย Turbopack (`npm run build`) ปราศจาก Type Error หรือ Syntax Warning ใดๆ
2. **Backend Regression Test Suite:** รันชุดทดสอบความถูกต้องของ Business Logic ทั้งหมด 182+ การทดสอบ (`pytest`) ผ่าน 100% โดยไม่มีการแก้ไขโค้ด ML, SHAP, LLM, Recommendation หรือ Database Schema แต่อย่างใด
3. **Accessibility:** ผ่านเกณฑ์ความคมชัดของสี (Contrast Ratio > 4.5:1), รองรับการใช้คีย์บอร์ด Tab/Enter/Escape, และมีตัวระบุ ARIA ครบถ้วน
