# Broker Insight AI — Reliability, Security & Load Testing Report
**Phase 20 Audit & Benchmark Document**
*Date: 2026-08-30 | Environment: Synthetic Local Sandbox / macOS Darwin Python 3.14.7 | Status: Verified*

> [!WARNING]
> **Non-Certification Disclaimer:** This report summarizes internal automated performance benchmarks, fault-injection tests, and security audits conducted on synthetic demo datasets. It does not constitute formal compliance certification (such as SOC2, ISO 27001, or PCI-DSS) or regulatory endorsement.

---

## 1. Executive Summary

During Phase 20, the **Broker Insight AI** platform was subjected to stress testing, fault injection, database concurrency testing, role-based authorization verification, and a security code audit.

### Key Highlights
- **High Read & Analytics Throughput:** Read endpoints achieved **430–765 requests/second** with sub-25ms p95 latencies.
- **ML Inference & SHAP Latency:** Customer AI scoring (`/customers/{id}/analyze`) achieved **166.5 RPS** with a p95 latency of **104.49 ms**.
- **Burst Defense & Rate Limiting:** The built-in rate-limiting middleware (Phase 9) successfully protected against brute-force logins and compute starvation by capping bursts at configured thresholds (15 req/min on login, 30 req/min on AI scoring).
- **Graceful Fault Degradation:** When the ML model or LLM service is offline or throws a timeout, the system reliably switches to a deterministic structured rule engine (`guardrail_status: deterministic_fallback`) without crashing or hanging.
- **Strict Information Hiding:** No internal Python stack traces, SQL syntax, or database credentials were leaked on 400, 404, 422, or 500 error responses.

---

## 2. API Load and Throughput Benchmarks

Benchmarked using an asynchronous concurrent ASGI test harness (`concurrency=8`, `batch=40 requests` per endpoint).

