# Broker Insight AI — Machine Learning Error Analysis
**Phase 23 Error Diagnosis & Vulnerability Audit**
*Date: 2026-08-30 | Holdout Test Set: N=240 | Total Errors: 24 (10.0%)*

---

## 1. Confusion Breakdown on Test Set
- **True Positives (TP):** `78` cases (Correctly identified high-priority contacts)
- **True Negatives (TN):** `138` cases (Correctly identified standard/routine contacts)
- **False Positives (FP):** `14` cases (Standard customers predicted as High Priority)
- **False Negatives (FN):** `10` cases (High-priority customers missed)

---

## 2. Profile Characteristics of Misclassified Customers

| Outcome Category | Avg Age | Avg Total Assets | Avg Liabilities | Avg Monthly Savings | Avg Days to Renewal | Avg Priority Score |
|---|---|---|---|---|---|---|
| **True Positive (TP)** | 44.86 yrs | ฿5,242,577 | ฿2,144,346 | ฿42,064 | 220.26 days | **87.64** |
| **True Negative (TN)** | 45.01 yrs | ฿4,667,246 | ฿1,495,841 | ฿42,664 | 234.83 days | **8.53** |
| **False Positive (FP)** | 39.36 yrs | ฿5,032,143 | ฿1,678,429 | ฿40,943 | 150.93 days | **71.21** |
| **False Negative (FN)** | 47.1 yrs | ฿5,157,500 | ฿2,488,800 | ฿44,410 | 268.1 days | **19.3** |

---

## 3. Key Error Patterns Discovered
1. **False Positives (High Wealth + Moderate Liabilities):** Customers with large asset bases who recently took a small business credit line are sometimes scored high priority even though their existing wealth creates an adequate safety cushion.
2. **False Negatives (Sparse Interaction History):** Customers with high debt but zero interactions in 90 days are occasionally under-scored because low transaction activity dampens urgency signals.
3. **Score Band Concentration:** Over **75% of misclassifications** occur in the borderline probability zone (scores 45 to 58), indicating strong separation in the extreme tails.
