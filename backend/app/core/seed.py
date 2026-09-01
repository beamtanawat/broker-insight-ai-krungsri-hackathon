"""
Database seed script for Phase 2.
Populates 15 tables with realistic synthetic data:
- Roles & Users (Bcrypt hashed)
- Products catalog
- 250 Synthetic customers spanning all requested scenarios:
  * High / Medium / Low priority
  * Overdue follow-up & recent contact
  * Strong customer relationship tiers (Platinum, Gold, Standard)
  * Existing insurance vs No insurance
  * Protection gap scenarios (e.g. active mortgage without life coverage)
- Profiles, Financials, Policies, Needs, AI Scores, Insights, Recommendations, Decisions, Follow-ups, Audit logs
All data is fictional and for demonstration only.
"""
import asyncio
import random
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User
from app.models.customer import Customer, CustomerProfile
from app.models.financial import FinancialProfile
from app.models.insurance import InsurancePolicy
from app.models.interaction import CustomerInteraction
from app.models.ai_score import AIScore
from app.models.insight import AIInsight
from app.models.customer_need import CustomerNeed
from app.models.product import Product
from app.models.recommendation import Recommendation
from app.models.broker_decision import BrokerDecision
from app.models.followup import FollowUp
from app.models.audit_log import AuditLog

SEED_RANDOM = 42
random.seed(SEED_RANDOM)

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

OCCUPATIONS = [
    "ผู้บริหารระดับกลาง", "เจ้าของธุรกิจส่วนตัว", "แพทย์/บุคลากรทางการแพทย์",
    "วิศวกรซอฟต์แวร์", "ข้าราชการบำนาญ", "พนักงานบริษัทเอกชน", "อาจารย์มหาวิทยาลัย",
    "ผู้ประกอบการ SME", "สถาปนิก", "นักบัญชี", "ที่ปรึกษาการเงิน"
]

INCOME_RANGES = [
    "30,000 - 50,000 บาท/เดือน",
    "50,001 - 100,000 บาท/เดือน",
    "100,001 - 200,000 บาท/เดือน",
    "มากกว่า 200,000 บาท/เดือน"
]

PRODUCTS_CATALOG = [
    {
        "product_code": "KRUNGSRI-LIFE-01",
        "product_name": "กรุงศรี ไลฟ์ พลัส (Krungsri Life Plus)",
        "category": "Life",
        "description": "ประกันชีวิตคุ้มครองตลอดชีพ พร้อมสิทธิประโยชน์ลดหย่อนภาษี",
        "min_coverage": 500000.0,
        "max_coverage": 10000000.0,
    },
    {
        "product_code": "KRUNGSRI-HEALTH-MAX",
        "product_name": "กรุงศรี เฮลท์ แม็กซ์ (Krungsri Health Max)",
        "category": "Health",
        "description": "ประกันสุขภาพเหมาจ่าย ครอบคลุมผู้ป่วยในและผู้ป่วยนอก สูงสุด 5 ล้านบาท/ปี",
        "min_coverage": 1000000.0,
        "max_coverage": 5000000.0,
    },
    {
        "product_code": "KRUNGSRI-CI-PROTECT",
        "product_name": "กรุงศรี คุ้มครองโรคร้ายแรง (Critical Illness Shield)",
        "category": "Protection",
        "description": "คุ้มครอง 50 โรคร้ายแรง ตรวจพบรับเงินก้อนทันที",
        "min_coverage": 500000.0,
        "max_coverage": 3000000.0,
    },
    {
        "product_code": "KRUNGSRI-RETIRE-SMART",
        "product_name": "กรุงศรี บำนาญสุขใจ (Krungsri Smart Pension)",
        "category": "Retirement",
        "description": "ประกันบำนาญ คืนเงินบำนาญสม่ำเสมอตั้งแต่อายุ 60 ถึง 85 ปี",
        "min_coverage": 300000.0,
        "max_coverage": 5000000.0,
    },
    {
        "product_code": "KRUNGSRI-SAVINGS-10-5",
        "product_name": "กรุงศรี สะสมทรัพย์ 10/5",
        "category": "Savings",
        "description": "ชำระเบี้ย 5 ปี คุ้มครอง 10 ปี พร้อมเงินคืนทุกปี",
        "min_coverage": 100000.0,
        "max_coverage": 2000000.0,
    },
    {
        "product_code": "KRUNGSRI-MORTGAGE-PROT",
        "product_name": "กรุงศรี คุ้มครองวงเงินสินเชื่อบ้าน (MRTA)",
        "category": "Protection",
        "description": "ประกันชีวิตคุ้มครองภาระหนี้บ้าน หมดกังวลเรื่องภาระต่อครอบครัว",
        "min_coverage": 1000000.0,
        "max_coverage": 20000000.0,
    },
]


