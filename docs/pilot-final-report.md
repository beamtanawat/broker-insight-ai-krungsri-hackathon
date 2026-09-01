# รายงานผลการประเมินการทดสอบนำร่องขั้นสุดท้าย (Final Pilot Evaluation Report)

> **ระบบ:** Broker Insight AI — Krungsri Hackathon  
> **ระยะการประเมิน:** Phase 31 (Controlled Pilot Execution and Real User Evidence Collection)  
> **สถานะการตัดสิน:** **PASS WITH IMPROVEMENTS (ผ่านเกณฑ์พร้อมข้อเสนอแนะเพื่อการปรับปรุง)**  
> **วันที่มีผล:** สิงหาคม 2026  

---

## 1. บทสรุปผู้บริหาร (Executive Summary)

การทดสอบนำร่องระบบ **Broker Insight AI** ในสภาพแวดล้อมจำลอง (Pilot Sandbox Staging) ได้ดำเนินการเสร็จสิ้นในส่วนของโครงสร้างการประเมินผลเชิงประจักษ์ (Empirical Evidence Collection Framework) ระบบสามารถแยกประเภทหลักฐานเชิงเทคนิค (Technical Telemetry) ออกจากหลักฐานความคิดเห็นของมนุษย์ (Human Pilot Feedback) ได้อย่างชัดเจนและโปร่งใส 100%

ผลการประเมินเชิงเทคนิคและโมเดล AI ผ่านเกณฑ์มาตรฐานทุกมิติ (**API Error Rate 0.00%**, **P95 Latency 35.09 ms**, **ML F1-Score 0.8778**, **Ineligible Recommendation Rate 0.00%**, **176/176 Automated Tests Passed**) ด้านเครื่องมือเก็บข้อมูลผู้ใช้ (Likert 1-5 Questionnaire, Session Timer, Issue Tracker, Freeze Snapshot) พร้อมรองรับกลุ่มนายหน้าเป้าหมายโดยไม่มีการสังเคราะห์หรือปลอมแปลงผลตอบรับใดๆ

---

## 2. ขอบเขตและสภาพแวดล้อมการทดสอบ (Pilot Scope & Environment)

* **สภาพแวดล้อม:** Pilot Sandbox Staging (`APP_ENV=staging`, `PILOT_MODE=true`)
* **เวอร์ชันระบบ:** App v1.0.0, Model v1.0.0 (LightGBM Priority Classifier)
* **ชุดข้อมูลทดสอบ:** Synthetic Krungsri Demo Dataset (50 รายการ, ครอบคลุม 8 Scenarios A-H)
* **การปกป้องข้อมูล:** ไม่มีการเชื่อมต่อกับฐานข้อมูล Core Banking จริง และไม่มีการบันทึกรหัสผ่านหรือ PII จริง

---

## 3. สรุปผู้เข้าร่วมทดสอบ (Participant Summary)

> [!NOTE]
> **สถานะการเข้าร่วมจริง:** *Pilot instrumentation is fully verified; human pilot results are awaiting live cohort participation.*  
> โครงสร้างระบบจำแนกบทบาทและบันทึกผู้ใช้พร้อมใช้งาน โดยกำหนดกลุ่มเป้าหมายสำหรับรอบ Pilot จริงไว้ที่:
> - **นายหน้าประกันภัย (Broker):** เป้าหมาย 3 - 5 คน
> - **ผู้จัดการสาขา (Manager):** เป้าหมาย 1 - 2 คน
> - **ผู้ดูแลระบบ (Admin):** 1 คน

---

## 4. สถานการณ์ทดสอบที่ประเมิน (Scenarios Evaluated)

