# เกณฑ์ความสำเร็จและการยอมรับการทดสอบนำร่อง (Pilot Success Criteria & KPIs)

> **ระบบ:** Broker Insight AI — Krungsri Hackathon  
> **ระยะ:** Phase 29  
> **เกณฑ์การประเมิน:** วัดผลจากพฤติกรรมการใช้งานจริงและข้อมูลการทดลองใน Pilot Sandbox  

---

## 1. เกณฑ์ด้านเทคนิคและเสถียรภาพ (Technical & Reliability KPIs)

| ตัวชี้วัด (KPI) | เป้าหมายที่ยอมรับได้ (Target) | ผลการวัดปัจจุบัน (Current Evidence) | สถานะ (Status) |
| :--- | :---: | :---: | :---: |
| **System Availability** | &ge; 99.5% | 100% (Local Staging) | ✅ ผ่านเกณฑ์ |
| **API Error Rate (5xx)** | &lt; 0.5% | 0.00% | ✅ ผ่านเกณฑ์ |
| **P95 Latency (Warm System)** | &lt; 200 ms | 35.09 ms (E2E Benchmark) | ✅ ผ่านเกณฑ์ |
| **P99 Latency (E2E Workflow)** | &lt; 500 ms | 57.93 ms | ✅ ผ่านเกณฑ์ |
| **Safe Error Handling** | 100% (0 trace leaks) | 100% ผ่านการทดสอบ | ✅ ผ่านเกณฑ์ |

---

## 2. เกณฑ์ด้านความถูกต้องและคุณภาพ AI (AI & Recommendation KPIs)

| ตัวชี้วัด (KPI) | เป้าหมายที่ยอมรับได้ (Target) | ผลการวัดปัจจุบัน (Current Evidence) | สถานะ (Status) |
| :--- | :---: | :---: | :---: |
| **LightGBM Priority F1-Score** | &ge; 0.85 | 0.8778 (Holdout Test $N=240$) | ✅ ผ่านเกณฑ์ |
| **ROC-AUC Score** | &ge; 0.90 | 0.9537 | ✅ ผ่านเกณฑ์ |
| **Brier Score (Calibration)** | &le; 0.10 | 0.0757 | ✅ ผ่านเกณฑ์ |
| **Recommendation Ineligible Rate** | **0.00% (Strict 0%)** | 0.00% (Hard Gate ผ่าน 100%) | ✅ ผ่านเกณฑ์ |
| **LLM Guardrail Violation Rate** | **0.00%** | 0.00% | ✅ ผ่านเกณฑ์ |
| **LLM Fallback Seamlessness** | 100% availability | 100% (Deterministic Engine) | ✅ ผ่านเกณฑ์ |

---

## 3. เกณฑ์ด้านกระบวนการทำงานของนายหน้า (Workflow Adoption KPIs)

| ตัวชี้วัด (KPI) | เป้าหมายช่วงทดสอบนำร่อง (Pilot Target) |
| :--- | :---: |
| **AI Score Acceptance Rate** | &ge; 80% ของคำแนะนำที่นายหน้านำไปใช้จริง |
| **Action Logging Compliance** | 100% ของการกระทำถูกบันทึกลง Audit Trail |
| **Follow-up Task Creation** | &ge; 70% ของลูกค้าความสำคัญสูงมีนัดหมายติดตาม |
| **Decision Override Tracking** | 100% ของการ Override บันทึกเหตุผลของนายหน้า |