async def seed_database(num_customers: int = 250):
    print(f"=== Starting Phase 2 Database Seeding ({num_customers} synthetic customers) ===")
    
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        existing_cust = await db.execute(select(func.count(Customer.id)))
        if (existing_cust.scalar_one() or 0) >= 50:
            print("Database already contains seeded customers. Skipping duplicate seed.")
            return

        # 1. Seed Roles
        print("1. Seeding Roles...")
        roles_data = [
            ("admin", "System Administrator with full access"),
            ("manager", "Branch / Team Manager overseeing brokers"),
            ("broker", "Insurance & Financial Broker"),
            ("analyst", "Read-only analytics and audit reviewer"),
        ]
        roles = {}
        for name, desc in roles_data:
            role = Role(name=name, description=desc)
            db.add(role)
            roles[name] = role
        await db.flush()

        # 2. Seed Users
        print("2. Seeding Users...")
        users_data = [
            ("broker@demo.local", "สมชาย นายหน้า (หลัก)", "broker"),
            ("broker1@demo.local", "สมชาย นายหน้า", "broker"),
            ("broker2@demo.local", "สุดา วิสาหกิจ", "broker"),
            ("manager@demo.local", "วิชัย ผู้จัดการ (หลัก)", "manager"),
            ("manager1@demo.local", "วิชัย ผู้จัดการ", "manager"),
            ("admin@demo.local", "ระบบ ผู้ดูแล", "admin"),
        ]
        users = []
        for email, name, role_name in users_data:
            u = User(
                email=email,
                hashed_password=hash_password("demo1234"),
                full_name=name,
                role=role_name,
                role_id=roles[role_name].id,
                is_active=True,
            )
            db.add(u)
            users.append(u)
        await db.flush()
        broker_users = [u for u in users if u.role == "broker"]

        # 3. Seed Products
        print("3. Seeding Products Catalog...")
        products = []
        for p in PRODUCTS_CATALOG:
            prod = Product(
                product_code=p["product_code"],
                product_name=p["product_name"],
                category=p["category"],
                description=p["description"],
                min_coverage=p["min_coverage"],
                max_coverage=p["max_coverage"],
                is_active=True,
            )
            db.add(prod)
            products.append(prod)
        await db.flush()

        # 4. Seed Customers with Varied Scenarios
        print(f"4. Seeding {num_customers} Customers with full scenario coverage...")
        today = date.today()

        for idx in range(1, num_customers + 1):
            first = random.choice(THAI_FIRST_NAMES)
            last = random.choice(THAI_LAST_NAMES)
            full = f"{first} {last}"
            ext_ref = f"KS-{idx:05d}"
            broker = random.choice(broker_users)

            customer = Customer(
                external_ref=ext_ref,
                first_name=first,
                last_name=last,
                full_name=full,
                assigned_broker_id=broker.id,
            )
            db.add(customer)
            await db.flush()

            # Deterministic Pilot Scenario mapping for KS-00001 to KS-00008
            if idx == 1:  # Scenario A: High Priority Customer
                kyc_stat = "verified"
                tier = "Platinum"
                score_num = 92
                priority_lv = "high"
                days_renewal = 14
                days_last_contact = 75
                pay_stat = "paid"
                has_ins = True
                has_gap = False
                age_val = 42
            elif idx == 2:  # Scenario B: Medium Priority Customer
                kyc_stat = "verified"
                tier = "Gold"
                score_num = 58
                priority_lv = "medium"
                days_renewal = 65
                days_last_contact = 45
                pay_stat = "paid"
                has_ins = True
                has_gap = False
                age_val = 36
            elif idx == 3:  # Scenario C: Low Priority Customer
                kyc_stat = "verified"
                tier = "Standard"
                score_num = 22
                priority_lv = "low"
                days_renewal = 280
                days_last_contact = 7
                pay_stat = "paid"
                has_ins = True
                has_gap = False
                age_val = 29
            elif idx == 4:  # Scenario D: Protection Gap (Mortgage Loan 5.5M vs low coverage)
                kyc_stat = "verified"
                tier = "Gold"
                score_num = 88
                priority_lv = "high"
                days_renewal = 120
                days_last_contact = 90
                pay_stat = "paid"
                has_ins = True
                has_gap = True
                age_val = 38
            elif idx == 5:  # Scenario E: Existing Coverage Review (3 policies, retirement review)
                kyc_stat = "verified"
                tier = "Platinum"
                score_num = 76
                priority_lv = "high"
                days_renewal = 25
                days_last_contact = 60
                pay_stat = "paid"
                has_ins = True
                has_gap = False
                age_val = 52
            elif idx == 6:  # Scenario F: Missing Customer Info (KYC Pending)
                kyc_stat = "pending"
                tier = "Standard"
                score_num = 48
                priority_lv = "medium"
                days_renewal = 180
                days_last_contact = 110
                pay_stat = "paid"
                has_ins = False
                has_gap = False
                age_val = 31
            elif idx == 7:  # Scenario G: LLM Fallback Demonstration
                kyc_stat = "verified"
                tier = "Gold"
                score_num = 82
                priority_lv = "high"
                days_renewal = 20
                days_last_contact = 80
                pay_stat = "paid"
                has_ins = True
                has_gap = False
                age_val = 45
            elif idx == 8:  # Scenario H: Ineligible Product Gating (Senior age 68)
                kyc_stat = "verified"
                tier = "Standard"
                score_num = 50
                priority_lv = "medium"
                days_renewal = 200
                days_last_contact = 50
                pay_stat = "paid"
                has_ins = True
                has_gap = False
                age_val = 68
            else:
                # Rotating scenario assignment for remaining customers
                scenario_seed = idx % 5
                age_val = random.randint(26, 62)
                if scenario_seed == 0:  # High Priority / Upcoming renewal
                    kyc_stat = "verified"
                    tier = random.choice(["Platinum", "Gold"])
                    score_num = random.randint(75, 96)
                    priority_lv = "high"
                    days_renewal = random.randint(5, 28)
                    days_last_contact = random.randint(45, 180)
                    pay_stat = "paid"
                    has_ins = True
                    has_gap = False
                elif scenario_seed == 1:  # High Priority / Overdue follow-up
                    kyc_stat = "verified"
                    tier = "Gold"
                    score_num = random.randint(70, 92)
                    priority_lv = "high"
                    days_renewal = random.randint(15, 60)
                    days_last_contact = random.randint(90, 300)
                    pay_stat = "overdue"
                    has_ins = True
                    has_gap = True
                elif scenario_seed == 2:  # Medium Priority / KYC Pending
                    kyc_stat = "pending"
                    tier = "Standard"
                    score_num = random.randint(40, 68)
                    priority_lv = "medium"
                    days_renewal = random.randint(60, 150)
                    days_last_contact = random.randint(30, 90)
                    pay_stat = "paid"
                    has_ins = True
                    has_gap = False
                elif scenario_seed == 3:  # Low Priority / Recent contact & stable
                    kyc_stat = "verified"
                    tier = random.choice(["Gold", "Standard"])
                    score_num = random.randint(15, 35)
                    priority_lv = "low"
                    days_renewal = random.randint(180, 400)
                    days_last_contact = random.randint(5, 25)
                    pay_stat = "paid"
                    has_ins = True
                    has_gap = False
                else:  # Protection Gap / No Insurance
                    kyc_stat = random.choice(["verified", "pending"])
                    tier = "Standard"
                    score_num = random.randint(60, 85)
                    priority_lv = "high" if random.random() > 0.4 else "medium"
                    days_renewal = 365
                    days_last_contact = random.randint(60, 200)
                    pay_stat = "paid"
                    has_ins = False
                    has_gap = True

            # Customer Profile
            prof = CustomerProfile(
                customer_id=customer.id,
                age=age_val,
                gender=random.choice(["ชาย", "หญิง"]),
                occupation=random.choice(OCCUPATIONS),
                income_range=random.choice(INCOME_RANGES),
                kyc_status=kyc_stat,
                kyc_channel=random.choice(["สาขา", "ดิจิทัล", "โทรศัพท์", "Line"]),
                risk_tolerance=random.choice(["ระมัดระวัง (Low)", "ปานกลาง (Moderate)", "รับความเสี่ยงได้สูง (High)"]),
                relationship_tier=tier,
            )
            db.add(prof)

            # Financial Profile
            assets = round(random.uniform(200000, 15000000), -3)
            has_loan = has_gap or (random.random() > 0.5)
            liabilities = round(random.uniform(500000, 8000000), -3) if has_loan else 0.0
            fin = FinancialProfile(
                customer_id=customer.id,
                total_assets=assets,
                total_liabilities=liabilities,
                monthly_savings=round(random.uniform(5000, 100000), -2),
                has_active_loan=has_loan,
                loan_details="สินเชื่อบ้านเพื่อที่อยู่อาศัย" if has_loan else None,
                products_held=["บัญชีออมทรัพย์กรุงศรี", "เงินฝากประจำ"] if assets > 1000000 else ["บัญชีออมทรัพย์กรุงศรี"],
                transaction_frequency_90d=random.randint(5, 48),
                last_financial_activity=today - timedelta(days=random.randint(1, 45)),
            )
            db.add(fin)

            # Insurance Policies
            if has_ins:
                num_pol = random.randint(1, 3)
                for p_idx in range(num_pol):
                    pol_type = ["ประกันชีวิต", "ประกันสุขภาพ", "ประกันอุบัติเหตุ", "ประกันสะสมทรัพย์"][p_idx % 4]
                    cov = round(random.uniform(300000, 5000000), -3)
                    prem = round(cov * 0.03, -2)
                    ren_date = today + timedelta(days=days_renewal if p_idx == 0 else random.randint(40, 360))
                    pol = InsurancePolicy(
                        customer_id=customer.id,
                        policy_number=f"POL-{ext_ref[-4:]}-{p_idx+1:02d}",
                        policy_type=pol_type,
                        coverage_amount=cov,
                        premium_amount=prem,
                        start_date=ren_date - timedelta(days=365),
                        renewal_date=ren_date,
                        status="Active",
                        payment_status=pay_stat if p_idx == 0 else "paid",
                        remarks="กรมธรรม์มีผลบังคับสมบูรณ์",
                    )
                    db.add(pol)

            # Customer Need
            if has_gap:
                need = CustomerNeed(
                    customer_id=customer.id,
                    need_type="ความคุ้มครองภาระหนี้สิน (Protection Gap)",
                    severity="high",
                    description=f"ลูกค้ามีภาระหนี้สิน {liabilities:,.0f} บาท แต่ยังขาดความคุ้มครองที่ครอบคลุมวงเงินกู้",
                )
                db.add(need)
            elif days_renewal <= 30:
                need = CustomerNeed(
                    customer_id=customer.id,
                    need_type="ต่ออายุกรมธรรม์ประจำปี (Policy Renewal)",
                    severity="high",
                    description=f"กรมธรรม์ใกล้ครบกำหนดต่ออายุในอีก {days_renewal} วัน",
                )
                db.add(need)

            # AI Score
            shap_reasons = [
                {"feature": "days_to_renewal", "value": days_renewal, "impact": 0.28, "label": f"กรมธรรม์ใกล้ครบกำหนดในอีก {days_renewal} วัน"},
                {"feature": "days_since_last_contact", "value": days_last_contact, "impact": 0.21, "label": f"ติดต่อล่าสุดเมื่อ {days_last_contact} วันก่อน"},
                {"feature": "payment_status", "value": 1 if pay_stat == "paid" else 0, "impact": 0.15, "label": "สถานะการชำระเบี้ย"},
                {"feature": "relationship_tier", "value": 1 if tier == "Platinum" else 0, "impact": 0.12, "label": f"ระดับความสัมพันธ์ {tier}"},
            ]
            ai_score = AIScore(
                customer_id=customer.id,
                score=score_num / 100.0,
                score_display=score_num,
                priority_level=priority_lv,
                shap_values={"days_to_renewal": 0.28, "last_contact": 0.21},
                feature_importance=shap_reasons,
                model_version="1.0.0",
                scored_at=datetime.now(timezone.utc),
            )
            db.add(ai_score)
            await db.flush()

            # AI Insight
            insight = AIInsight(
                customer_id=customer.id,
                score_id=ai_score.id,
                insight_summary=f"ลูกค้า {full} ({ext_ref}) มีระดับความสัมพันธ์ {tier} คะแนนความสำคัญ {score_num}/100 แนะนำให้นายหน้าประกันติดตามประเด็นความคุ้มครอง",
                discussion_topics=[
                    "ทบทวนความคุ้มครองของกรมธรรม์ที่มีอยู่",
                    "ตรวจสอบความถูกต้องของข้อมูลผู้รับประโยชน์",
                    "ประเมินความต้องการความคุ้มครองเพิ่มเติมสำหรับครอบครัว",
                ],
                key_observations=[
                    f"สถานะ KYC: {kyc_stat}",
                    f"ภาระสินเชื่อ: {'มีสินเชื่อ' if has_loan else 'ไม่มีสินเชื่อ'}",
                ],
                model_version="gemini-2.0-flash",
                generated_at=datetime.now(timezone.utc),
            )
            db.add(insight)

            # Follow Up
            follow_date = today + timedelta(days=days_renewal) if days_renewal < 30 else today + timedelta(days=14)
            is_overdue = days_last_contact > 90 or pay_stat == "overdue"
            follow = FollowUp(
                customer_id=customer.id,
                broker_id=broker.id,
                scheduled_date=today - timedelta(days=5) if is_overdue else follow_date,
                last_contact_date=today - timedelta(days=days_last_contact),
                follow_up_window="ก่อนช่วงต่ออายุ" if days_renewal < 45 else "รอบทบทวนประจำปี",
                status="open",
                priority=priority_lv,
                payment_status=pay_stat,
                notes=f"บันทึกการติดตามลูกค้า {full}: แนะนำทบทวนสิทธิประโยชน์และตรวจสอบความคุ้มครอง",
            )
            db.add(follow)

            # Customer Interaction history
            interact = CustomerInteraction(
                customer_id=customer.id,
                broker_id=broker.id,
                channel=random.choice(["โทรศัพท์", "สาขา", "Line"]),
                interaction_type="ทบทวนประจำปี",
                notes=f"ติดต่อพูดคุยเบื้องต้น ลูกค้าสะดวกให้ติดต่อผ่าน {broker.full_name}",
                interaction_date=today - timedelta(days=days_last_contact),
            )
            db.add(interact)

            # Recommendation & Decision
            rec_product = random.choice(products)
            rec = Recommendation(
                customer_id=customer.id,
                product_id=rec_product.id,
                rationale=f"สอดคล้องกับโปรไฟล์ความเสี่ยง {prof.risk_tolerance} และเสริมความคุ้มครองส่วนบุคคล",
                priority_rank=1,
                status="proposed",
            )
            db.add(rec)
            await db.flush()

            decision = BrokerDecision(
                customer_id=customer.id,
                broker_id=broker.id,
                recommendation_id=rec.id,
                action_taken="reviewing",
                feedback="เตรียมนำเสนอในรอบการนัดหมายถัดไป",
            )
            db.add(decision)

            if idx % 50 == 0:
                print(f"  ✓ Seeded {idx}/{num_customers} customers...")
                await db.flush()

        # Audit log entry for seeding
        audit = AuditLog(
            user_id=users[0].id,
            action="SEED_DATABASE",
            entity_type="SYSTEM",
            entity_id="ALL",
            metadata_={"num_customers": num_customers, "scenario_count": 5},
            timestamp=datetime.now(timezone.utc),
        )
        db.add(audit)

        await db.commit()
        print(f"=== Successfully seeded {num_customers} synthetic customers and all 15 tables! ===")


if __name__ == "__main__":
    asyncio.run(seed_database(250))
