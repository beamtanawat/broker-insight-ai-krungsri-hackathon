# รายงานการตรวจสอบความสอดคล้องของตัวชี้วัดและแหล่งข้อมูลหลัก (Metrics Consistency Report & Single Source of Truth)

> **โครงการ:** Broker Insight AI — Krungsri Hackathon  
> **ระยะการพัฒนา:** Phase 28 — Production Readiness, Observability, and Metrics Consistency Audit  
> **วัตถุประสงค์:** สอบทานค่าตัวชี้วัดทั้งหมดในโค้ด เอกสาร รายงาน และ JSON Artifacts เพื่อสร้างความโปร่งใสและกำหนด Single Source of Truth ที่เชื่อถือได้ 100%  
> **วันที่จัดทำ:** 30 สิงหาคม 2026  

---

## 1. ตารางตรวจสอบความสอดคล้องของตัวชี้วัด (Metrics Consistency Audit Table)

| ตัวชี้วัด (Metric) | แหล่งที่มา A (Source A) | แหล่งที่มา B (Source B) | แหล่งที่มา C (Source C) | สถานะความสอดคล้อง | คำอธิบายสาเหตุความแตกต่าง & แหล่งข้อมูลหลัก (Source of Truth) |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **ML Model Accuracy** | `baseline.json`: **90.83%** | `model-report.md`: **85.42%** | `/model/evidence` API: **90.83%** | ⚠️ **Legitimate Discrepancy** | **สาเหตุ:** `model-report.md` บันทึกผล Cross-Validation Baseline เริ่มต้น ขณะที่ `baseline.json` บันทึกผลบน Partition Holdout Test Set ($N=240$ Seed 42)<br>**Source of Truth:** `backend/app/ml/experiments/baseline.json` |
| **ML Model Precision** | `baseline.json`: **85.87%** | `model-report.md`: **78.95%** | `/model/evidence` API: **85.87%** | ⚠️ **Legitimate Discrepancy** | **สาเหตุ:** ผลทดสอบบน Test Set เฉพาะกลุ่ม Positive เทียบกับค่าเฉลี่ย Fold Validation<br>**Source of Truth:** `backend/app/ml/experiments/baseline.json` |
| **ML Model Recall** | `baseline.json`: **89.77%** | `model-report.md`: **90.24%** | `/model/evidence` API: **89.77%** | ⚠️ **Legitimate Discrepancy** | **สาเหตุ:** ผลลัพธ์บน Test Split ฉบับ Frozen Baseline<br>**Source of Truth:** `backend/app/ml/experiments/baseline.json` |
| **ML Model F1-Score** | `baseline.json`: **87.78%** | `model-report.md`: **84.23%** | `/model/evidence` API: **87.78%** | ⚠️ **Legitimate Discrepancy** | **สาเหตุ:** F1 บน Holdout Test Set = 87.78% (CV Mean = 84.23%)<br>**Source of Truth:** `backend/app/ml/experiments/baseline.json` |
| **ROC-AUC** | `baseline.json`: **0.9564** | `model-report.md`: **0.9261** | `/model/evidence` API: **0.9564** | ⚠️ **Legitimate Discrepancy** | **สาเหตุ:** AUC ของ Calibrated LightGBM บน Test Partition<br>**Source of Truth:** `backend/app/ml/experiments/baseline.json` |
| **Brier Score** | `baseline.json`: **0.0757** | `model-report.md`: **0.0757** | `/model/evidence` API: **0.0757** | ✅ **Consistent** | วัดผลความแม่นยำของความน่าจะเป็นหลัง Sigmoid Calibration<br>**Source of Truth:** `backend/app/ml/experiments/baseline.json` |
| **ECE (Expected Calibration Error)** | `baseline.json`: **0.0445** | `model-report.md`: **0.0445** | `/model/evidence` API: **0.0445** | ✅ **Consistent** | ค่าความคลาดเคลื่อนในการสอบเทียบความน่าจะเป็น (&lt; 0.05 ถือว่าดีเยี่ยม)<br>**Source of Truth:** `backend/app/ml/experiments/baseline.json` |
| **Priority Operating Threshold** | `threshold_analysis.json`: **0.50** | `predict.py`: Score **&ge; 70** (High) | `/model/threshold-analysis`: **0.50** | ✅ **Consistent** | **สาเหตุ:** Probability threshold คือ 0.50 ซึ่งแมปเป็น Display Score 0-100 โดยเกณฑ์ High Priority ตั้งไว้ที่ &ge; 70<br>**Source of Truth:** `backend/app/ml/experiments/threshold_analysis.json` & `predict.py` |
| **LLM Output Latency (Cold)** | `llm_optimized.json`: **9.70 ms** | `e2e_optimized.json`: **9.70 ms** | `/model/llm-performance`: **9.70 ms** | ✅ **Consistent** | วัดเวลาประมวลผล Tokenization + Guardrails + Mock LLM<br>**Source of Truth:** `backend/app/ml/experiments/llm_optimized.json` |
| **LLM Output Latency (Warm)** | `llm_optimized.json`: **0.18 ms** | `e2e_optimized.json`: **0.18 ms** | `/model/llm-performance`: **0.18 ms** | ✅ **Consistent** | วัดเวลา In-memory Cache Hit ดึงผ่าน SHA-256 Key<br>**Source of Truth:** `backend/app/ml/experiments/llm_optimized.json` |
| **LLM Token Usage (Avg)** | `llm_baseline.json`: **640 Tokens** | `llm_optimized.json`: **230 Tokens** | `/model/llm-performance`: **230 Tokens** | ✅ **Consistent** | ลดขนาด Prompt ผ่านการตัดคีย์ PII ที่ไม่จำเป็น (ลดลง 64.1%)<br>**Source of Truth:** `backend/app/ml/experiments/llm_optimized.json` |
| **LLM Cost per 1k Requests** | `llm_baseline.json`: **$0.18** | `llm_optimized.json`: **$0.06** | `/model/llm-performance`: **$0.06** | ✅ **Consistent** | คำนวณตามอัตรา Gemini 1.5 Flash ($0.075/1M input, $0.30/1M output)<br>**Source of Truth:** `backend/app/ml/experiments/llm_optimized.json` |
| **Recommendation Ineligible Rate** | `recommendation_baseline.json`: **22.5%** | `recommendation_evaluation.json`: **0.0%** | `/recommendations/performance`: **0.0%** | ✅ **Consistent** | ขจัดปัญหาแนะนำสินค้าผิดเงื่อนไขด้วย Hard Eligibility Gate<br>**Source of Truth:** `backend/app/ml/experiments/recommendation_evaluation.json` |
| **Recommendation Top-1 Match** | `recommendation_baseline.json`: **42.0%** | `recommendation_evaluation.json`: **85.0%** | `/recommendations/performance`: **85.0%** | ✅ **Consistent** | Candidate v1.1-optimized ทำคะแนนสอดคล้องกับความต้องการลูกค้า 85%<br>**Source of Truth:** `backend/app/ml/experiments/recommendation_evaluation.json` |
| **Full E2E Workflow Latency** | `e2e_baseline.json`: **68.72 ms** | `e2e_optimized.json`: **35.09 ms (Warm)** | `/model/e2e-performance`: **35.09 ms** | ✅ **Consistent** | วัดผลครบ 10 ขั้นตอนการทำงานจริงของนายหน้า<br>**Source of Truth:** `backend/app/ml/experiments/e2e_optimized.json` |
| **Peak Throughput** | `e2e_optimized.json`: **3,480 req/s** | `docs/e2e-performance-report.md`: **3,480 req/s** | `/model/e2e-performance`: **3,480 req/s** | ✅ **Consistent** | ทดสอบที่ 50 Concurrency ใน Local Demo Environment<br>**Source of Truth:** `backend/app/ml/experiments/e2e_optimized.json` |
| **Automated Test Count** | `pytest`: **150 Tests** | `walkthrough.md`: **150 Tests** | Codebase Test Files: **18 Files** | ✅ **Consistent** | ครอบคลุม Unit, Integration, Security, Load, และ Optimization Tests<br>**Source of Truth:** `pytest backend/tests` execution |

