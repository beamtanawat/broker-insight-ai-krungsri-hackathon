# Broker Insight AI — Technical Interview Story & Q&A

This guide prepares you for deep technical discussions, architecture reviews, and engineering interviews.

---

### Q1: What specific problem does Broker Insight AI solve?
> **Answer:**  
> In banking and insurance brokerage, advisors manage hundreds of client accounts spread across disconnected core banking, CRM, and policy administration databases. Brokers struggle with two major bottlenecks: **prioritization paralysis** (spending excessive time deciding who to call first) and **black-box skepticism** (distrusting automated scores without understanding why). Broker Insight AI unifies client data into a single 5-tab workspace, calculates calibrated opportunity priority, explains exact positive/negative drivers using TreeSHAP, ensures 0% ineligible product recommendations through hard gating, and equips brokers with prompt-cached conversation prep in under two minutes.

---

### Q2: Why choose LightGBM over Deep Learning or simple Logistic Regression?
> **Answer:**  
> Tabular banking data (account balances, policy counts, days until renewal) exhibits strong non-linear relationships, differing numerical scales, and sharp step thresholds (e.g. renewal window < 30 days) where Gradient Boosted Decision Trees (GBDT) consistently outperform Deep Neural Networks. Compared to standard XGBoost or Random Forests, **LightGBM's histogram-based binning and leaf-wise tree growth** deliver faster training and sub-30ms inference latency, which is critical for real-time interactive dashboards.

---

### Q3: Why is probability calibration necessary, and how did you implement it?
> **Answer:**  
> Raw tree-based boosting models optimize rank-ordering (ROC-AUC) but produce uncalibrated, distorted probabilities near 0 and 1 due to extreme leaf-node splits. For an advisor, an uncalibrated score of "90%" cannot be trusted as an actual 90% likelihood. We applied **Platt Sigmoid Scaling (Isotonic / Sigmoidal logistic transformation)** on hold-out validation predictions, improving probability fidelity:
> - **Expected Calibration Error (ECE):** reduced to **0.045**
> - **Brier Score:** lowered to **0.076**

---

### Q4: Why TreeSHAP instead of permutation feature importance or LIME?
> **Answer:**  
> Permutation importance provides only global averages across an entire dataset, failing to explain individual client predictions. LIME uses local perturbation approximations that can be unstable and computationally slow. **TreeSHAP (TreeExplainer)** computes exact Shapley values in polynomial time ($O(TLD^2)$), satisfying the mathematical properties of local accuracy, missingness, and consistency. This allows us to extract exact positive and negative attributions for each customer within 25 milliseconds.

---

### Q5: Why not use a Large Language Model (LLM) for the primary priority scoring?
> **Answer:**  
> LLMs are non-deterministic, prone to numerical hallucination, mathematically uncalibrated, expensive, and introduce multi-second latencies (500–2000ms). Using an LLM for core tabular classification would introduce unacceptable latency and high operational token costs. Instead, we use a **disciplined hybrid architecture**:
> - **LightGBM:** Fast, deterministic, sub-30ms numerical scoring and SHAP explainability.
> - **Gemini 1.5 Flash:** Synthesis of natural language insights, consultative opening questions, and dialogue preparation.

---

### Q6: How did you optimize LLM latency and operating cost?
> **Answer:**  
> 1. **Prompt Minification:** Streamlined prompts from verbose descriptions to structured JSON-only templates.
> 2. **In-Memory TTLCache:** Implemented customer-keyed caching (1-hour TTL) invalidated on client record updates. This achieved an **84% Cache Hit Rate** and ~84% reduction in API token consumption.
> 3. **Deterministic Fallback Engine:** If cloud LLM APIs experience rate limiting or network timeout (>3000ms), the system seamlessly switches to a rule-based synthesis engine, ensuring 100% uptime.

---

### Q7: How do you guarantee safety and prevent LLM hallucination?
> **Answer:**  
> We employ a multi-layered guardrail strategy:
> 1. **Input Sanitization:** Strips PII (IDs, raw credit cards) and neutralizes prompt injection attempts.
> 2. **Grounded Context:** Prompts are strictly bound to verified customer balances and active policies.
> 3. **Output Schema Validation:** Pydantic v2 enforces structured JSON output schemas; malformed responses trigger immediate retry/fallback.
> 4. **Prohibited Sales Language Filter:** Rejects guaranteed return claims, high-pressure sales phrasing, or unauthorized tax advice.

---

### Q8: How does the system guarantee 0% ineligible product recommendations?
> **Answer:**  
> Rather than relying on LLMs to remember product rules, we built a deterministic **Pre-Ranking Hard Eligibility Gate**. Before computing match scores, the engine filters the product catalog against hard criteria:
> - Client age within entry limits ($[\text{min\_age}, \text{max\_age}]$)
> - Minimum monthly income threshold
> - Existing active policy overlap (deduplicating identical coverage)  
> This architectural separation guarantees a **0.0% Hard Eligibility Gate Violation Rate**.

---

### Q9: How does the broker retain control (Human-in-the-Loop)?
> **Answer:**  
> The system explicitly separates AI suggestion from human decision. On the Customer 360 workspace:
> - The top recommendation is presented as an *"AI Suggestion"* alongside alternatives.
> - The broker must explicitly select **[เห็นชอบ (Approve)]**, **[ปรับเปลี่ยน (Modify)]**, or **[ปฏิเสธ (Reject)]**.
> - If modified or rejected, the broker selects structured feedback reasons (e.g. *"Customer prefers liquidity"*, *"Recent life change"*).
> - These decisions are stored in the database and surfaced in MLOps monitoring to identify model blind spots.

---

### Q10: How would you transition this prototype into a full enterprise production system?
> **Answer:**  
> 1. **Enterprise Identity:** Replace local JWT with OAuth2/OIDC/SAML integration with Active Directory/PingFederate.
> 2. **Streaming Data Pipelines:** Connect to Apache Kafka / Apache Flink for real-time transaction event ingestion and feature store sync (e.g., Feast).
> 3. **Model Risk Management (MRM):** Complete banking regulatory model documentation and independent validation testing.
> 4. **Infrastructure & Resilience:** Deploy containerized services on Kubernetes (EKS/GKE) across multi-AZ clusters with Redis distributed caching and automated Prometheus/Grafana alerting.