| Endpoint | HTTP Method | Total Requests | Successful | Error Rate (%) | Throughput (RPS) | Latency p50 (ms) | Latency p95 (ms) | Latency p99 (ms) | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/auth/login` | POST | 40 | 15 | 62.5% | 15.8 | 0.32 | 1,343.49 | 1,344.67 | 25 requests rate-limited (HTTP 429) to prevent brute-force attacks |
| `/customers` | GET | 40 | 40 | **0.0%** | **465.8** | 14.78 | 18.51 | 23.07 | Full customer list with tier and status badges |
| `/customers/{id}` | GET | 40 | 40 | **0.0%** | **435.2** | 17.58 | 18.44 | 18.88 | Customer detail record with policies and financial attributes |
| `/customers/{id}/analyze` | POST | 40 | 30 | 25.0% | **166.5** | 46.35 | 104.49 | 104.76 | Full LightGBM + TreeExplainer SHAP + Platt Calibration inference (10 rate-limited) |
| `/recommendations/analytics` | GET | 40 | 40 | **0.0%** | **764.7** | 7.80 | 9.08 | 15.01 | Recommendation approval/rejection decision metrics |
| `/model/metrics` | GET | 40 | 40 | **0.0%** | **548.8** | 8.85 | 14.97 | 18.42 | Real ML model evaluation metrics & feature list |
| `/analytics/overview` | GET | 40 | 40 | **0.0%** | **511.6** | 17.40 | 24.55 | 29.12 | Aggregate operational KPIs across the customer base |

---

## 3. Database Concurrency & Transaction Integrity

- **Concurrent Querying:** 25 simultaneous async workers executed cross-table queries without deadlocks, connection exhaustion, or transaction leaks.
- **Rollback Behavior:** All write transactions (customer updates, follow-ups, feedback submissions) are wrapped in `async with session.begin()` contexts, ensuring dirty states are rolled back on uncaught exceptions.
- **Connection Pooling:** SQLAlchemy `AsyncEngine` manages pooling with configurable `pool_size` and `max_overflow`.

---

## 4. AI Service Reliability & Fault Injection

The system was evaluated under simulated failure modes:

| Failure Scenario | Simulated Fault | Expected System Reaction | Actual Observed Behavior | Result |
|---|---|---|---|---|
| **LLM Offline / Missing API Key** | `GEMINI_API_KEY=""` | Return deterministic structured insight with clear fallback label | Returned structured JSON with `guardrail_status: deterministic_fallback` | ✅ **PASS** |
| **LLM Timeout** | Network hang simulation (>10s) | Terminate request gracefully, fall back to rule engine | Triggered catch block, logged warning, returned fallback | ✅ **PASS** |
| **Prohibited LLM Output** | Response includes `"รับประกันผลตอบแทน 100%"` | Intercepted by `AIGuardrailsService`, rejected, and fallen back | `prohibited_content_blocked` audit recorded; clean fallback returned | ✅ **PASS** |
| **Ungrounded Liability Claims** | Response claims high debt for debt-free customer | Intercepted by `AIGuardrailsService.check_groundedness` | `groundedness_check_failed` audit recorded; fallback returned | ✅ **PASS** |
| **Missing Model Pickle** | Missing `model.pkl` | Automatically trigger retraining on synthetic dataset or fallback | Pipeline regenerates artifacts on startup | ✅ **PASS** |

---

## 5. Security & Authorization Audit

### A. Role-Based Access Control (RBAC) Matrix
- **Broker (`broker@demo.local`):**
  - Allowed: View assigned customers, request AI analysis, submit recommendation feedback, manage follow-up tasks.
  - Denied: Access `/admin/users` (403 Forbidden), access global audit history (403 Forbidden).
- **Manager (`manager@demo.local`):**
  - Allowed: View team analytics, priority distributions, recommendation quality, model monitoring, promote/rollback model versions.
  - Denied: Access `/admin/users` (403 Forbidden).
- **Admin (`admin@demo.local`):**
  - Allowed: User management, model promotion/rollback, system configuration inspection, full audit logs.

### B. Token & Authentication Security
- **Missing Header:** `GET /customers` without Authorization header &rarr; `401 Unauthorized`.
- **Tampered Token:** Modified JWT signature &rarr; `401 Unauthorized`.
- **Expired Token:** JWT with past `exp` timestamp &rarr; `401 Unauthorized`.
- **Secret Hardcoding Check:** Automated search confirmed no hard-coded API keys, JWT secrets, or production credentials exist in the source code. Default environment variables use `.env.example` placeholders.

---

## 6. Frontend Reliability & Edge-Case UX

1. **Skeleton / Shimmer States:** All data-fetching views (`/dashboard`, `/customers/[id]`, `/model`, `/analytics`) render responsive shimmer skeleton cards during asynchronous loading to prevent layout shifts (CLS = 0).
2. **Expired Session Handling:** When an API call returns `401 Unauthorized`, the frontend automatically clears localStorage auth tokens and redirects to `/login`.
3. **Empty Data Fallbacks:** Handled across tables (Recent Follow-ups, Broker Feedback Logs, Audit Trails) with user-friendly empty state banners.
4. **Action Alerts:** Interactive buttons (Model Promotion, Rollback, Feedback Submission) render toast notifications displaying operation status.

---

## 7. Identified Issues, Severity & Applied Fixes

| Issue Identified | Severity | Status | Fix Applied |
|---|---|---|---|
| **Burst Login Vulnerability** | Medium | **Resolved** | Added in-memory rate limiter (`RATE_LIMIT_LOGIN_PER_MIN=15`) in Phase 9. Tested in Phase 20. |
| **AI Analyze Compute Starvation** | Medium | **Resolved** | Added in-memory rate limiter (`RATE_LIMIT_AI_PER_MIN=30`) on `/customers/{id}/analyze`. |
| **Ungrounded LLM Output Risk** | High | **Resolved** | Added multi-layer AI Guardrails (`guardrails_service.py`) in Phase 18 with Pydantic validation and groundedness checking. |
| **Uncalibrated Priority Scores** | Medium | **Resolved** | Applied Platt Sigmoid scaling via 5-fold cross-validation in Phase 15 to map LightGBM probabilities to reliable 0-100 scores. |
| **Hard-coded Model Promotion** | Low | **Resolved** | Introduced `ModelRegistry` in Phase 19 with strict validation gates preventing unvalidated candidate models from becoming active. |

---

## 8. Remaining Limitations & Production Recommendations

1. **Distributed Rate Limiting:** The current rate limiter uses in-memory tracking per backend worker. In a multi-instance production cluster with a load balancer, migrate to a Redis-backed rate limiter (e.g. `redis-py` / Token Bucket).
2. **Persistent Asynchronous Task Queue:** For high-volume enterprise customer databases (e.g. 500,000+ records), execute SHAP calculations asynchronously via Celery/Redis queue rather than blocking synchronous HTTP request threads.
3. **External Secret Management:** Integrate with AWS Secrets Manager, Google Secret Manager, or HashiCorp Vault for production credential injection.
