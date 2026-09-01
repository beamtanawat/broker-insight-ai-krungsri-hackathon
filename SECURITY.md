# Security & Data Governance Policy — Broker Insight AI

> ⚠️ **DEMO & PROTOTYPE NOTICE:**
> This repository is a demonstration prototype developed for the Krungsri Hackathon.
> It uses **synthetic/fictional data only** and does not process real banking customer data.
> This document outlines the security architecture and governance controls implemented in the prototype.
> **No claim of formal regulatory or compliance certification (e.g., ISO 27001, PCI-DSS, SOC 2) is made.**

---

## 1. Authentication & Session Management

- **Password Storage:** All user passwords are encrypted using `bcrypt` (12 rounds) with individual salts. Plaintext passwords are never stored in the database or logged in application logs.
- **JWT Authentication:** Stateful sessions are replaced with cryptographically signed JSON Web Tokens (HS256):
  - **Access Tokens:** Short-lived (15 minutes expiry) carrying user identity (`sub`) and role (`role`).
  - **Refresh Tokens:** Long-lived (7 days expiry) for renewal without re-entering credentials.
- **Token Invalidation:** Expired or tampered tokens are rejected immediately with `401 Unauthorized` without leaking internal claims.

---

## 2. Role-Based Access Control (RBAC)

Authorization is enforced server-side using FastAPI dependencies on every endpoint:

| Role | Permitted Actions | Restricted Actions |
|---|---|---|
| **Broker** | • View assigned customer profiles<br>• Trigger AI Priority Scoring & SHAP analysis<br>• Request AI customer insights and conversation guides<br>• Record broker decisions on recommendations<br>• Create and update assigned follow-up tasks | • Cannot access user administration (`/admin/users`)<br>• Cannot modify product catalogs<br>• Cannot view unmasked global system logs |
| **Manager** | • View team dashboard metrics (`/dashboard/summary`, `/dashboard/team`)<br>• Inspect aggregated portfolio priorities and KYC distribution<br>• Review team activity stats | • Cannot modify core system configurations<br>• Cannot alter audit log entries |
| **Admin** | • Provision, activate, and deactivate users (`/admin/users`)<br>• Manage product catalog items<br>• Inspect system-wide audit logs (`/admin/audit`) | • Cannot bypass audit recording |

---

## 3. Data Masking & Privacy Governance

To minimize unnecessary exposure of sensitive identifiers, field-level masking is applied when serving data to brokers:
- **Policy Numbers:** Masked in middle sections (e.g., `POL-2024-88991` $\rightarrow$ `POL-****-88991`).
- **Account & Loan Numbers:** Account numbers in loan details are masked (e.g., `987-123456-7` $\rightarrow$ `987-***-7`).
- **Administrative Override:** Only authorized administrators or managers with full review mandates receive unmasked identifiers.

---

## 4. LLM Data Minimization Pipeline

When invoking Generative AI models (Google Gemini):
- **Never Sent:** Passwords, JWT tokens, Citizen IDs, bank account numbers, or internal database primary keys.
- **Sanitized Context:** Only high-level generalized attributes (e.g., age bracket, loan category, insurance count, broad asset range, and priority score) are passed to the model prompt.
- **Deterministic Rule Fallback:** When the external LLM is offline or unconfigured, data remains entirely within local runtime memory with no external transmission.

---

## 5. Rate Limiting & Abuse Prevention

A sliding-window in-memory rate limiter protects sensitive endpoints against brute-force and resource exhaustion attacks:
- **Login Endpoint (`POST /auth/login`):** Maximum 15 requests per minute per IP.
- **AI Scoring (`POST /customers/{id}/analyze`):** Maximum 30 requests per minute.
- **AI Conversation Assistant (`POST /customers/{id}/conversation`):** Maximum 30 requests per minute.
- Exceeding limits returns `429 Too Many Requests` with a clear advisory message.

---

## 6. Audit Logging & Traceability

Every critical business action is logged to the PostgreSQL `audit_logs` table:
- Actions logged: `LOGIN`, `LOGOUT`, `CUSTOMER_VIEWED`, `AI_ANALYSIS_REQUESTED`, `SCORE_GENERATED`, `RECOMMENDATION_DECISION`, `FOLLOW_UP_CREATED`, `FOLLOW_UP_UPDATED`, `CONVERSATION_ASSISTANT_REQUEST`.
- Attributes captured: `user_id`, `action`, `entity_type`, `entity_id`, `timestamp`, and clean metadata (e.g., model version, decision action).
- **Sanitization:** Audit metadata explicitly excludes passwords, raw secrets, and sensitive tokens.

---

## 7. Safe Error Handling & Information Leakage Prevention

- **Global Exception Handlers:** Catches unexpected server errors and returns a generic `{"detail": "Internal server error. Please try again later."}` with status `500`.
- **Zero Stack Trace Leaks:** Python tracebacks, database schema details, file system paths, and internal libraries are never returned in client HTTP responses.
- **Server-Side Structured Logging:** Detailed diagnostic information is recorded in structured server logs (`structlog`) for debugging.

---

## 8. Secret Management

- **No Hardcoded Secrets:** Application secrets (JWT secret keys, database credentials, Gemini API keys) are loaded exclusively via environment variables (`pydantic-settings`).
- **Git Hygiene:** `.env` and local artifact binaries are strictly ignored in `.gitignore`. The repository only maintains `.env.example` with sanitized placeholders.

---

## 9. Known Prototype Security Limitations & Future Enterprise Roadmap

1. **In-Memory Rate Limiting:** Current rate limiter uses in-memory state; in a multi-instance distributed cluster, this should be backed by Redis / Valkey.
2. **SSO / Enterprise Identity:** Future versions will integrate Krungsri Enterprise Active Directory via OAuth 2.0 / SAML 2.0.
3. **Data at Rest Encryption:** In production, PostgreSQL storage should use transparent database encryption (TDE) with AWS KMS / GCP Cloud KMS keys.
