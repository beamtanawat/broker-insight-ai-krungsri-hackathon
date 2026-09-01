"""
ML Data Generator — produces 500 synthetic broker customers with realistic features.
All names, IDs, and values are fictional and for prototype demonstration only.
"""
import json
import random
import os
from pathlib import Path

import numpy as np
import pandas as pd

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

THAI_FIRST_NAMES = [
    "นที", "มินตรา", "คีตะ", "สมศรี", "วิภา", "ปิยะ", "อรุณ", "ณัฐพร",
    "สุชาติ", "พรรณี", "ธนภูมิ", "วัชรี", "ชัยวัฒน์", "นภาพร", "ศิริพร",
    "อภิชาติ", "ลดาวัลย์", "ภัทรพงษ์", "จิรนันท์", "ธีรวัฒน์", "กนกวรรณ",
    "วรชัย", "พิมพ์ใจ", "สันติ", "ดวงใจ", "วิโรจน์", "ปาริชาติ", "อานนท์",
    "ชุติมา", "สุรชัย", "วาสนา", "ณัฐวุฒิ", "สุพรรณ", "ศักดิ์ดา", "รัตนา"
]
THAI_LAST_NAMES = [
    "วาริน", "ชัยโย", "อนันต์", "สุขใจ", "เจริญผล", "ทองดี", "รุ่งเรือง",
    "บุญมี", "ศรีสุข", "ใจดี", "มั่นคง", "สว่างใจ", "โชคดี", "พรประเสริฐ",
    "กิจการ", "พึ่งพา", "ตั้งมั่น", "ยิ้มแย้ม", "ก้าวหน้า", "สดใส",
    "เปี่ยมสุข", "ทวีผล", "สมบูรณ์", "มีสุข", "เจริญใจ", "เกษมสุข"
]

CHANNELS = ["โทรศัพท์", "สาขา", "ดิจิทัล"]
PRODUCTS_POOL = ["บัญชีออมทรัพย์", "เงินฝากประจำ", "กองทุนรวม", "หุ้นกู้", "สินเชื่อบ้าน"]
POLICY_TYPES = ["ประกันชีวิต", "ประกันสุขภาพ", "ประกันคุ้มครอง"]


def generate_customer(idx: int) -> dict:
    first = random.choice(THAI_FIRST_NAMES)
    last = random.choice(THAI_LAST_NAMES)
    full_name = f"{first} {last}"
    external_ref = f"KS-{idx:05d}"

    days_to_renewal = random.randint(1, 500)
    days_since_last_contact = random.randint(0, 600)
    payment_ok = random.random() > 0.15  # 85% pay on time
    kyc_completeness = round(random.uniform(0.4, 1.0), 2)
    num_active_policies = random.randint(1, 4)
    num_financial_products = random.randint(1, 4)
    has_active_loan = int(random.random() > 0.45)
    transaction_recency_days = random.randint(1, 180)
    crm_engagement_score = round(random.uniform(0.1, 1.0), 2)
    customer_tenure_years = round(random.uniform(0.5, 15.0), 1)

    # Business-rule target label: 1 = needs_attention in next 30 days
    # Weighted scoring for generating a realistic label
    attention_score = (
        max(0, (90 - days_to_renewal) / 90) * 0.4
        + min(1, days_since_last_contact / 365) * 0.3
        + (1 - kyc_completeness) * 0.1
        + (0 if payment_ok else 1) * 0.2
    )
    needs_attention = int(attention_score + random.gauss(0, 0.15) > 0.45)

    return {
        "external_ref": external_ref,
        "full_name": full_name,
        "kyc_channel": random.choice(CHANNELS),
        "kyc_completeness_score": kyc_completeness,
        "days_to_renewal": days_to_renewal,
        "days_since_last_contact": days_since_last_contact,
        "payment_status_code": int(payment_ok),
        "num_active_policies": num_active_policies,
        "num_financial_products": num_financial_products,
        "has_active_loan": has_active_loan,
        "transaction_recency_days": transaction_recency_days,
        "crm_engagement_score": crm_engagement_score,
        "customer_tenure_years": customer_tenure_years,
        "needs_attention": needs_attention,
    }


def main():
    n = int(os.getenv("SYNTHETIC_CUSTOMER_COUNT", "500"))
    print(f"Generating {n} synthetic customers...")
    records = [generate_customer(i + 1) for i in range(n)]
    df = pd.DataFrame(records)

    out_path = ARTIFACTS_DIR / "synthetic_customers.csv"
    df.to_csv(out_path, index=False)
    print(f"✓ Saved {len(df)} customers to {out_path}")
    print(f"  Label distribution: {df['needs_attention'].value_counts().to_dict()}")


if __name__ == "__main__":
    main()