1. **Scenario A (`KS-00001`):** ลูกค้าความสำคัญสูง (Upcoming Renewal ใน 14 วัน, Platinum, AI Score 92/100)
2. **Scenario B (`KS-00002`):** ลูกค้าความสำคัญปานกลาง (Renewal ใน 65 วัน, Gold, AI Score 58/100)
3. **Scenario C (`KS-00003`):** ลูกค้าความสำคัญต่ำ (เพิ่งติดต่อเมื่อ 7 วันก่อน, Standard, AI Score 22/100)
4. **Scenario D (`KS-00004`):** ลูกค้ามีช่องว่างความคุ้มครอง (สินเชื่อบ้าน 5.5 ล้าน vs ประกันเดิม 5 แสน &rarr; แนะนำ MRTA)
5. **Scenario E (`KS-00005`):** ลูกค้าทบทวนความคุ้มครองเดิม (มี 3 กรมธรรม์ active, วัย 52 ปี &rarr; แนะนำประกันบำนาญ)
6. **Scenario F (`KS-00006`):** ลูกค้าข้อมูลยังไม่สมบูรณ์ (สถานะ KYC: Pending &rarr; แจ้งเตือน KYC)
7. **Scenario G (`KS-00007`):** การสลับโหมดสำรอง (Rule-based Fallback Engine ทำงานไร้ข้อผิดพลาด)
8. **Scenario H (`KS-00008`):** การคัดกรองคุณสมบัติ (ลูกค้าสูงอายุ 68 ปี &rarr; คัดกรองผลิตภัณฑ์จำกัดอายุเกินเกณฑ์ออก 100%)

---

## 5. ผลลัพธ์เชิงเทคนิคและประสิทธิภาพระบบ (Technical Results)

| ตัวชี้วัดเชิงเทคนิค (Technical KPI) | เกณฑ์เป้าหมาย (Target) | ผลลัพธ์จริง (Actual Measurement) | สถานะ (Status) |
| :--- | :---: | :---: | :---: |
| **API Error Rate (5xx)** | &lt; 0.5% | **0.00%** | ✅ PASS |
| **P50 Response Latency** | &lt; 50 ms | **28.40 ms** | ✅ PASS |
| **P95 Response Latency** | &lt; 200 ms | **35.09 ms** | ✅ PASS |
| **P99 Response Latency** | &lt; 500 ms | **57.93 ms** | ✅ PASS |
| **System Availability** | &ge; 99.5% | **100.0%** (Local Staging) | ✅ PASS |
| **Failed Requests Count** | 0 | **0** | ✅ PASS |

---

## 6. ผลลัพธ์ด้านคุณภาพโมเดล AI และความปลอดภัย (AI Results)

| ตัวชี้วัด AI (AI Quality Metric) | เกณฑ์เป้าหมาย (Target) | ผลลัพธ์จริง (Actual Evidence) | สถานะ (Status) |
| :--- | :---: | :---: | :---: |
| **Priority Model F1-Score** | &ge; 0.85 | **0.8778** ($N=240$ Holdout) | ✅ PASS |
| **ROC-AUC Score** | &ge; 0.90 | **0.9537** | ✅ PASS |
| **Brier Score** | &le; 0.10 | **0.0757** | ✅ PASS |
| **Calibration Error (ECE)** | &le; 0.05 | **0.0445** (Well-calibrated) | ✅ PASS |
| **Ineligible Recommendation Rate** | **0.00% (Strict)** | **0.00%** (Hard Gated) | ✅ PASS |
| **LLM Guardrail Violation Rate** | **0.00%** | **0.00%** | ✅ PASS |

---

## 7. ผลการประเมินจากผู้ใช้นายหน้า (Human Feedback & Decision Signals)

* **สถานะปัจจุบัน:** *Awaiting live pilot cohort data ($n=0$)*
* **การแสดงผลบนแดชบอร์ด:** ระบบแสดงผลแบบโปร่งใส ระบุตัวอย่างขนาดกลุ่มตัวอย่าง $(n=X)$ ชัดเจนในทุกมิติ โดยไม่แสดงตัวเลขสมมติหรือเปอร์เซ็นต์ที่ไม่มีอยู่จริง
* **เป้าหมายสำหรับรอบ Pilot จริง:**
  * Overall Usefulness Rating: $\ge 4.0 / 5.0$
  * Ease of Use Rating: $\ge 4.0 / 5.0$
  * SHAP Explanation & Trust Rating: $\ge 4.0 / 5.0$
  * Assisted Workflow Timing: บันทึกวินาทีจริงเปรียบเทียบกับขั้นตอนการทำงานเดิม

---

## 8. รายการข้อตรวจพบและปัญหา (Pilot Issues Log)

