"""
Database seed script for Phase 2 and Demo Sandbox.
Populates 15 tables with high-fidelity synthetic demonstration data:
- Roles & Users (Bcrypt hashed)
- Products catalog (Krungsri Insurance products)
- 250 Realistic synthetic customers:
  * Hero Scenarios A to H (KS-00001 to KS-00008) with deterministic UUIDs and names
  * Coherent financial profiles (assets, liabilities, loan details, products held)
  * Realistic insurance policies (authentic Krungsri names, valid premiums, accurate renewals)
  * Natural Thai customer personas across diverse life stages and occupations
  * Advisory-grade AI Insights, discussion topics, and key observations
  * Multi-channel customer interactions (Branch, Phone, Line, Digital)
  * Actionable follow-up pipelines (Due, Overdue, Completed)
  * Broker decisions distribution (Approve, Modify, Reject) for realistic analytics
All data is fictional and for demonstration purposes only.
"""
import asyncio
import random
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, or_

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
from app.models.model_feedback import ModelFeedback
from app.models.pilot import PilotSession, PilotFeedback, PilotIssue

SEED_RANDOM = 42
random.seed(SEED_RANDOM)

# Deterministic UUID mapping for Hero Personas to prevent broken links
DETERMINISTIC_CUSTOMER_UUIDS = {
    "KS-00001": "d82e838c-63fb-47a3-9428-f15dc4d68883",  # ณัฐพร วาริน (Platinum, 14-day renewal)
    "KS-00002": "c0c0f992-b06d-4b9f-bbc6-9b4458a79491",  # ณัฐชา "เพิร์ล" ประเสริฐกิจการ (Gen Z Designer, Health + Motor Anchor)
    "KS-00003": "50193b89-5ff9-48f1-8a52-699716fce8f5",  # ปิยะ โชคดี (Standard, Tech lead, Low priority)
    "KS-00004": "c0a451ce-a2b5-406e-9358-4a2af87721ca",  # วิภา ชัยโย (Gold, 5.5M Mortgage Protection Gap)
    "KS-00005": "f535562e-8f70-4711-bbd0-7e092606cdd7",  # ธนภูมิ ยิ้มแย้ม (Platinum, 14M AUM Smart Pension)
    "KS-00006": "0dd17657-a534-4f57-836c-26d73cc0c2e5",  # วิภา รุ่งเรือง (Standard, KYC Pending Architect)
    "KS-00007": "73684349-2be5-442a-aa25-373938e4a3f2",  # อานนท์ ก้าวหน้า (Gold, LLM Fallback)
    "KS-00008": "0d76a238-a48a-40bd-8ebb-0051fea69f3f",  # ณัฐพร ทวีผล (Senior 68, Hard-Gating)
}

THAI_FIRST_NAMES_MALE = [
    "ธนพล", "ชัชวาล", "กิตติศักดิ์", "ธีรพงศ์", "วรวัฒน์", "อนุชา", "พงศธร", "กิตติพงษ์",
    "ชัยวัฒน์", "ปิยะพงษ์", "อภิสิทธิ์", "ธนกร", "เกียรติศักดิ์", "วรุตม์", "สิทธิชัย",
    "เอกชัย", "ธนดล", "ณัฐพงษ์", "สรวิชญ์", "ชาญชัย", "พงศ์พันธ์", "วัชรพล", "วิศรุต"
]

THAI_FIRST_NAMES_FEMALE = [
    "กัญญารัตน์", "วรัญญา", "ชุติกาญจน์", "ศิริพร", "นภัสสร", "ธัญญารัตน์", "ปรียาภรณ์",
    "วรรณภา", "พิมพกานต์", "สิรินทร์", "มธุรส", "อารียา", "ดวงกมล", "อรพินท์", "กนกพร",
    "สิริยากร", "พิมพ์ชนก", "ชลธิชา", "ทิพวรรณ", "เบญจมาศ", "ปวีณา", "ศุภิสรา", "สุวรรณา"
]

THAI_LAST_NAMES = [
    "เจริญรัตน์", "สิริโชคพาณิชย์", "ตั้งมโนธรรม", "พัฒนาการไกล", "รัตนโสภณ", "กิตติโชติสกุล",
    "พชรสุนทร", "วิริยะกุล", "มหาศาลสมบัติ", "ธนาสิริโรจน์", "ไพศาลสกุลชัย", "วรเวชวิทยา",
    "คงเกษมชัย", "พรรณวิจิตรกุล", "เลิศอนันต์ชัย", "รุ่งเรืองวานิช", "ประเสริฐกิจการ",
    "สุขสมบูรณ์พร", "โชคชัยชาญวิทย์", "ทวีโชควัฒนา", "ศรีรัตนพิบูลย์", "อมรพัฒนกิจ"
]

OCCUPATION_ARCHETYPES = [
    {
        "title": "แพทย์เฉพาะทาง รพ.เอกชนชั้นนำ",
        "income": "มากกว่า 200,000 บาท/เดือน",
        "min_age": 35, "max_age": 55, "tier": "Platinum", "risk": "รับความเสี่ยงได้สูง (High)",
        "assets_range": (8000000, 25000000), "savings_range": (60000, 150000),
        "products_held": ["บัญชีเงินฝากประจำ Krungsri Super Step-Up", "กองทุนรวม Krungsri Global Equity", "บัตรเครดิต Krungsri Exclusive Signature"],
        "need_focus": "Health protection",
    },
    {
        "title": "เจ้าของคลินิกทันตกรรมเอกชน (2 สาขา)",
        "income": "มากกว่า 200,000 บาท/เดือน",
        "min_age": 34, "max_age": 52, "tier": "Platinum", "risk": "ปานกลาง (Moderate)",
        "assets_range": (10000000, 30000000), "savings_range": (80000, 200000),
        "products_held": ["บัญชีกระแสรายวันนิติบุคคล", "สินเชื่อธุรกิจ Krungsri SME", "บัตรเครดิต Krungsri Signature"],
        "need_focus": "Financial protection",
    },
    {
        "title": "Tech Lead / ซอฟต์แวร์สถาปัตย์ บริษัท FinTech",
        "income": "100,001 - 200,000 บาท/เดือน",
        "min_age": 28, "max_age": 42, "tier": "Gold", "risk": "รับความเสี่ยงได้สูง (High)",
        "assets_range": (2500000, 7000000), "savings_range": (40000, 80000),
        "products_held": ["บัญชีออมทรัพย์มีแต่ได้ Krungsri Mee Tae Dai", "กองทุนรวม Krungsri Tech Equity", "บัตรเครดิต Krungsri NOW"],
        "need_focus": "Health protection",
    },
    {
        "title": "กรรมการผู้จัดการ โรงงานผลิตชิ้นส่วนยานยนต์",
        "income": "มากกว่า 200,000 บาท/เดือน",
        "min_age": 45, "max_age": 60, "tier": "Platinum", "risk": "ปานกลาง (Moderate)",
        "assets_range": (15000000, 45000000), "savings_range": (100000, 250000),
        "products_held": ["บัญชีเงินฝากประจำ Krungsri Prime", "สินเชื่อเพื่อธุรกิจขนาดกลาง SME", "บัตรเครดิต Krungsri Exclusive Signature"],
        "need_focus": "Retirement planning",
    },
    {
        "title": "ผู้บริหารฝ่ายการตลาดดิจิทัล บรรษัทข้ามชาติ",
        "income": "100,001 - 200,000 บาท/เดือน",
        "min_age": 32, "max_age": 45, "tier": "Gold", "risk": "ปานกลาง (Moderate)",
        "assets_range": (3000000, 8500000), "savings_range": (35000, 75000),
        "products_held": ["บัญชีออมทรัพย์ Krungsri All Expenses", "กองทุนรวม Krungsri World Equity", "บัตรเครดิต Krungsri Platinum"],
        "need_focus": "Life protection",
    },
    {
        "title": "วิศวกรโครงการระดับอาวุโส (Mega Infrastructure)",
        "income": "50,001 - 100,000 บาท/เดือน",
        "min_age": 30, "max_age": 48, "tier": "Standard", "risk": "ปานกลาง (Moderate)",
        "assets_range": (1200000, 4000000), "savings_range": (20000, 45000),
        "products_held": ["บัญชีเงินเดือน Krungsri Payroll", "สินเชื่อบ้านกรุงศรี โฮมเรดดี้", "บัตรเครดิต Krungsri Platinum"],
        "need_focus": "Financial protection",
    },
    {
        "title": "เภสัชกรและเจ้าของร้านยาชุมชนคุณภาพ",
        "income": "50,001 - 100,000 บาท/เดือน",
        "min_age": 29, "max_age": 50, "tier": "Standard", "risk": "ระมัดระวัง (Low)",
        "assets_range": (1500000, 5000000), "savings_range": (25000, 50000),
        "products_held": ["บัญชีออมทรัพย์ Krungsri", "สินเชื่อพาณิชย์ร้านค้า Krungsri Merchant", "บัตรเดบิตกรุงศรี"],
        "need_focus": "Coverage review",
    },
    {
        "title": "สถาปนิกและผู้ร่วมก่อตั้ง Design Studio อิสระ",
        "income": "50,001 - 100,000 บาท/เดือน",
        "min_age": 27, "max_age": 40, "tier": "Standard", "risk": "ปานกลาง (Moderate)",
        "assets_range": (800000, 2500000), "savings_range": (15000, 35000),
        "products_held": ["บัญชีออมทรัพย์มีแต่ได้ Krungsri Mee Tae Dai", "บัตรเครดิต Krungsri Boarding Card"],
        "need_focus": "Coverage review",
    },
    {
        "title": "อาจารย์มหาวิทยาลัยระดับรองศาสตราจารย์",
        "income": "100,001 - 200,000 บาท/เดือน",
        "min_age": 48, "max_age": 62, "tier": "Gold", "risk": "ระมัดระวัง (Low)",
        "assets_range": (5000000, 16000000), "savings_range": (40000, 85000),
        "products_held": ["บัญชีเงินฝากประจำ Krungsri Step Up", "กองทุนรวม Krungsri Fixed Income", "บัตรเครดิต Krungsri Signature"],
        "need_focus": "Retirement planning",
    },
    {
        "title": "นักบินพาณิชย์ สายการบินระหว่างประเทศ",
        "income": "มากกว่า 200,000 บาท/เดือน",
        "min_age": 33, "max_age": 50, "tier": "Platinum", "risk": "รับความเสี่ยงได้สูง (High)",
        "assets_range": (7000000, 22000000), "savings_range": (70000, 160000),
        "products_held": ["บัญชีเงินฝากเงินตราต่างประเทศ FCD Krungsri", "กองทุนรวม Krungsri Global Core", "บัตรเครดิต Krungsri Exclusive"],
        "need_focus": "Health protection",
    },
]

