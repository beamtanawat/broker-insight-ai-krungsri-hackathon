"""Mock internal integrations router — simulates Krungsri internal systems."""
import asyncio
import random
from datetime import date, timedelta

from fastapi import APIRouter

router = APIRouter()


def _random_date_past(days_min=30, days_max=365) -> str:
    delta = random.randint(days_min, days_max)
    return str(date.today() - timedelta(days=delta))


def _random_date_future(days_min=10, days_max=400) -> str:
    delta = random.randint(days_min, days_max)
    return str(date.today() + timedelta(days=delta))


@router.get("/crm/{external_ref}")
async def mock_crm(external_ref: str):
    """Simulate Krungsri CRM contact history."""
    await asyncio.sleep(0.05)  # realistic latency
    random.seed(hash(external_ref) % (2**32))
    channels = ["โทรศัพท์", "สาขา", "ดิจิทัล", "Line"]
    purposes = ["ทบทวนประจำปี", "ตรวจสอบบริการ", "ทบทวนสิทธิประโยชน์", "สอบถามทั่วไป"]
    return {
        "external_ref": external_ref,
        "last_contact_date": _random_date_past(5, 400),
        "contact_channel": random.choice(channels),
        "contact_purpose": random.choice(purposes),
        "engagement_score": round(random.uniform(0.2, 1.0), 2),
        "contact_history": [
            {
                "date": _random_date_past(10, 60),
                "channel": random.choice(channels),
                "purpose": random.choice(purposes),
            }
            for _ in range(random.randint(1, 5))
        ],
    }


@router.get("/kyc/{external_ref}")
async def mock_kyc(external_ref: str):
    """Simulate KYC system."""
    await asyncio.sleep(0.05)
    random.seed((hash(external_ref) + 1) % (2**32))
    statuses = ["verified", "verified", "verified", "pending", "rejected"]
    return {
        "external_ref": external_ref,
        "kyc_status": random.choice(statuses),
        "verified_at": _random_date_past(30, 730),
        "completeness_score": round(random.uniform(0.5, 1.0), 2),
        "missing_documents": random.sample(
            ["สำเนาบัตรประชาชน", "สำเนาทะเบียนบ้าน", "เอกสารรายได้"],
            k=random.randint(0, 2),
        ),
    }


@router.get("/financial/{external_ref}")
async def mock_financial(external_ref: str):
    """Simulate core banking / financial products."""
    await asyncio.sleep(0.07)
    random.seed((hash(external_ref) + 2) % (2**32))
    all_products = ["บัญชีออมทรัพย์", "เงินฝากประจำ", "กองทุนรวม", "หุ้นกู้"]
    loan_types = ["สินเชื่อบ้าน", "สินเชื่อรถยนต์", "สินเชื่อส่วนบุคคล"]
    has_loan = random.random() > 0.4
    return {
        "external_ref": external_ref,
        "products": random.sample(all_products, k=random.randint(1, 3)),
        "savings_balance": round(random.uniform(10000, 2000000), 2),
        "has_active_loan": has_loan,
        "loan_type": random.choice(loan_types) if has_loan else None,
        "loan_outstanding": round(random.uniform(100000, 5000000), 2) if has_loan else 0,
        "loan_status": "อยู่ระหว่างผ่อนชำระตามปกติ" if has_loan else "ไม่มีสินเชื่อที่ใช้งานอยู่",
        "transactions_90d": random.randint(3, 50),
        "last_transaction_days_ago": random.randint(1, 90),
    }


@router.get("/insurance/{external_ref}")
async def mock_insurance(external_ref: str):
    """Simulate insurance policy system."""
    await asyncio.sleep(0.06)
    random.seed((hash(external_ref) + 3) % (2**32))
    policy_types = ["ประกันชีวิต", "ประกันสุขภาพ", "ประกันคุ้มครอง", "ประกันอุบัติเหตุ"]
    num_policies = random.randint(1, 3)
    policies = []
    for i in range(num_policies):
        renewal = _random_date_future(5, 500)
        policies.append({
            "policy_id": f"POL-{external_ref[-4:]}-{i+1:02d}",
            "type": random.choice(policy_types),
            "status": "มีผลบังคับ",
            "renewal_date": renewal,
            "premium_status": random.choice(["ชำระเรียบร้อย", "ชำระเรียบร้อย", "ค้างชำระ"]),
            "coverage_amount": round(random.uniform(200000, 5000000), -3),
        })
    return {
        "external_ref": external_ref,
        "policies": policies,
        "next_renewal_date": min(p["renewal_date"] for p in policies),
        "days_to_next_renewal": random.randint(5, 400),
    }