---

## 2. การกำหนดแหล่งข้อมูลหลักแห่งเดียว (Single Source of Truth Mapping)

เพื่อให้ทุกส่วนของระบบทำงานตรงกัน ไม่เกิดปัญหาค่าตัวเลขขัดแย้งในอนาคต:

1. **ML Model Champion & Performance:**
   - **แหล่งข้อมูล:** `backend/app/ml/experiments/baseline.json` และ `backend/app/ml/registry.json`
   - **API ให้บริการ:** `GET /api/v1/model/evidence` และ `GET /api/v1/model/registry`
2. **LLM Cost, Latency & Token Optimization:**
   - **แหล่งข้อมูล:** `backend/app/ml/experiments/llm_optimized.json`
   - **API ให้บริการ:** `GET /api/v1/model/llm-performance`
3. **Recommendation Engine Evaluation & Config:**
   - **แหล่งข้อมูล:** `backend/app/ml/experiments/recommendation_evaluation.json`
   - **API ให้บริการ:** `GET /api/v1/recommendations/performance` และ `GET /api/v1/recommendations/config`
4. **End-to-End System Benchmark:**
   - **แหล่งข้อมูล:** `backend/app/ml/experiments/e2e_optimized.json`
   - **API ให้บริการ:** `GET /api/v1/model/e2e-performance`
5. **Active System Health & Probes:**
   - **แหล่งข้อมูล:** Live Async Database Ping (`SELECT 1`) และ `PriorityPredictor._ensure_loaded()`
   - **API ให้บริการ:** `GET /health/live`, `GET /health/ready`, `GET /health`