PRODUCTS_CATALOG = [
    {
        "product_code": "KRUNGSRI-LIFE-01",
        "product_name": "กรุงศรี ไลฟ์ พลัส 90/20 (Krungsri Life Plus)",
        "category": "Life",
        "description": "ประกันชีวิตคุ้มครองตลอดชีพถึงอายุ 90 ปี ชำระเบี้ย 20 ปี พร้อมสิทธิประโยชน์ลดหย่อนภาษีสูงสุด 100,000 บาท",
        "min_coverage": 500000.0,
        "max_coverage": 15000000.0,
    },
    {
        "product_code": "KRUNGSRI-HEALTH-MAX",
        "product_name": "กรุงศรี เฮลท์ แม็กซ์ เหมาจ่าย (Krungsri Health Max)",
        "category": "Health",
        "description": "ประกันสุขภาพเหมาจ่ายค่ารักษาพยาบาล ครอบคลุมผู้ป่วยใน (IPD) และผู้ป่วยนอก (OPD) สูงสุด 5 ล้านบาท/ปี ไม่จำกัดวงเงินต่อครั้ง",
        "min_coverage": 1000000.0,
        "max_coverage": 5000000.0,
    },
    {
        "product_code": "KRUNGSRI-CI-PROTECT",
        "product_name": "กรุงศรี คุ้มครองโรคร้ายแรง (Critical Illness Shield)",
        "category": "Protection",
        "description": "คุ้มครองครอบคลุม 50 โรคร้ายแรงทุกระยะ ตรวจพบรับเงินก้อนทันที 100% ของทุนประกันเพื่อใช้รักษาตัวและดูแลครอบครัว",
        "min_coverage": 500000.0,
        "max_coverage": 5000000.0,
    },
    {
        "product_code": "KRUNGSRI-RETIRE-SMART",
        "product_name": "กรุงศรี บำนาญสุขใจ (Krungsri Smart Pension 85/60)",
        "category": "Retirement",
        "description": "ประกันบำนาญการันตีเงินคืนสม่ำเสมอปีละ 15-24% ตั้งแต่อายุ 60 ถึง 85 ปี พร้อมสิทธิลดหย่อนภาษีสูงสุด 200,000 บาท",
        "min_coverage": 300000.0,
        "max_coverage": 10000000.0,
    },
    {
        "product_code": "KRUNGSRI-SAVINGS-10-5",
        "product_name": "กรุงศรี สะสมทรัพย์ 10/5 รีเทิร์นพลัส",
        "category": "Savings",
        "description": "ชำระเบี้ยสั้นเพียง 5 ปี คุ้มครองยาวนาน 10 ปี รับเงินคืนทุกสิ้นปีกรมธรรม์ ผลตอบแทนแน่นอน ไม่ผันผวนตามสภาวะตลาด",
        "min_coverage": 100000.0,
        "max_coverage": 3000000.0,
    },
    {
        "product_code": "KRUNGSRI-MORTGAGE-PROT",
        "product_name": "กรุงศรี คุ้มครองวงเงินสินเชื่อบ้าน (Krungsri MRTA)",
        "category": "Protection",
        "description": "ประกันชีวิตคุ้มครองภาระหนี้บ้านและสินเชื่อที่อยู่อาศัย ปลดเปลื้องภาระครอบครัวหากเกิดเหตุไม่คาดฝัน ทุนประกันสอดคล้องกับยอดหนี้",
        "min_coverage": 1000000.0,
        "max_coverage": 25000000.0,
    },
    {
        "product_code": "KRUNGSRI-MOTOR-01",
        "product_name": "กรุงศรี มอเตอร์ แคร์ ชั้น 1 (Krungsri Motor Care)",
        "category": "Motor",
        "description": "ประกันภัยรถยนต์ชั้น 1 คุ้มครองครอบคลุมชน สูญหาย ไฟไหม้ น้ำท่วม พร้อมบริการช่วยเหลือฉุกเฉิน 24 ชั่วโมง ซ่อมอู่/ศูนย์มาตรฐาน",
        "min_coverage": 300000.0,
        "max_coverage": 1500000.0,
    },
]

BRANCHES_LIST = [
    "สาขาสยามพารากอน", "สาขาสำนักเพลินจิต", "สาขาสาทร", "สาขาเอ็มควอเทียร์",
    "สาขาเซ็นทรัลเวิลด์", "สาขาเซ็นทรัลลาดพร้าว", "สาขาอารีย์", "สาขาทองหล่อ",
    "สาขาไอคอนสยาม", "สาขาเดอะมอลล์บางกะปิ", "สาขาฟิวเจอร์พาร์ครังสิต", "สาขาเชียงใหม่ ถ.สุเทพ"
]

BANGKOK_NEIGHBORHOODS = [
    {"district": "วัฒนา", "address_fmt": "ถนนสุขุมวิท ซอย 39 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร 10110", "lat": 13.7345, "lng": 100.5702, "post": "10110"},
    {"district": "บางรัก", "address_fmt": "ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500", "lat": 13.7262, "lng": 100.5312, "post": "10500"},
    {"district": "สาทร", "address_fmt": "ถนนสาทรใต้ แขวงยานนาวา เขตสาทร กรุงเทพมหานคร 10120", "lat": 13.7198, "lng": 100.5345, "post": "10120"},
    {"district": "ยานนาวา", "address_fmt": "ถนนพระรามที่ 3 แขวงช่องนนทรี เขตยานนาวา กรุงเทพมหานคร 10120", "lat": 13.6952, "lng": 100.5428, "post": "10120"},
    {"district": "พญาไท", "address_fmt": "ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพมหานคร 10400", "lat": 13.7782, "lng": 100.5435, "post": "10400"},
    {"district": "ปทุมวัน", "address_fmt": "ถนนพระรามที่ 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330", "lat": 13.7465, "lng": 100.5338, "post": "10330"},
    {"district": "จตุจักร", "address_fmt": "ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900", "lat": 13.8164, "lng": 100.5614, "post": "10900"},
    {"district": "บางนา", "address_fmt": "ถนนบางนา-ตราด แขวงบางนาใต้ เขตบางนา กรุงเทพมหานคร 10260", "lat": 13.6654, "lng": 100.6241, "post": "10260"},
    {"district": "ห้วยขวาง", "address_fmt": "ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310", "lat": 13.7765, "lng": 100.5732, "post": "10310"},
    {"district": "คลองเตย", "address_fmt": "ถนนพระรามที่ 4 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110", "lat": 13.7156, "lng": 100.5601, "post": "10110"},
]