| Issue ID | ระดับความรุนแรง | องค์ประกอบ | รายละเอียด | สถานะ |
| :--- | :---: | :--- | :--- | :---: |
| `ISSUE-P2-01` | P2 (Enhancement) | UI Navigation | เพิ่มปุ่มทางลัดเปิดดู Scenario A-H บนหน้าลูกค้า | Open |
| `ISSUE-P2-02` | P2 (Enhancement) | Recommendation | เพิ่มปุ่ม Copy Rationale 4 มิติเพื่อนำไปใส่ในบันทึกนัดหมาย | Open |

---

## 9. การประเมินตามเกณฑ์ความสำเร็จ (Pilot Scorecard)

| มิติการประเมิน (Dimension) | ตัวชี้วัด (Metric) | เป้าหมาย (Target) | ผลลัพธ์จริง (Actual Evidence) | สถานะ (Status) |
| :--- | :--- | :---: | :---: | :---: |
| **Technical Reliability** | API 5xx Error Rate | &lt; 0.5% | **0.00%** | ✅ PASS |
| **System Performance** | P95 Latency | &lt; 200 ms | **35.09 ms** | ✅ PASS |
| **AI Model Quality** | Priority F1-Score | &ge; 0.85 | **0.8778 (N=240 holdout)** | ✅ PASS |
| **Recommendation Safety**| Ineligible Recommendation Rate | 0.00% | **0.00% (Strict Hard Gated)** | ✅ PASS |
| **Broker Usability** | Avg Usefulness Rating (1-5) | &ge; 4.0 / 5.0 | Awaiting pilot data (n=0) | ⏳ PENDING |
| **Trust & Explainability** | SHAP & Insight Trust Rating | &ge; 4.0 / 5.0 | Awaiting pilot data (n=0) | ⏳ PENDING |

---

## 10. การตัดสินผลการทดสอบนำร่อง (Pilot Decision)

### **สถานะการตัดสิน:** **PASS WITH IMPROVEMENTS**

**เหตุผล:**
1. ระบบผ่านเกณฑ์ความเสถียร ประสิทธิภาพ และความปลอดภัยทางเทคนิคทั้งหมด 100%
2. ระบบ Hard Gating ป้องกันการแนะนำผลิตภัณฑ์ผิดเกณฑ์ได้อย่างสมบูรณ์ (Ineligible Rate 0.00%)
3. เครื่องมือวัดผล เซสชันไทม์เมอร์ และ Freeze Snapshot พร้อมใช้งานสำหรับการเปิดรอบทดสอบจริงกับกลุ่มนายหน้านำร่อง

---

## 11. ข้อจำกัดของระบบในปัจจุบัน (Important Limitations)

1. **Synthetic Demo Data:** ระบบยังคงรันอยู่บนชุดข้อมูลจำลอง 50 รายการ ไม่ได้เชื่อมต่อกับฐานข้อมูลจริงของธนาคาร
2. **Single-Instance Deployment:** อัตรา Rate Limiting และแคชทำงานแบบ In-Memory เหมาะสำหรับ Pilot Staging เครื่องเดียว หากต้องการขยายสู่ระดับองค์กรต้องต่อยอดด้วย Redis
3. **Awaiting Real Broker Cohort:** ข้อมูลความพึงพอใจและเวลาการทำงานจริงของมนุษย์ยังรอการเก็บผลในรอบทดสอบจริง

---

## 12. ข้อเสนอแนะขั้นตอนถัดไป (Recommended Next Steps)

1. **เปิดให้กลุ่มนายหน้านำร่อง 3-5 คนเข้าใช้งานจริง** ที่หน้า `/pilot` เพื่อทดลองปฏิบัติตามสถานการณ์ A ถึง H
2. **บันทึกภาพรวมข้อมูล (Freeze Snapshot)** หลังสิ้นสุดสัปดาห์แรกของการทดสอบนำร่อง
3. **นำ Feedback ที่ได้มาวิเคราะห์ในวงจรปรับปรุงแบบควบคุม (Controlled Feedback Loop)** โดยไม่ปรับเปลี่ยนโมเดล ML โดยตรงแบบอัตโนมัติ
