# รายงานผลการประเมินการทดสอบนำร่อง (Pilot Evaluation Report)

> **โครงการ:** Broker Insight AI — Krungsri Hackathon  
> **ระยะการประเมิน:** Phase 30 (Controlled Pilot Evaluation)  
> **สถานะการประเมิน:** **Pilot Evaluation Instrumentation Ready**  
> **วันที่มีผล:** สิงหาคม 2026  

---

## 1. บทสรุปผู้บริหาร (Executive Summary)

ระบบ **Broker Insight AI** ได้รับการติดตั้งและวางระบบการประเมินผลการทดสอบนำร่อง (Controlled Pilot Evaluation Framework) ครอบคลุมทั้งฝั่งการบันทึกเซสชันการทำงานจริง (Session Tracking), แบบประเมินความพึงพอใจ 10 ข้อตามมาตรวัด Likert Scale (1-5), ระบบบันทึกข้อตรวจพบและปัญหา (Issue Tracker), และแดชบอร์ดสรุปผลแบบเรียลไทม์

รายงานฉบับนี้แยกผลลัพธ์ออกเป็น 2 ส่วนอย่างโปร่งใส:
1. **หลักฐานเชิงเทคนิคและโมเดล AI (Technical Evidence):** ผ่านเกณฑ์มาตรฐานทุกมิติ (F1: 0.8778, ROC-AUC: 0.9537, Ineligible Rate: 0.00%, P95 Latency: 35.09 ms, 166/166 Automated Tests Passed)
2. **หลักฐานจากการประเมินโดยมนุษย์ (Human Pilot Evidence):** ระบบจัดเตรียมเครื่องมือรองรับครบถ้วน และพร้อมสำหรับการเก็บข้อมูลเมื่อเริ่มการทดสอบนำร่องจริงกับนายหน้าประกันภัย

---

## 2. ผลลัพธ์เชิงเทคนิคและประสิทธิภาพ AI (Technical & AI Results)

| ตัวชี้วัดเชิงเทคนิค (Technical Metric) | เกณฑ์เป้าหมาย (Target) | ผลการทดสอบจริง (Actual Evidence) | สถานะ (Status) |
| :--- | :---: | :---: | :---: |
| **API Error Rate (5xx)** | &lt; 0.5% | **0.00%** | ✅ PASS |
| **P50 Latency** | &lt; 50 ms | **28.40 ms** | ✅ PASS |
| **P95 Latency** | &lt; 200 ms | **35.09 ms** | ✅ PASS |
| **P99 Latency** | &lt; 500 ms | **57.93 ms** | ✅ PASS |
| **System Availability** | &ge; 99.5% | **100.0%** (Local Staging) | ✅ PASS |
| **Priority Model F1-Score** | &ge; 0.85 | **0.8778** ($N=240$) | ✅ PASS |
| **ROC-AUC Score** | &ge; 0.90 | **0.9537** | ✅ PASS |
| **Probability Calibration ECE** | &le; 0.05 | **0.0445** (Well-calibrated) | ✅ PASS |
| **Recommendation Ineligible Rate** | **0.00%** | **0.00%** (Hard Gated) | ✅ PASS |
| **Guardrail Violation Rate** | **0.00%** | **0.00%** | ✅ PASS |
| **Automated Test Suite Pass Rate** | **100%** | **166 / 166 Passed (100%)** | ✅ PASS |

---

## 3. ผลการประเมินจากผู้ใช้นายหน้า (Human Pilot Evidence Status)

> [!NOTE]
> **สถานะปัจจุบัน:** *Pilot evaluation instrumentation is ready; human pilot results are awaiting live cohort participation.*  
> โครงสร้างตาราง `pilot_sessions`, `pilot_feedbacks`, `pilot_issues`, และหน้าจอแบบประเมินพร้อมรับข้อมูลทันทีเมื่อเปิดรอบการทดลองร่วมกับนายหน้าประกัน

### ตัวชี้วัดที่รอการเก็บผลในรอบ Pilot (Pending Human Data):
- **Overall Usefulness Score:** เป้าหมาย &ge; 4.0 / 5.0
- **Ease of Use Score:** เป้าหมาย &ge; 4.0 / 5.0
- **Clarity of Customer Priority:** เป้าหมาย &ge; 4.0 / 5.0
- **SHAP Explanation Utility:** เป้าหมาย &ge; 4.0 / 5.0
- **AI Recommendation Utility:** เป้าหมาย &ge; 4.0 / 5.0
- **Trust in AI Outputs:** เป้าหมาย &ge; 4.0 / 5.0

---

## 4. รายการข้อตรวจพบและปัญหาที่พบ (Issues Log)

- **P0 Issues (Critical):** 0 รายการ
- **P1 Issues (Major):** 0 รายการ
- **P2 Issues (Enhancements logged in sandbox):**
  1. *Issue P2-01:* เพิ่มปุ่มทางลัดไปยังสถานการณ์ทดสอบ A-H บนหน้ารายการลูกค้าเพื่อความสะดวกในการสลับเคสตัวอย่าง
  2. *Issue P2-02:* เพิ่มตัวเลือกให้สามารถคัดลอก Rationale 4 มิติเพื่อนำไปใส่ในบันทึกของนายหน้าได้ในคลิกเดียว

---

## 5. ข้อสรุปและข้อเสนอแนะขั้นตอนถัดไป (Conclusion & Recommendations)

1. **ระบบมีความพร้อมสมบูรณ์สำหรับการเริ่มรอบทดสอบนำร่อง (Pilot Sandbox Trial)**
2. **แนะนำให้เริ่มต้นการทดสอบนำร่องกลุ่มเล็ก (Small-scale Pilot 3-5 นายหน้า)** เพื่อเก็บข้อมูล Likert Feedback และคำนวณเวลาการทำงานเปรียบเทียบจริง
3. **รักษาการทำงานของ Eligibility Hard-gate และ Deterministic Fallback** ไว้เป็นกลไกความปลอดภัยหลักของระบบ