async def seed_database(num_customers: int = 250, force_reseed: bool = False):
    """
    Seeds database with authentic, cohesive, and comprehensive demonstration records.
    If force_reseed is True, cleanly wipes all existing transactional and customer tables.
    """
    print(f"=== Starting Database Seeding ({num_customers} high-fidelity synthetic customers, force_reseed={force_reseed}) ===")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        existing_cust = await db.execute(select(func.count(Customer.id)))
        existing_count = existing_cust.scalar_one() or 0

        if not force_reseed and existing_count >= 50:
            print(f"Database already contains {existing_count} customers. Skipping duplicate seed.")
            return

        if force_reseed:
            print("Force reseed enabled: Purging existing demonstration data in clean foreign key order...")
            await db.execute(delete(PilotIssue))
            await db.execute(delete(PilotFeedback))
            await db.execute(delete(PilotSession))
            await db.execute(delete(ModelFeedback))
            await db.execute(delete(AuditLog))
            await db.execute(delete(BrokerDecision))
            await db.execute(delete(Recommendation))
            await db.execute(delete(CustomerInteraction))
            await db.execute(delete(FollowUp))
            await db.execute(delete(AIInsight))
            await db.execute(delete(AIScore))
            await db.execute(delete(CustomerNeed))
            await db.execute(delete(InsurancePolicy))
            await db.execute(delete(FinancialProfile))
            await db.execute(delete(CustomerProfile))
            await db.execute(delete(Customer))
            await db.execute(delete(Product))
            await db.execute(delete(User))
            await db.execute(delete(Role))
            await db.commit()
            print("✓ Successfully purged previous records.")

        # 1. Seed Roles
        print("1. Seeding Enterprise Roles...")
        roles_data = [
            ("admin", "System Administrator with governance and pilot audit access"),
            ("manager", "Branch / Cluster Manager overseeing broker portfolios and approvals"),
            ("broker", "Licensed Insurance & Wealth Advisory Broker"),
            ("analyst", "Read-only analytics and audit compliance reviewer"),
        ]
        roles = {}
        for name, desc in roles_data:
            role = Role(name=name, description=desc)
            db.add(role)
            roles[name] = role
        await db.flush()

        # 2. Seed Users
        print("2. Seeding Users (Password: demo1234)...")
        users_data = [
            ("broker@demo.local", "สมชาย นายหน้า (หลัก)", "broker"),
            ("broker1@demo.local", "ธนพล ที่ปรึกษาการเงิน", "broker"),
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
        main_broker = users[0]
        broker_users = [u for u in users if u.role == "broker"]

        # 3. Seed Products
        print("3. Seeding Krungsri Products Catalog...")
        product_obj_map = {}
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
            product_obj_map[p["product_code"]] = prod
        await db.flush()

        today = date.today()

        # 4. Seed Customers
        print(f"4. Generating {num_customers} Coherent, Advisory-Grade Thai Customer Records...")

        for idx in range(1, num_customers + 1):
            ext_ref = f"KS-{idx:05d}"
            assigned_broker = main_broker

            addr_val = None
            dist_val = None
            prov_val = "กรุงเทพมหานคร"
            post_val = None
            lat_val = None
            lng_val = None

            # -------------------------------------------------------------
            # SEED HERO PERSONAS (KS-00001 through KS-00008)
            # -------------------------------------------------------------
            if idx == 1:
                # Scenario A: High Priority Renewal (14 days) + CI Gap
                cust_id = DETERMINISTIC_CUSTOMER_UUIDS[ext_ref]
                first_name, last_name = "ณัฐพร", "วาริน"
                gender = "หญิง"
                age_val = 42
                occupation = "กรรมการผู้จัดการ บจก.เมดิเทค อินโนเวชั่น (นำเข้าเครื่องมือแพทย์)"
                income_range = "มากกว่า 200,000 บาท/เดือน"
                tier = "Platinum"
                kyc_stat = "verified"
                kyc_chan = "สาขาสยามพารากอน"
                risk_tol = "รับความเสี่ยงได้สูง (High)"
                score_num = 92
                priority_lv = "high"
                days_renewal = 14
                days_last_contact = 75
                pay_stat = "paid"
                addr_val = "99/1 ซอยทองหล่อ 10 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร 10110"
                dist_val = "วัฒนา"
                post_val = "10110"
                lat_val = 13.7314
                lng_val = 100.5815

                assets = 18500000.0
                liabilities = 6200000.0
                monthly_savings = 120000.0
                has_loan = True
                loan_desc = "สินเชื่อเพื่อธุรกิจขยายสาขา Krungsri SME Loan (วงเงิน 6.2 ล้านบาท)"
                prods_held = [
                    "บัญชีเงินฝากประจำ Krungsri Super Step-Up",
                    "กองทุนรวม Krungsri Global Equity (KF-GLOBE)",
                    "บัตรเครดิต Krungsri Exclusive Signature",
                    "สินเชื่อธุรกิจ Krungsri SME",
                ]

                policies_data = [
                    {
                        "code": "KRUNGSRI-HEALTH-MAX",
                        "name": "กรุงศรี เฮลท์ แม็กซ์ เหมาจ่าย (Health Max 5M)",
                        "type": "Health protection (ประกันสุขภาพ)",
                        "coverage": 5000000.0,
                        "premium": 48500.0,
                        "days_left": 14,
                        "pay_status": "paid",
                        "remarks": "ชำระเบี้ยตรงเวลาต่อเนื่อง 4 ปีผ่าน Direct Debit บัญชีเงินฝากกรุงศรี ประวัติเคลมต่ำ",
                    },
                    {
                        "code": "KRUNGSRI-LIFE-01",
                        "name": "กรุงศรี ไลฟ์ พลัส 90/20 (Life Plus)",
                        "type": "Life protection (ประกันชีวิต)",
                        "coverage": 3000000.0,
                        "premium": 65000.0,
                        "days_left": 210,
                        "pay_status": "paid",
                        "remarks": "กรมธรรม์มีผลบังคับสมบูรณ์ ใช้สิทธิลดหย่อนภาษีเงินได้บุคคลธรรมดาเต็มจำนวน",
                    },
                ]

                needs_data = [
                    (
                        "Coverage review (การทบทวนและต่ออายุกรมธรรม์)",
                        "high",
                        "กรมธรรม์สุขภาพ Krungsri Health Max (5 ล้านบาท) มีกำหนดต่ออายุในอีก 14 วัน เป็นโอกาสสำคัญในการยืนยันสิทธิและอัปเกรดความคุ้มครอง",
                    ),
                    (
                        "Health protection (ความคุ้มครองสุขภาพและโรคร้ายแรง)",
                        "high",
                        "พอร์ตปัจจุบันยังขาดความคุ้มครองโรคร้ายแรงระยะวิกฤต (Critical Illness Shield) ตรวจพบรับเงินก้อนเพื่อปกป้องสภาพคล่องของธุรกิจและครอบครัว",
                    ),
                ]

                shap_reasons = [
                    {"feature": "days_to_renewal", "value": 14, "impact": 0.35, "label": "กรมธรรม์สุขภาพ Krungsri Health Max ครบกำหนดต่ออายุใน 14 วัน"},
                    {"feature": "relationship_tier", "value": 1, "impact": 0.26, "label": "ลูกค้าระดับมั่งคั่งสูง (Platinum Tier · AUM 18.5 ล้านบาท)"},
                    {"feature": "days_since_last_contact", "value": 75, "impact": 0.18, "label": "ไม่ได้ติดต่อทบทวนพอร์ตโฟลิโอนานเกิน 75 วัน"},
                    {"feature": "payment_status", "value": 1, "impact": 0.13, "label": "ประวัติการชำระเบี้ยสมบูรณ์แบบ วินัยทางการเงินดีเยี่ยม"},
                ]

                insight_summary = (
                    "คุณณัฐพร (อายุ 42 ปี, กรรมการผู้จัดการ บจก.เมดิเทค อินโนเวชั่น, Krungsri Platinum) กรมธรรม์ Krungsri Health Max (วงเงิน 5 ล้านบาท) "
                    "มีกำหนดต่ออายุในอีก 14 วัน ประวัติการชำระเบี้ยดีเด่นต่อเนื่อง 4 ปี จากการวิเคราะห์พอร์ตพบว่าลูกค้ามีสภาพคล่องสูงและยังมีช่องว่างด้าน "
                    "ความคุ้มครองโรคร้ายแรง (Critical Illness Gap) จึงเป็นจังหวะเหมาะสมสูงสุดในการนัดหมายเพื่อยืนยันต่ออายุพร้อมนำเสนอ Krungsri CI Protect (วงเงิน 3 ล้านบาท)"
                )
                discussion_topics = [
                    "ยืนยันความคุ้มครองและอำนวยความสะดวกการตัดบัญชีอัตโนมัติของ Krungsri Health Max รอบต่ออายุ 14 วัน",
                    "มอบสิทธิประโยชน์ตรวจสุขภาพประจำปีระดับ Executive Health Check ของลูกค้า Krungsri Platinum",
                    "นำเสนอแนวคิดการบริหารความเสี่ยงด้วย Krungsri CI Protect คุ้มครอง 50 โรคร้ายแรงวงเงินก้อน 3 ล้านบาท",
                    "วางแผนจัดสรรสิทธิประโยชน์ลดหย่อนภาษีปลายปีวงเงิน 100,000 บาทแรกให้เกิดประโยชน์สูงสุด",
                ]
                key_observations = [
                    "สถานะ KYC: สมบูรณ์ (Verified ผ่านสาขาสยามพารากอน)",
                    "ความมั่งคั่งและสภาพคล่อง: สินทรัพย์รวม 18.5 ล้านบาท มีความสามารถในการออม 120,000 บาท/เดือน",
                    "ความต้องการเร่งด่วน: กรมธรรม์สุขภาพหลักครบกำหนดใน 14 วัน ต้องดำเนินการก่อนสิ้นรอบผ่อนผัน",
                    "ศักยภาพ Cross-sell: สูงมากสำหรับกลุ่มโรคร้ายแรง (CI Shield) และความคุ้มครองวงเงินกู้ธุรกิจ",
                ]
                rec_code = "KRUNGSRI-CI-PROTECT"
                decision_action = "approve"
                decision_feedback = "เห็นชอบกับคำแนะนำ AI นัดหมายพบลูกค้าที่สาขาสยามพารากอนเพื่อส่งมอบเอกสารต่ออายุและเสนอ CI Protect"

            elif idx == 2:
                # Scenario B: Gen Z Hero Persona - ณัฐชา "เพิร์ล" ประเสริฐกิจการ (Health + Motor Anchor)
                cust_id = DETERMINISTIC_CUSTOMER_UUIDS[ext_ref]
                first_name, last_name = "ณัฐชา", "ประเสริฐกิจการ"
                gender = "หญิง"
                age_val = 26
                occupation = "Senior UX/UI & Product Designer (Tech Startup / SaaS Platform)"
                income_range = "50,001 - 100,000 บาท/เดือน"
                tier = "Standard"
                kyc_stat = "verified"
                kyc_chan = "ดิจิทัล (Krungsri Mobile App - KMA)"
                risk_tol = "ปานกลาง (Moderate)"
                score_num = 82
                priority_lv = "high"
                days_renewal = 21
                days_last_contact = 14
                pay_stat = "paid"
                addr_val = "88 อาคารสาทรสแควร์ ถนนสาทรเหนือ แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500"
                dist_val = "บางรัก"
                post_val = "10500"
                lat_val = 13.7225
                lng_val = 100.5284

                assets = 850000.0
                liabilities = 0.0
                monthly_savings = 25000.0
                has_loan = False
                loan_desc = "ไม่มีภาระสินเชื่อคงค้าง (Debt-free)"
                prods_held = [
                    "บัญชีเงินเดือน Krungsri Payroll",
                    "บัตรเครดิต Krungsri NOW (สตรีมมิ่ง & ช้อปปิ้งออนไลน์)",
                    "Krungsri Securities (Dime! กองทุนดัชนีต่างประเทศ)",
                ]

                policies_data = [
                    {
                        "code": "KRUNGSRI-MOTOR-01",
                        "name": "กรุงศรี มอเตอร์ แคร์ ชั้น 1 (Honda City e:HEV)",
                        "type": "Motor insurance (ประกันภัยรถยนต์)",
                        "coverage": 650000.0,
                        "premium": 18500.0,
                        "days_left": 21,
                        "pay_status": "paid",
                        "remarks": "ครบกำหนดต่ออายุกรมธรรม์ในอีก 21 วัน (จังหวะเวลาเร่งด่วน: 🔵 Action)",
                    },
                    {
                        "code": "GROUP-HEALTH-CORP",
                        "name": "สวัสดิการประกันสุขภาพกลุ่มบริษัท (Corporate Group Health)",
                        "type": "Health protection (ประกันกลุ่มบริษัท)",
                        "coverage": 50000.0,
                        "premium": 0.0,
                        "days_left": 240,
                        "pay_status": "paid",
                        "remarks": "คุ้มครอง IPD 50,000 บ./ครั้ง, ค่าห้อง 2,500 บ./วัน (มี Gap ส่วนเกินค่ารักษา รพ.เอกชน: 🟡 Review)",
                    },
                ]

                needs_data = [
                    (
                        "Motor protection (ประกันรถยนต์ Honda City ครบกำหนดใน 21 วัน)",
                        "high",
                        "ประกันภัยรถยนต์ชั้น 1 กำลังจะหมดอายุในอีก 21 วัน ต้องการต่ออายุคงส่วนลดประวัติดีและบริการช่วยเหลือฉุกเฉิน: 🔵 Action",
                    ),
                    (
                        "Health protection (ความคุ้มครองสุขภาพส่วนเกินจากประกันกลุ่ม)",
                        "high",
                        "มีสวัสดิการกลุ่มบริษัท IPD 50k แต่ค่ารักษาจริงใน รพ.เอกชนเสี่ยงเกินวงเงิน แนะนำ Top-up เหมาจ่ายหรือคุ้มครองโรคร้ายแรง: 🟡 Review",
                    ),
                    (
                        "Life & Debt protection (ความคุ้มครองชีวิตและภาระหนี้สิน)",
                        "low",
                        "ไม่มีภาระหนี้สินผูกพันระยะยาว สถานะปัจจุบันเพียงพอ ไม่มีความจำเป็นต้องซื้อประกันชีวิตวงเงินสูง: 🟢 No Action",
                    ),
                ]

                shap_reasons = [
                    {"feature": "days_to_motor_renewal", "value": 21, "impact": 0.44, "label": "ประกันภัยรถยนต์ชั้น 1 Honda City ครบกำหนดต่ออายุในอีก 21 วัน (Action Needed)"},
                    {"feature": "group_health_gap", "value": 1, "impact": 0.32, "label": "มีประกันกลุ่มบริษัท IPD 50,000 บ. แต่ขาดความคุ้มครองค่าห้อง/โรคร้ายแรงส่วนเกิน (Review Recommended)"},
                    {"feature": "gen_z_trusted_advisor", "value": 1, "impact": 0.24, "label": "ไม่มีภาระหนี้ ไม่จำเป็นต้องซื้อประกันชีวิตเพิ่ม เน้นความโปร่งใส (No Action on Life)"},
                ]

                insight_summary = (
                    "คุณเพิร์ล ณัฐชา (อายุ 26 ปี, Senior UX/UI Designer, Krungsri Standard) สรุปสถานะ Trusted Advisor: "
                    "(1) 🔵 Action: ประกันรถยนต์ Honda City ครบกำหนดต่ออายุใน 21 วัน ควรนำเสนอข้อเสนอต่ออายุชั้น 1 ซ่อมศูนย์ก่อนสิ้นสุดความคุ้มครอง; "
                    "(2) 🟡 Review: ปัจจุบันใช้ประกันสุขภาพกลุ่มบริษัท (วงเงิน IPD 50k, ค่าห้อง 2.5k) มีช่องว่างส่วนเกินค่ารักษา รพ.เอกชน ควรแนะนำ Top-up หรือ CI Shield; "
                    "(3) 🟢 No Action: ไม่มีภาระหนี้สิน ความคุ้มครองชีวิตปัจจุบันเพียงพอ ยังไม่ต้องซื้อประกันชีวิตเพิ่ม"
                )
                discussion_topics = [
                    "ต่ออายุกรมธรรม์รถยนต์ชั้น 1 Honda City พร้อมเช็กสิทธิส่วนลดประวัติดี 20-30%",
                    "วิเคราะห์ช่องว่างประกันสุขภาพกลุ่มบริษัท (Group Health Gap Analysis) เทียบกับค่ารักษาจริง รพ.เอกชน",
                    "ย้ำจุดยืน Trusted Advisor อย่างจริงใจ: ชี้แจงชัดเจนว่ายังไม่มีภาระหนี้ ไม่จำเป็นต้องซื้อประกันชีวิตราคาแพง",
                ]
                key_observations = [
                    "Gen Z Mindset: ชื่นชอบความโปร่งใส ต้องการคำแนะนำที่จริงใจว่า 'อะไรควรทำ' และ 'อะไรยังไม่ต้องทำ'",
                    "Digital Interaction: เข้ามาตรวจสอบข้อมูลสิทธิของตนเองผ่านหน้า My Protection (Life Event Check-in)",
                    "เหตุผลเร่งด่วน (Why Now?): ต่อประกันรถยนต์ใน 21 วัน และกำลังทบทวนว่าประกันกลุ่มบริษัทพอกับชีวิตจริงหรือไม่",
                ]
                rec_code = "KRUNGSRI-MOTOR-01"
                decision_action = "approve"
                decision_feedback = "อนุมัติประสานงานส่งใบเสนอราคาต่ออายุประกันรถยนต์ชั้น 1 และให้คำแนะนำแบบ Trusted Advisor เรื่องช่องว่างประกันกลุ่ม"

            elif idx == 3:
                # Scenario C: Low Priority (Stable, recently contacted tech lead)
                cust_id = DETERMINISTIC_CUSTOMER_UUIDS[ext_ref]
                first_name, last_name = "ปิยะ", "โชคดี"
                gender = "ชาย"
                age_val = 29
                occupation = "Tech Lead / Senior Software Architect บริษัทสตาร์ทอัพเทคโนโลยี"
                income_range = "100,001 - 200,000 บาท/เดือน"
                tier = "Standard"
                kyc_stat = "verified"
                kyc_chan = "ดิจิทัล (NDID ผ่าน Krungsri Mobile App)"
                risk_tol = "รับความเสี่ยงได้สูง (High)"
                score_num = 22
                priority_lv = "low"
                days_renewal = 280
                days_last_contact = 7
                pay_stat = "paid"

                assets = 2100000.0
                liabilities = 0.0
                monthly_savings = 55000.0
                has_loan = False
                loan_desc = None
                prods_held = ["บัญชีออมทรัพย์มีแต่ได้ Krungsri Mee Tae Dai", "บัตรเครดิต Krungsri NOW"]

                policies_data = [
                    {
                        "code": "KRUNGSRI-HEALTH-MAX",
                        "name": "กรุงศรี เฮลท์ แม็กซ์ (Health Max 2M)",
                        "type": "Health protection (ประกันสุขภาพ)",
                        "coverage": 2000000.0,
                        "premium": 24000.0,
                        "days_left": 280,
                        "pay_status": "paid",
                        "remarks": "เพิ่งต่ออายุกรมธรรม์เรียบร้อยเมื่อ 2 เดือนก่อน ไม่มีประเด็นคั่งค้าง",
                    }
                ]

                needs_data = [
                    (
                        "Wealth accumulation (การสร้างวินัยการออมและการลงทุน)",
                        "low",
                        "ลูกค้าคนรุ่นใหม่ รายได้เติบโตสูง ปลอดภาระหนี้สิน เหมาะสำหรับการส่งมอบความรู้การลงทุนระยะยาว",
                    )
                ]

                shap_reasons = [
                    {"feature": "days_since_last_contact", "value": 7, "impact": -0.32, "label": "ติดต่อพูดคุยล่าสุดเพียง 7 วันที่ผ่านมา (เพิ่งบริการเสร็จสิ้น)"},
                    {"feature": "days_to_renewal", "value": 280, "impact": -0.28, "label": "กรมธรรม์เหลือระยะเวลาคุ้มครองอีกกว่า 280 วัน"},
                    {"feature": "payment_status", "value": 1, "impact": -0.15, "label": "สถานะการเงินคล่องตัว ไม่มีหนี้สินคงค้าง"},
                ]

                insight_summary = (
                    "คุณปิยะ (อายุ 29 ปี, Tech Lead สตาร์ทอัพ, Krungsri Standard) สภาพคล่องทางการเงินแข็งแกร่ง ปลอดหนี้สิน "
                    "เพิ่งได้รับการติดต่อดูแลเมื่อ 7 วันที่แล้ว และกรมธรรม์สุขภาพเพิ่งต่ออายุไป ยังเหลือระยะเวลาอีก 280 วัน "
                    "สถานะปัจจุบันมีความเสี่ยงต่ำมาก ไม่จำเป็นต้องผลักดันการขายในระยะนี้ ควรรักษาสัมพันธ์ผ่านระบบอัตโนมัติ"
                )
                discussion_topics = [
                    "ติดตามความพึงพอใจการใช้งาน Krungsri Mobile App",
                    "ส่งมอบข่าวสารภาพรวมเศรษฐกิจและการลงทุนรายไตรมาส",
                ]
                key_observations = [
                    "สถานะ KYC: สมบูรณ์ (Verified ผ่าน NDID)",
                    "การติดต่อล่าสุด: สัปดาห์ก่อนหน้า ลูกค้าพึงพอใจในบริการอย่างมาก",
                    "ลำดับความสำคัญ AI: ต่ำ (22/100) — ไม่ควรติดต่อซ้ำซ้อนเพื่อป้องกันการรบกวน",
                ]
                rec_code = "KRUNGSRI-HEALTH-MAX"
                decision_action = "modify"
                decision_feedback = "ปรับสถานะเป็นเฝ้าระวังรักษาความสัมพันธ์ ไม่ต้องโทรเร่งรัด ส่งการ์ดอวยพรวันเกิดในไตรมาสถัดไป"

            elif idx == 4:
                # Scenario D: Protection Gap (Mortgage Loan 5.5M vs Low Insurance)
                cust_id = DETERMINISTIC_CUSTOMER_UUIDS[ext_ref]
                first_name, last_name = "วิภา", "ชัยโย"
                gender = "หญิง"
                age_val = 38
                occupation = "ผู้จัดการฝ่ายจัดซื้อ บมจ.พลังงานและเคมีภัณฑ์"
                income_range = "100,001 - 200,000 บาท/เดือน"
                tier = "Gold"
                kyc_stat = "verified"
                kyc_chan = "สาขาสาทร"
                risk_tol = "ปานกลาง (Moderate)"
                score_num = 88
                priority_lv = "high"
                days_renewal = 120
                days_last_contact = 90
                pay_stat = "paid"
                addr_val = "253 ถนนสุขุมวิท 21 (อโศก) แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพมหานคร 10110"
                dist_val = "วัฒนา"
                post_val = "10110"
                lat_val = 13.7372
                lng_val = 100.5621

                assets = 3500000.0
                liabilities = 5500000.0
                monthly_savings = 35000.0
                has_loan = True
                loan_desc = "สินเชื่อบ้านกรุงศรี โฮมเรดดี้ (Krungsri Home Ready) ยอดคงค้าง 5.5 ล้านบาท"
                prods_held = ["บัญชีออมทรัพย์ Krungsri", "สินเชื่อบ้านกรุงศรี โฮมเรดดี้", "บัตรเครดิต Krungsri HomePro Corporate"]

                policies_data = [
                    {
                        "code": "KRUNGSRI-LIFE-01",
                        "name": "กรุงศรี ไลฟ์ พลัส (Life Plus พื้นฐาน)",
                        "type": "Life protection (ประกันชีวิต)",
                        "coverage": 500000.0,
                        "premium": 15000.0,
                        "days_left": 120,
                        "pay_status": "paid",
                        "remarks": "ทุนประกันเดิม 500,000 บาท ไม่เพียงพอต่อภาระหนี้สินเชื่อบ้าน 5.5 ล้านบาท",
                    }
                ]

                needs_data = [
                    (
                        "Financial protection (การคุ้มครองสินเชื่อและภาระหนี้)",
                        "high",
                        "พบช่องว่างความคุ้มครอง (Protection Gap) วงเงิน 5,000,000 บาท ระหว่างภาระหนี้บ้าน 5.5 ล้านบาท กับทุนประกันชีวิตเดิม 500,000 บาท",
                    ),
                    (
                        "Life protection (ความคุ้มครองชีวิตและภาระครอบครัว)",
                        "high",
                        "ลูกค้าเป็นเสาหลักครอบครัว หากเกิดเหตุไม่คาดฝันภาระหนี้บ้านจะตกแก่คู่สมรสและบุตร",
                    ),
                ]

                shap_reasons = [
                    {"feature": "protection_gap_debt", "value": 5000000, "impact": 0.42, "label": "ช่องว่างความคุ้มครองภาระหนี้สินเชื่อบ้าน 5.0 ล้านบาท (MRTA Gap)"},
                    {"feature": "active_loan_balance", "value": 5500000, "impact": 0.25, "label": "มีสินเชื่อบ้านกรุงศรี โฮมเรดดี้ ยอดคงค้าง 5.5 ล้านบาท"},
                    {"feature": "days_since_last_contact", "value": 90, "impact": 0.18, "label": "ไม่ได้ติดต่อแนะนำผลิตภัณฑ์ปกป้องความเสี่ยงนาน 90 วัน"},
                ]

                insight_summary = (
                    "คุณวิภา (อายุ 38 ปี, ผู้จัดการจัดซื้อ, Krungsri Gold) ตรวจพบช่องว่างความคุ้มครองภาระหนี้สินรุนแรง (Protection Gap): "
                    "ลูกค้ามีสินเชื่อบ้านกรุงศรี โฮมเรดดี้ ยอดคงค้าง 5.5 ล้านบาท แต่มีทุนประกันชีวิตเดิมเพียง 500,000 บาท "
                    "ทำให้เกิดความเสี่ยงสูงถึง 5.0 ล้านบาทหากเกิดเหตุไม่คาดคิด แนะนำให้นายหน้านัดหมายนำเสนอ Krungsri MRTA หรือ Krungsri Life Plus "
                    "เพื่อปิดช่องว่างความเสี่ยงนี้โดยเร่งด่วนที่สุด"
                )
                discussion_topics = [
                    "ชี้แจงความเสี่ยงของภาระหนี้บ้านต่อครอบครัวหากขาดประกันคุ้มครองวงเงินสินเชื่อ",
                    "นำเสนอทางเลือก Krungsri MRTA ควบคู่สิทธิพิเศษลดดอกเบี้ยสินเชื่อบ้าน",
                    "คำนวณเบี้ยประกันรายงวดที่คุ้มค่าและไม่กระทบสภาพคล่องรายเดือน",
                ]
                key_observations = [
                    "สถานะ KYC: สมบูรณ์ (สาขาสาทร)",
                    "ภาระหนี้สำคัญ: สินเชื่อบ้าน 5.5 ล้านบาท ยังไม่มี MRTA ครอบคลุม",
                    "โอกาสทางธุรกิจ: ศักยภาพสูงมากในการนำเสนอผลิตภัณฑ์กลุ่ม Protection เพื่อความปลอดภัยของสินทรัพย์ลูกค้า",
                ]
                rec_code = "KRUNGSRI-MORTGAGE-PROT"
                decision_action = "approve"
                decision_feedback = "เห็นชอบ 100% เตรียมเอกสารเปรียบเทียบตารางภาระหนี้และสิทธิลดดอกเบี้ยบ้านเพื่อนัดคุยที่สาขา"

            elif idx == 5:
                # Scenario E: Existing Coverage Review (Wealthy pre-retiree AUM 14M, Smart Pension)
                cust_id = DETERMINISTIC_CUSTOMER_UUIDS[ext_ref]
                first_name, last_name = "ธนภูมิ", "ยิ้มแย้ม"
                gender = "ชาย"
                age_val = 52
                occupation = "ประธานเจ้าหน้าที่ฝ่ายปฏิบัติการ (COO) โรงงานอุตสาหกรรมแปรรูปอาหาร"
                income_range = "มากกว่า 200,000 บาท/เดือน"
                tier = "Platinum"
                kyc_stat = "verified"
                kyc_chan = "สาขาสำนักเพลินจิต"
                risk_tol = "ปานกลาง (Moderate)"
                score_num = 76
                priority_lv = "high"
                days_renewal = 25
                days_last_contact = 60
                pay_stat = "paid"
                addr_val = "456 ถนนพระรามที่ 3 แขวงบางโพงพาง เขตยานนาวา กรุงเทพมหานคร 10120"
                dist_val = "ยานนาวา"
                post_val = "10120"
                lat_val = 13.6891
                lng_val = 100.5412

                assets = 14200000.0
                liabilities = 0.0
                monthly_savings = 95000.0
                has_loan = False
                loan_desc = None
                prods_held = [
                    "บัญชีเงินฝากประจำ Krungsri Super Step-Up",
                    "กองทุนรวม Krungsri Prime Balanced Fund",
                    "บัตรเครดิต Krungsri Exclusive Signature",
                ]

                policies_data = [
                    {
                        "code": "KRUNGSRI-LIFE-01",
                        "name": "กรุงศรี ไลฟ์ พลัส 90/20",
                        "type": "Life protection (ประกันชีวิต)",
                        "coverage": 5000000.0,
                        "premium": 110000.0,
                        "days_left": 25,
                        "pay_status": "paid",
                        "remarks": "ชำระเบี้ยครบกำหนดสัญญาแล้วบางส่วน กรมธรรม์มีมูลค่าเงินสดสูง",
                    },
                    {
                        "code": "KRUNGSRI-HEALTH-MAX",
                        "name": "กรุงศรี เฮลท์ แม็กซ์ (Health Max 5M)",
                        "type": "Health protection (ประกันสุขภาพ)",
                        "coverage": 5000000.0,
                        "premium": 56000.0,
                        "days_left": 180,
                        "pay_status": "paid",
                        "remarks": "ความคุ้มครองสุขภาพครอบคลุมสมบูรณ์",
                    },
                ]

                needs_data = [
                    (
                        "Retirement planning (การวางแผนเกษียณและออมระยะยาว)",
                        "high",
                        "ลูกค้าอายุ 52 ปี ปลอดหนี้สิน ทรัพย์สินสูง วางแผนเกษียณอายุที่ 60 ปี ต้องการสร้างกระแสเงินสดประจำหลังเกษียณ (Guaranteed Pension)",
                    ),
                    (
                        "Coverage review (การทบทวนและต่ออายุกรมธรรม์)",
                        "medium",
                        "ทบทวนกรมธรรม์ประกันชีวิตเดิมที่มีกำหนดต่ออายุในอีก 25 วัน และตรวจสอบการส่งมอบผลประโยชน์แก่ทายาท",
                    ),
                ]

                shap_reasons = [
                    {"feature": "wealth_stage_retirement", "value": 52, "impact": 0.36, "label": "อยู่ในช่วงวัยวางแผนก่อนเกษียณ (อายุ 52 ปี ปลอดหนี้สิน)"},
                    {"feature": "relationship_tier", "value": 1, "impact": 0.24, "label": "ลูกค้าระดับมั่งคั่งสูง (Platinum Tier · AUM 14.2 ล้านบาท)"},
                    {"feature": "days_to_renewal", "value": 25, "impact": 0.20, "label": "กรมธรรม์เดิมมีกำหนดต่ออายุในอีก 25 วัน"},
                ]

                insight_summary = (
                    "คุณธนภูมิ (อายุ 52 ปี, COO อุตสาหกรรมอาหาร, Krungsri Platinum) ฐานะการเงินมั่นคงมาก ปลอดหนี้สิน มีสินทรัพย์รวม 14.2 ล้านบาท "
                    "ความคุ้มครองชีวิตและสุขภาพเดิมครอบคลุมดีมากแล้ว เป้าหมายสำคัญในปัจจุบันคือการเตรียมพร้อมรับกระแสเงินสดหลังเกษียณอายุ 60 ปี "
                    "แนะนำนำเสนอ Krungsri Smart Pension (บำนาญสุขใจ) เพื่อการันตีเงินบำนาญสม่ำเสมอคืนทุกปีถึงอายุ 85 ปี พร้อมสิทธิลดหย่อนภาษีสูงสุด 200,000 บาท"
                )
                discussion_topics = [
                    "ทบทวนผลประโยชน์กรมธรรม์เดิมที่จะต่ออายุใน 25 วัน และยืนยันความพึงพอใจ",
                    "นำเสนอแผนภาพกระแสเงินสดหลังเกษียณเปรียบเทียบระหว่างเงินฝากกับ Krungsri Smart Pension",
                    "วางแผนการใช้สิทธิลดหย่อนภาษีกลุ่มเงินออมเพื่อการเกษียณวงเงิน 200,000 บาท",
                ]
                key_observations = [
                    "สถานะ KYC: สมบูรณ์ (สาขาสำนักเพลินจิต)",
                    "สถิติความมั่งคั่ง: AUM 14.2 ล้านบาท พร้อมออมเพิ่มได้ 95,000 บาท/เดือน",
                    "โอกาสทางธุรกิจ: แนะนำผลิตภัณฑ์บำนาญ Krungsri Smart Pension อย่างเจาะจง",
                ]
                rec_code = "KRUNGSRI-RETIRE-SMART"
                decision_action = "approve"
                decision_feedback = "นัดหมายรับประทานกาแฟที่ Krungsri Exclusive Lounge สาขาเพลินจิตเพื่อสรุปแผนบำนาญ"

            elif idx == 6:
                # Scenario F: Missing Info / KYC Pending Opportunity (Freelance architect)
                cust_id = DETERMINISTIC_CUSTOMER_UUIDS[ext_ref]
                first_name, last_name = "วิภา", "รุ่งเรือง"
                gender = "หญิง"
                age_val = 31
                occupation = "สถาปนิกและมัณฑนากรอิสระ (Design Studio Owner)"
                income_range = "50,001 - 100,000 บาท/เดือน"
                tier = "Standard"
                kyc_stat = "pending"
                kyc_chan = "ดิจิทัล (Krungsri Mobile App)"
                risk_tol = "ปานกลาง (Moderate)"
                score_num = 48
                priority_lv = "medium"
                days_renewal = 180
                days_last_contact = 110
                pay_stat = "paid"
                addr_val = "78 ซอยพหลโยธิน 7 แขวงสามเสนใน เขตพญาไท กรุงเทพมหานคร 10400"
                dist_val = "พญาไท"
                post_val = "10400"
                lat_val = 13.7794
                lng_val = 100.5447

                assets = 850000.0
                liabilities = 0.0
                monthly_savings = 25000.0
                has_loan = False
                loan_desc = None
                prods_held = ["บัญชีออมทรัพย์มีแต่ได้ Krungsri Mee Tae Dai"]

                policies_data = []  # No insurance policies yet!

                needs_data = [
                    (
                        "Coverage review (การทบทวนและต่ออายุกรมธรรม์)",
                        "high",
                        "สถานะ KYC อยู่ระหว่างรอยืนยันตัวตน (Pending) ต้องเร่งประสานงานให้อัปเดตข้อมูลเพื่อเปิดรับสิทธิประโยชน์และทำธุรกรรมประกันได้สมบูรณ์",
                    ),
                    (
                        "Life protection (ความคุ้มครองชีวิตและภาระครอบครัว)",
                        "medium",
                        "ยังไม่มีประวัติการถือครองกรมธรรม์ประกันชีวิตหรือสุขภาพกับธนาคาร มีความสนใจเริ่มออมเงินระยะสั้น-กลาง",
                    ),
                ]

                shap_reasons = [
                    {"feature": "kyc_status_pending", "value": 1, "impact": 0.38, "label": "สถานะ KYC ยังไม่สมบูรณ์ (รอยืนยันตัวตนผ่าน NDID/สาขา)"},
                    {"feature": "uninsured_profile", "value": 1, "impact": 0.28, "label": "ยังไม่มีประกันชีวิตหรือสุขภาพในระบบ (Uninsured Customer)"},
                    {"feature": "savings_potential", "value": 25000, "impact": 0.16, "label": "มีเงินออมในบัญชีกรุงศรีและมีวินัยการออมสม่ำเสมอ"},
                ]

                insight_summary = (
                    "คุณวิภา (อายุ 31 ปี, สถาปนิกอิสระ, Krungsri Standard) มีบัญชีเงินฝากกับธนาคารและมีสภาพคล่องดี แต่สถานะ KYC ยังค้างอยู่ในสถานะ 'Pending' "
                    "ทำให้ยังไม่สามารถเข้าถึงสิทธิประโยชน์และผลิตภัณฑ์ประกันได้เต็มที่ แนะนำให้นายหน้าติดต่ออำนวยความสะดวกในการยืนยันตัวตน "
                    "จากนั้นจึงแนะนำแบบประกันออมทรัพย์เริ่มต้น Krungsri 10/5 ซึ่งตอบโจทย์ฟรีแลนซ์ที่ต้องการการันตีผลตอบแทน"
                )
                discussion_topics = [
                    "แนะนำขั้นตอนการยืนยันตัวตนง่ายๆ ผ่าน Krungsri Mobile App หรือที่ตู้ ATM กรุงศรี",
                    "อธิบายสิทธิประโยชน์ด้านความคุ้มครองและบัญชีความปลอดภัยหลังยืนยันตัวตนสมบูรณ์",
                    "เปิดบทสนทนาเรื่องแบบประกันสะสมทรัพย์เริ่มต้น Krungsri 10/5 ชำระเบี้ยสั้น 5 ปี",
                ]
                key_observations = [
                    "สถานะ KYC: Pending (รออัปเดตบัตรประชาชนและยืนยันใบหน้า)",
                    "ประวัติประกัน: ยังไม่เคยมีกรมธรรม์ (New to Insurance)",
                    "แนวทางดำเนินการ: แก้ไข KYC ให้ Verified ก่อนจึงเริ่มขั้นตอนการเสนอขาย",
                ]
                rec_code = "KRUNGSRI-SAVINGS-10-5"
                decision_action = "modify"
                decision_feedback = "โทรแนะนำขั้นตอนการทำ Dip Chip บัตรประชาชนที่สาขาหรือ 7-Eleven ก่อนเปิดใบคำขอ"

            elif idx == 7:
                # Scenario G: LLM Fallback Demonstration
                cust_id = DETERMINISTIC_CUSTOMER_UUIDS[ext_ref]
                first_name, last_name = "อานนท์", "ก้าวหน้า"
                gender = "ชาย"
                age_val = 45
                occupation = "เจ้าของกิจการค้าปลีกวัสดุก่อสร้าง (3 สาขา)"
                income_range = "100,001 - 200,000 บาท/เดือน"
                tier = "Gold"
                kyc_stat = "verified"
                kyc_chan = "สาขาเดอะมอลล์บางกะปิ"
                risk_tol = "ปานกลาง (Moderate)"
                score_num = 82
                priority_lv = "high"
                days_renewal = 20
                days_last_contact = 80
                pay_stat = "paid"
                addr_val = "123 ถนนบางนา-ตราด กม.3 แขวงบางนา เขตบางนา กรุงเทพมหานคร 10260"
                dist_val = "บางนา"
                post_val = "10260"
                lat_val = 13.6675
                lng_val = 100.6288

                assets = 7500000.0
                liabilities = 2500000.0
                monthly_savings = 60000.0
                has_loan = True
                loan_desc = "สินเชื่อหมุนเวียนเบิกเกินบัญชี Krungsri SME OD (ยอด 2.5 ล้านบาท)"
                prods_held = ["บัญชีกระแสรายวัน Krungsri", "สินเชื่อ Krungsri SME OD", "บัตรเครดิต Krungsri Corporate"]

                policies_data = [
                    {
                        "code": "KRUNGSRI-LIFE-01",
                        "name": "กรุงศรี ไลฟ์ พลัส (Life Plus 90/20)",
                        "type": "Life protection (ประกันชีวิต)",
                        "coverage": 2000000.0,
                        "premium": 52000.0,
                        "days_left": 20,
                        "pay_status": "paid",
                        "remarks": "กรมธรรม์ใกล้ครบกำหนดต่ออายุในอีก 20 วัน",
                    }
                ]

                needs_data = [
                    (
                        "Coverage review (การทบทวนและต่ออายุกรมธรรม์)",
                        "high",
                        "กรมธรรม์คุ้มครองชีวิตหลักใกล้ครบกำหนดต่ออายุในอีก 20 วัน ต้องเร่งประสานงานชำระเบี้ยเพื่อรักษาผลประโยชน์",
                    ),
                    (
                        "Financial protection (การคุ้มครองสินเชื่อและภาระหนี้)",
                        "medium",
                        "มีภาระวงเงินกู้เบิกเกินบัญชีธุรกิจ SME ต้องการความคุ้มครองรายได้ของครอบครัวในฐานะเสาหลักกิจการ",
                    ),
                ]

                shap_reasons = [
                    {"feature": "days_to_renewal", "value": 20, "impact": 0.34, "label": "กรมธรรม์ Krungsri Life Plus ครบกำหนดต่ออายุในอีก 20 วัน"},
                    {"feature": "sme_loan_balance", "value": 2500000, "impact": 0.26, "label": "มีภาระวงเงินสินเชื่อธุรกิจ SME ยอด 2.5 ล้านบาท"},
                    {"feature": "days_since_last_contact", "value": 80, "impact": 0.18, "label": "ไม่ได้ติดต่ออัปเดตสถานะพอร์ตโฟลิโอเกิน 80 วัน"},
                ]

                insight_summary = (
                    "คุณอานนท์ (อายุ 45 ปี, ผู้ประกอบการ SME วัสดุก่อสร้าง, Krungsri Gold) กรมธรรม์ Krungsri Life Plus ครบกำหนดต่ออายุในอีก 20 วัน "
                    "ลูกค้ามีภาระสินเชื่อหมุนเวียนธุรกิจ 2.5 ล้านบาทและมีบทบาทเป็นเสาหลักของกิจการและครอบครัว "
                    "แนะนำให้นายหน้าติดต่อเพื่อยืนยันการต่ออายุกรมธรรม์ พร้อมแนะนำความคุ้มครองโรคร้ายแรง Krungsri CI Protect เพื่อเสริมความมั่นคงทางธุรกิจ"
                )
                discussion_topics = [
                    "แจ้งเตือนกำหนดต่ออายุเบี้ยประกันชีวิตรอบ 20 วันเพื่อคงความคุ้มครองต่อเนื่อง",
                    "ทบทวนความคุ้มครองผู้บริหารหลัก (Keyman Protection) สำหรับธุรกิจ SME",
                    "แนะนำแบบประกัน Krungsri CI Protect ตรวจพบ 50 โรคร้ายแรงรับเงินก้อนทันที",
                ]
                key_observations = [
                    "สถานะ KYC: สมบูรณ์ (สาขาเดอะมอลล์บางกะปิ)",
                    "ความเร่งด่วน: กรมธรรม์เดิมครบกำหนดใน 20 วัน",
                    "ความต่อเนื่องทางธุรกิจ: รองรับระบบ LLM Fallback กรณีโครงข่าย AI ภายนอกขัดข้อง",
                ]
                rec_code = "KRUNGSRI-CI-PROTECT"
                decision_action = "approve"
                decision_feedback = "นัดหมายแจ้งเตือนกำหนดต่ออายุและส่งใบเสนอราคาเบื้องต้น"

            elif idx == 8:
                # Scenario H: Hard-Gating Scenario (Senior age 68)
                cust_id = DETERMINISTIC_CUSTOMER_UUIDS[ext_ref]
                first_name, last_name = "ณัฐพร", "ทวีผล"
                gender = "หญิง"
                age_val = 68
                occupation = "ข้าราชการครูบำนาญ และที่ปรึกษาด้านการศึกษา"
                income_range = "50,001 - 100,000 บาท/เดือน"
                tier = "Standard"
                kyc_stat = "verified"
                kyc_chan = "สาขาอารีย์"
                risk_tol = "ระมัดระวัง (Low)"
                score_num = 50
                priority_lv = "medium"
                days_renewal = 200
                days_last_contact = 50
                pay_stat = "paid"

                assets = 3200000.0
                liabilities = 0.0
                monthly_savings = 15000.0
                has_loan = False
                loan_desc = None
                prods_held = ["บัญชีเงินฝากประจำ Krungsri Step Up", "บัตรเดบิตกรุงศรี ชิปการ์ด"]

                policies_data = [
                    {
                        "code": "KRUNGSRI-LIFE-01",
                        "name": "กรุงศรี ไลฟ์ พลัส (ครบกำหนดชำระเบี้ยแล้ว)",
                        "type": "Life protection (ประกันชีวิต)",
                        "coverage": 1000000.0,
                        "premium": 0.0,
                        "days_left": 200,
                        "pay_status": "paid",
                        "remarks": "ชำระเบี้ยครบสัญญาแล้ว อยู่ในระยะรับความคุ้มครองตลอดชีพ",
                    }
                ]

                needs_data = [
                    (
                        "Life protection (ความคุ้มครองชีวิตและภาระครอบครัว)",
                        "medium",
                        "ลูกค้ากลุ่มผู้สูงอายุ (Senior Age 68) ต้องการความคุ้มครองชีวิตเพื่อการส่งต่อมรดกแก่ลูกหลานอย่างราบรื่น",
                    ),
                    (
                        "Coverage review (การทบทวนและต่ออายุกรมธรรม์)",
                        "low",
                        "ทบทวนสถานะผู้รับประโยชน์และสิทธิการรักษาพยาบาลตามสิทธิข้าราชการบำนาญ",
                    ),
                ]

                shap_reasons = [
                    {"feature": "senior_age_eligibility", "value": 68, "impact": 0.32, "label": "อายุ 68 ปี เกินเกณฑ์ผลิตภัณฑ์สุขภาพบางประเภท (Hard-Gating Filtered)"},
                    {"feature": "legacy_planning_need", "value": 1, "impact": 0.22, "label": "เป้าหมายการวางแผนมรดกและส่งต่อสินทรัพย์แก่ลูกหลาน"},
                    {"feature": "pension_stability", "value": 1, "impact": 0.15, "label": "มีรายได้จากเงินบำนาญข้าราชการสม่ำเสมอ"},
                ]

                insight_summary = (
                    "คุณณัฐพร (อายุ 68 ปี, ข้าราชการบำนาญ, Krungsri Standard) สภาพการเงินมั่นคง มีเงินบำนาญสม่ำเสมอ "
                    "จากกฎเกณฑ์ความปลอดภัยของระบบ (AI Guardrail Hard-Gating): เนื่องจากลูกค้ามีอายุ 68 ปี ซึ่งเกินเกณฑ์รับประกันของ "
                    "ผลิตภัณฑ์ประกันสุขภาพบางประเภทและประกันบำนาญ ระบบจึงคัดกรองผลิตภัณฑ์ที่ไม่ผ่านเกณฑ์ออกโดยอัตโนมัติ "
                    "และนำเสนอเฉพาะแบบประกันที่รองรับผู้สูงอายุ เช่น Krungsri Life Plus สำหรับการส่งต่อมรดกแก่ลูกหลาน"
                )
                discussion_topics = [
                    "ทบทวนสถานะผู้รับประโยชน์ในกรมธรรม์เดิมให้สอดคล้องกับเจตนารมณ์",
                    "อธิบายผลิตภัณฑ์ที่รองรับผู้สูงอายุและเกณฑ์การตรวจสุขภาพอย่างโปร่งใส",
                    "นำเสนอแผนการบริหารเงินออมในบัญชีเงินฝากดอกเบี้ยพิเศษ Krungsri Step Up",
                ]
                key_observations = [
                    "สถานะ KYC: สมบูรณ์ (สาขาอารีย์)",
                    "การตรวจสอบกฎเกณฑ์ (Hard-Gating): ผ่านการคัดกรองผลิตภัณฑ์ตามเกณฑ์อายุสูงสุดสำเร็จ",
                    "ความต้องการหลัก: การส่งต่อมรดกและบริหารเงินออมความเสี่ยงต่ำ",
                ]
                rec_code = "KRUNGSRI-LIFE-01"
                decision_action = "approve"
                decision_feedback = "เห็นชอบ ให้คำแนะนำตามเงื่อนไขที่ AI คัดกรองมาอย่างถูกต้องตามระเบียบ คปภ."

            else:
                # -------------------------------------------------------------
                # PERSONAS KS-00009 through KS-00250 (Rotating Archetypes)
                # -------------------------------------------------------------
                cust_id = str(uuid.uuid4())
                is_male = random.random() > 0.5
                gender = "ชาย" if is_male else "หญิง"
                first_name = random.choice(THAI_FIRST_NAMES_MALE if is_male else THAI_FIRST_NAMES_FEMALE)
                last_name = random.choice(THAI_LAST_NAMES)
                branch_loc = random.choice(BRANCHES_LIST)

                # Pick an archetype
                archetype = OCCUPATION_ARCHETYPES[idx % len(OCCUPATION_ARCHETYPES)]
                occupation = archetype["title"]
                income_range = archetype["income"]
                age_val = random.randint(archetype["min_age"], archetype["max_age"])
                tier = archetype["tier"]
                risk_tol = archetype["risk"]
                need_focus = archetype["need_focus"]

                # Geolocation: 80% have realistic Bangkok coordinates, 20% left as None to test missing location handling
                if idx % 5 == 0:
                    addr_val = None
                    dist_val = None
                    post_val = None
                    lat_val = None
                    lng_val = None
                else:
                    nh = BANGKOK_NEIGHBORHOODS[(idx + 3) % len(BANGKOK_NEIGHBORHOODS)]
                    addr_val = f"{random.randint(10, 899)}/{random.randint(1, 99)} {nh['address_fmt']}"
                    dist_val = nh["district"]
                    post_val = nh["post"]
                    lat_val = round(nh["lat"] + random.uniform(-0.006, 0.006), 4)
                    lng_val = round(nh["lng"] + random.uniform(-0.006, 0.006), 4)

                # High Priority: exactly 20 cases for idx >= 9 (4 hero + 20 = 24 total High Priority cases, ~9.6% of portfolio)
                is_high_prio = idx in [12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180, 192, 204, 216, 228, 240]

                # KYC Pending: exactly 7 cases for idx >= 9 (1 hero + 7 = 8 total Pending KYC cases, 3.2% of portfolio)
                is_kyc_pending = idx in [35, 70, 105, 140, 175, 210, 245]

                # Overdue payment: exactly 3 cases across entire portfolio (for realistic warning badge demo)
                is_payment_overdue = idx in [12, 24, 36]

                if is_high_prio:
                    priority_lv = "high"
                    score_num = random.randint(75, 96)
                    days_renewal = random.randint(5, 28)
                    days_last_contact = random.randint(45, 120)
                    kyc_stat = "verified"
                    pay_stat = "overdue" if is_payment_overdue else "paid"
                elif idx % 2 == 0:
                    priority_lv = "medium"
                    score_num = random.randint(45, 72)
                    days_renewal = random.randint(35, 120)
                    days_last_contact = random.randint(30, 90)
                    kyc_stat = "pending" if is_kyc_pending else "verified"
                    pay_stat = "paid"
                else:
                    priority_lv = "low"
                    score_num = random.randint(15, 38)
                    days_renewal = random.randint(180, 360)
                    days_last_contact = random.randint(7, 28)
                    kyc_stat = "pending" if is_kyc_pending else "verified"
                    pay_stat = "paid"

                kyc_chan = random.choice(["ดิจิทัล (Krungsri Mobile App)", branch_loc, "ดิจิทัล (NDID)"])

                min_a, max_a = archetype["assets_range"]
                assets = float(random.randint(min_a // 10000, max_a // 10000) * 10000)
                min_s, max_s = archetype["savings_range"]
                monthly_savings = float(random.randint(min_s // 1000, max_s // 1000) * 1000)

                has_loan = (idx % 3 == 0) or (need_focus == "Financial protection")
                liabilities = float(random.randint(150, 600) * 10000) if has_loan else 0.0
                loan_desc = (
                    f"สินเชื่อบ้านกรุงศรี โฮมเรดดี้ (คงค้าง {liabilities:,.0f} บาท)"
                    if has_loan else None
                )
                prods_held = list(archetype["products_held"])

                # Policies
                has_policies = (idx % 7 != 0)
                policies_data = []
                if has_policies:
                    num_pol = random.randint(1, 2)
                    if need_focus == "Health protection":
                        policies_data.append({
                            "code": "KRUNGSRI-HEALTH-MAX",
                            "name": "กรุงศรี เฮลท์ แม็กซ์ เหมาจ่าย (Health Max)",
                            "type": "Health protection (ประกันสุขภาพ)",
                            "coverage": 3000000.0,
                            "premium": 32000.0,
                            "days_left": days_renewal,
                            "pay_status": pay_stat,
                            "remarks": "กรมธรรม์มีผลบังคับสมบูรณ์",
                        })
                    elif need_focus == "Retirement planning":
                        policies_data.append({
                            "code": "KRUNGSRI-RETIRE-SMART",
                            "name": "กรุงศรี บำนาญสุขใจ (Smart Pension)",
                            "type": "Retirement planning (ประกันบำนาญ)",
                            "coverage": 2000000.0,
                            "premium": 75000.0,
                            "days_left": days_renewal,
                            "pay_status": pay_stat,
                            "remarks": "การันตีเงินบำนาญรายปีหลังเกษียณ",
                        })
                    else:
                        policies_data.append({
                            "code": "KRUNGSRI-LIFE-01",
                            "name": "กรุงศรี ไลฟ์ พลัส 90/20",
                            "type": "Life protection (ประกันชีวิต)",
                            "coverage": 1500000.0,
                            "premium": 42000.0,
                            "days_left": days_renewal,
                            "pay_status": pay_stat,
                            "remarks": "คุ้มครองการส่งต่อมรดกและคุ้มครองรายได้ครอบครัว",
                        })

                # Needs mapping matching std_cats
                if has_loan and liabilities > 2000000:
                    needs_data = [
                        (
                            "Financial protection (การคุ้มครองสินเชื่อและภาระหนี้)",
                            "high" if priority_lv == "high" else "medium",
                            f"ลูกค้ามีภาระสินเชื่อ {liabilities:,.0f} บาท ควรพิจารณาความคุ้มครองวงเงินกู้เพื่อลดความเสี่ยงต่อครอบครัว",
                        )
                    ]
                    rec_code = "KRUNGSRI-MORTGAGE-PROT"
                elif days_renewal <= 30 and priority_lv == "high":
                    needs_data = [
                        (
                            "Coverage review (การทบทวนและต่ออายุกรมธรรม์)",
                            "high",
                            f"กรมธรรม์ใกล้ครบกำหนดต่ออายุในอีก {days_renewal} วัน เป็นโอกาสติดต่อให้บริการและเสนอผลิตภัณฑ์ต่อเนื่อง",
                        )
                    ]
                    rec_code = "KRUNGSRI-HEALTH-MAX"
                elif age_val >= 48:
                    needs_data = [
                        (
                            "Retirement planning (การวางแผนเกษียณและออมระยะยาว)",
                            "high" if tier == "Platinum" else "medium",
                            f"ลูกค้าอายุ {age_val} ปี เตรียมความพร้อมทางการเงินเพื่อสร้างเงินบำนาญและรักษาสภาพคล่องหลังเกษียณ",
                        )
                    ]
                    rec_code = "KRUNGSRI-RETIRE-SMART"
                else:
                    needs_data = [
                        (
                            "Health protection (ความคุ้มครองสุขภาพและโรคร้ายแรง)",
                            "medium",
                            "แนะนำความคุ้มครองสุขภาพแบบเหมาจ่ายและโรคร้ายแรงระยะวิกฤตเพื่อรองรับค่ารักษาพยาบาลที่ปรับตัวสูงขึ้น",
                        )
                    ]
                    rec_code = "KRUNGSRI-CI-PROTECT"

                shap_reasons = [
                    {"feature": "days_to_renewal", "value": days_renewal, "impact": 0.32, "label": f"กรมธรรม์ครบกำหนดต่ออายุใน {days_renewal} วัน"},
                    {"feature": "days_since_last_contact", "value": days_last_contact, "impact": 0.22, "label": f"ติดต่อล่าสุดเมื่อ {days_last_contact} วันก่อน"},
                    {"feature": "relationship_tier", "value": 1 if tier == "Platinum" else 0, "impact": 0.18, "label": f"ระดับความสัมพันธ์ {tier} Tier"},
                    {"feature": "payment_status", "value": 1 if pay_stat == "paid" else 0, "impact": 0.12, "label": f"สถานะการชำระเบี้ย: {pay_stat}"},
                ]

                full_name_str = f"{first_name} {last_name}"
                insight_summary = (
                    f"ลูกค้าคุณ{full_name_str} (อายุ {age_val} ปี, {occupation}, ระดับ {tier}) มีคะแนนความสำคัญจากโมเดล AI {score_num}/100 "
                    f"สถานะการเงินรวมสินทรัพย์ {assets:,.0f} บาท มีศักยภาพในการออมเดือนละ {monthly_savings:,.0f} บาท "
                    f"แนะนำให้นายหน้าประกันเข้าพบหรือติดต่อเพื่อทบทวนพอร์ตโฟลิโอและต่อยอดความคุ้มครองตามความต้องการ"
                )
                discussion_topics = [
                    f"ทบทวนสถานะความคุ้มครองและเงื่อนไขกรมธรรม์ในรอบ {days_renewal} วัน",
                    f"ประเมินเป้าหมายทางการเงินและสิทธิประโยชน์ลดหย่อนภาษีประจำปี",
                    f"นำเสนอผลิตภัณฑ์ {product_obj_map[rec_code].product_name} เพื่อเสริมความคุ้มครอง",
                ]
                key_observations = [
                    f"สถานะ KYC: {kyc_stat} ({kyc_chan})",
                    f"ภาระหนี้สิน: {'มีสินเชื่อ ' + f'{liabilities:,.0f}' + ' บาท' if has_loan else 'ปลอดหนี้สิน'}",
                    f"ช่องทางการติดต่อที่สะดวก: {random.choice(['โทรศัพท์ช่วงบ่าย', 'Line Official', 'นัดพบที่สาขา'])}",
                ]

                # Decisions distribution: 65% approve, 20% modify, 15% reject
                dec_rnd = random.random()
                if dec_rnd < 0.65:
                    decision_action = "approve"
                    decision_feedback = "เห็นชอบกับข้อเสนอแนะ AI เตรียมจัดส่งเอกสารและข้อเสนอให้ลูกค้า"
                elif dec_rnd < 0.85:
                    decision_action = "modify"
                    decision_feedback = "ปรับเปลี่ยนวงเงินความคุ้มครองและแผนการชำระเบี้ยตามที่ลูกค้าสะดวก"
                else:
                    decision_action = "reject"
                    decision_feedback = "ลูกค้าขอชะลอการตัดสินใจเพื่อรอผลประกอบการธุรกิจในไตรมาสถัดไป"

            # -------------------------------------------------------------
            # PERSIST RECORDS INTO ORM MODELS
            # -------------------------------------------------------------
            full_name = f"{first_name} {last_name}"
            customer = Customer(
                id=cust_id,
                external_ref=ext_ref,
                first_name=first_name,
                last_name=last_name,
                full_name=full_name,
                assigned_broker_id=assigned_broker.id,
            )
            db.add(customer)
            await db.flush()

            # Profile
            profile = CustomerProfile(
                customer_id=customer.id,
                age=age_val,
                gender=gender,
                occupation=occupation,
                income_range=income_range,
                kyc_status=kyc_stat,
                kyc_channel=kyc_chan,
                risk_tolerance=risk_tol,
                relationship_tier=tier,
                address=addr_val,
                district=dist_val,
                province=prov_val,
                postal_code=post_val,
                latitude=lat_val,
                longitude=lng_val,
            )
            db.add(profile)

            # Financial Profile
            fin_prof = FinancialProfile(
                customer_id=customer.id,
                total_assets=assets,
                total_liabilities=liabilities,
                monthly_savings=monthly_savings,
                has_active_loan=has_loan,
                loan_details=loan_desc,
                products_held=prods_held,
                transaction_frequency_90d=random.randint(12, 54),
                last_financial_activity=today - timedelta(days=random.randint(1, 28)),
            )
            db.add(fin_prof)

            # Policies
            for p_idx, p_data in enumerate(policies_data):
                ren_date = today + timedelta(days=p_data["days_left"])
                pol = InsurancePolicy(
                    customer_id=customer.id,
                    policy_number=f"POL-{ext_ref}-{p_idx+1:02d}",
                    policy_type=p_data["type"],
                    coverage_amount=p_data["coverage"],
                    premium_amount=p_data["premium"],
                    start_date=ren_date - timedelta(days=365),
                    renewal_date=ren_date,
                    status="Active",
                    payment_status=p_data["pay_status"],
                    remarks=p_data["remarks"],
                )
                db.add(pol)

            # Customer Needs
            for n_type, n_sev, n_desc in needs_data:
                need = CustomerNeed(
                    customer_id=customer.id,
                    need_type=n_type,
                    severity=n_sev,
                    description=n_desc,
                    identified_at=datetime.now(timezone.utc),
                )
                db.add(need)

            # AI Score
            ai_score = AIScore(
                customer_id=customer.id,
                score=score_num / 100.0,
                score_display=score_num,
                priority_level=priority_lv,
                shap_values={"days_to_renewal": 0.32, "contact": 0.22},
                feature_importance=shap_reasons,
                model_version="1.2.0-krungsri-calibrated",
                scored_at=datetime.now(timezone.utc),
            )
            db.add(ai_score)
            await db.flush()

            # AI Insight
            insight = AIInsight(
                customer_id=customer.id,
                score_id=ai_score.id,
                insight_summary=insight_summary,
                discussion_topics=discussion_topics,
                key_observations=key_observations,
                model_version="gemini-2.0-flash",
                generated_at=datetime.now(timezone.utc),
            )
            db.add(insight)

            # Follow Up Pipeline
            # Open Follow-ups: exactly 18 cases (idx in [1, 4, 7] from heroes + idx in [12, 24, 36] overdue + 12 active cases: [48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180])
            is_open_fu = idx in [1, 4, 7, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180]
            is_overdue = idx in [12, 24, 36]  # exactly 3 overdue cases (for warning badge)

            fu_status = "open" if is_open_fu else "done"
            scheduled_d = (
                today - timedelta(days=3)
                if is_overdue
                else (today + timedelta(days=min(days_renewal, 14)))
                if is_open_fu
                else (today - timedelta(days=days_last_contact))
            )

            follow = FollowUp(
                customer_id=customer.id,
                broker_id=assigned_broker.id,
                scheduled_date=scheduled_d,
                last_contact_date=today - timedelta(days=days_last_contact),
                follow_up_window="ก่อนครบกำหนดต่ออายุ (Renewal Window)" if days_renewal <= 30 else "รอบทบทวนพอร์ตโฟลิโอประจำปี",
                status=fu_status,
                priority=priority_lv,
                payment_status=pay_stat,
                notes=f"บันทึกงานติดตามคุณ{full_name}: แนะนำทบทวนสิทธิประโยชน์ และนำเสนอ {product_obj_map[rec_code].product_name}",
            )
            db.add(follow)

            # Interactions History (2-3 realistic touchpoints)
            interact_channels = ["สาขา", "โทรศัพท์", "Line", "ดิจิทัล"]
            ch = random.choice(interact_channels)
            notes_samples = [
                f"ติดต่อพูดคุยเรื่องการจัดส่งหนังสือรับรองการชำระเบี้ยประกัน ลูกค้าสะดวกให้นายหน้าประสานงานผ่าน {ch}",
                f"ลูกค้าเข้าพบที่สาขาเพื่อสอบถามเรื่องสิทธิลดหย่อนภาษีช่วงปลายปี มีท่าทีสนใจผลิตภัณฑ์เพิ่มเติม",
                f"โทรสอบถามความพึงพอใจการใช้บริการและการใช้งาน Krungsri Mobile App ลูกค้าให้ข้อคิดเห็นเชิงบวก",
            ]
            interact = CustomerInteraction(
                customer_id=customer.id,
                broker_id=assigned_broker.id,
                channel=ch,
                interaction_type="ทบทวนพอร์ตโฟลิโอประจำปี",
                notes=random.choice(notes_samples),
                interaction_date=today - timedelta(days=days_last_contact),
            )
            db.add(interact)

            # Product Recommendation
            rec_product = product_obj_map[rec_code]
            rec = Recommendation(
                customer_id=customer.id,
                product_id=rec_product.id,
                rationale=f"สอดคล้องกับโปรไฟล์ความเสี่ยง {risk_tol} และตอบโจทย์ {needs_data[0][0]} โดยตรง",
                priority_rank=1,
                status="proposed",
            )
            db.add(rec)
            await db.flush()

            # Broker Decision
            decision = BrokerDecision(
                customer_id=customer.id,
                broker_id=assigned_broker.id,
                recommendation_id=rec.id,
                product_id=rec_product.id,
                action_taken=decision_action,
                ai_recommendation=rec_product.product_name,
                reason="สอดคล้องกับความต้องการลูกค้า" if decision_action == "approve" else "ปรับให้เหมาะกับงบประมาณ",
                feedback=decision_feedback,
                decision_date=datetime.now(timezone.utc),
            )
            db.add(decision)

            if idx % 50 == 0:
                print(f"  ✓ Seeded {idx}/{num_customers} comprehensive customer profiles...")
                await db.flush()

        # Audit Log
        audit = AuditLog(
            user_id=main_broker.id,
            action="SEED_DATABASE",
            entity_type="SYSTEM",
            entity_id="ALL",
            metadata_={"num_customers": num_customers, "scenario_count": 8, "quality": "advisory_grade_v2"},
            timestamp=datetime.now(timezone.utc),
        )
        db.add(audit)

        await db.commit()
        print(f"=== Successfully seeded {num_customers} high-fidelity synthetic customers and refreshed all tables! ===")


if __name__ == "__main__":
    asyncio.run(seed_database(250, force_reseed=True))
