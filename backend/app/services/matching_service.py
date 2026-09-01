"""
Product Matching & Recommendation Service (Phase 26 Optimized).
Matches Customer Profile, Financial Profile, and Need Analysis results against
the Synthetic Product Catalog using pre-ranking Hard Eligibility Gating,
Existing Coverage Gap analysis, Multi-factor Scoring, Structured Explainability,
and Top-K comparative ranking.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.product import Product
from app.models.recommendation import Recommendation
from app.schemas.recommendation import (
    ProductMatchOut,
    StructuredExplanation,
    CustomerRecommendationsResponse,
    CustomerNeedAnalysisResponse,
)
from app.services.need_service import need_service


# Detailed Synthetic Product Catalog with Eligibility Rules & Weights
PRODUCT_RULES = {
    "KRUNGSRI-LIFE-01": {
        "category": "Life",
        "need_category": "Life protection",
        "min_age": 20,
        "max_age": 65,
        "min_income": 30.0,
        "requires_loan": False,
        "base_weight": 0.70,
        "reasons_template": [
            "ตรงกับความต้องการคุ้มครองรายได้และเสาหลักครอบครัว",
            "อายุและระดับรายได้เข้าเกณฑ์มาตรฐานของกรมธรรม์",
        ],
    },
    "KRUNGSRI-HEALTH-MAX": {
        "category": "Health",
        "need_category": "Health protection",
        "min_age": 18,
        "max_age": 70,
        "min_income": 40.0,
        "requires_loan": False,
        "base_weight": 0.80,
        "reasons_template": [
            "ตอบโจทย์ความคุ้มครองค่ารักษาพยาบาลแบบเหมาจ่าย",
            "ช่วยบริหารความเสี่ยงด้านค่าครองชีพและค่ารักษาพยาบาลที่สูงขึ้น",
        ],
    },
    "KRUNGSRI-CI-PROTECT": {
        "category": "Protection",
        "need_category": "Health protection",
        "min_age": 20,
        "max_age": 60,
        "min_income": 30.0,
        "requires_loan": False,
        "base_weight": 0.75,
        "reasons_template": [
            "คุ้มครองเงินก้อนเมื่อตรวจพบ 50 โรคร้ายแรง",
            "เสริมเกราะความคุ้มครองสุขภาพให้ครอบคลุม",
        ],
    },
    "KRUNGSRI-RETIRE-SMART": {
        "category": "Retirement",
        "need_category": "Retirement planning",
        "min_age": 30,
        "max_age": 55,
        "min_income": 50.0,
        "requires_loan": False,
        "base_weight": 0.75,
        "reasons_template": [
            "สร้างเงินบำนาญสม่ำเสมอช่วงอายุ 60-85 ปี",
            "ได้รับสิทธิประโยชน์ลดหย่อนภาษีสูงสุดตามเกณฑ์กรมสรรพากร",
        ],
    },
    "KRUNGSRI-SAVINGS-10-5": {
        "category": "Savings",
        "need_category": "Retirement planning",
        "min_age": 1,
        "max_age": 65,
        "min_income": 25.0,
        "requires_loan": False,
        "base_weight": 0.65,
        "reasons_template": [
            "ระยะเวลาชำระเบี้ยสั้น 5 ปี พร้อมเงินคืนทุกปี",
            "ความเสี่ยงต่ำ เหมาะสำหรับการจัดสรรเงินออมระยะกลาง",
        ],
    },
    "KRUNGSRI-MORTGAGE-PROT": {
        "category": "Protection",
        "need_category": "Financial protection",
        "min_age": 20,
        "max_age": 60,
        "min_income": 30.0,
        "requires_loan": True,
        "base_weight": 0.90,
        "reasons_template": [
            "คุ้มครองภาระหนี้สินบ้านและสินเชื่อที่ยังเปิดอยู่",
            "ป้องกันไม่ให้ภาระหนี้ตกเป็นภาระของครอบครัว",
        ],
    },
}

INCOME_MAP = {
    "30,000 - 50,000 บาท/เดือน": 40.0,
    "50,001 - 100,000 บาท/เดือน": 75.0,
    "100,001 - 200,000 บาท/เดือน": 150.0,
    "มากกว่า 200,000 บาท/เดือน": 250.0,
}


class ProductMatchingService:
    """Matches catalog products to customer needs using Phase 26 optimized scoring and governance."""

    def __init__(self):
        self.engine_version = "recommendation_engine_v1.1"
        self.weights = {
            "need_weight": 0.50,
            "base_weight": 0.25,
            "fit_weight": 0.25,
        }
        self.coverage_gap_penalty = 0.45
        self.top_k_limit = 3

    async def match_products_for_customer(
        self,
        customer: Any,
        db: AsyncSession,
        need_analysis: Optional[CustomerNeedAnalysisResponse] = None,
    ) -> CustomerRecommendationsResponse:
        if need_analysis is None:
            need_analysis = need_service.analyze_customer_needs(customer)

        needs_by_cat = {n.category: n for n in need_analysis.needs}

        prof = getattr(customer, "profile", None)
        fin = getattr(customer, "financial_profile", None)
        policies = getattr(customer, "insurance_policies", []) or []

        age = getattr(prof, "age", 40) if prof and prof.age else 40
        income_str = getattr(prof, "income_range", "") if prof else ""
        income_num = INCOME_MAP.get(income_str, 50.0)
        has_loan = getattr(fin, "has_active_loan", False) if fin else False
        kyc = getattr(prof, "kyc_status", "verified") if prof else "verified"

        # Missing information detector
        missing_info = []
        if not income_str:
            missing_info.append("ข้อมูลรายได้ยังไม่ได้รับการยืนยันล่าสุด")
        if kyc != "verified":
            missing_info.append(f"สถานะ KYC อยู่ระหว่าง '{kyc}'")
        if not policies:
            missing_info.append("ยังไม่มีประวัติกรมธรรม์ประกันภัยบันทึกในระบบ")

        # Load active products from database
        prod_res = await db.execute(select(Product).where(Product.is_active == True))
        products = prod_res.scalars().all()

        eligible_matches: List[ProductMatchOut] = []
        needs_verify_matches: List[ProductMatchOut] = []

        for p in products:
            rules = PRODUCT_RULES.get(p.product_code, {
                "category": p.category,
                "need_category": "Life protection",
                "min_age": 20,
                "max_age": 65,
                "min_income": 30.0,
                "requires_loan": False,
                "base_weight": 0.60,
                "reasons_template": ["ผลิตภัณฑ์ตรงตามเกณฑ์ทั่วไป"],
            })

            reasons: List[str] = []
            unmet: List[str] = []
            elig_notes: List[str] = []

            # ── 1. PRE-RANKING HARD ELIGIBILITY GATE ──
            age_ok = rules["min_age"] <= age <= rules["max_age"]
            if not age_ok:
                unmet.append(f"อายุ {age} ปี อยู่นอกเกณฑ์รับประกัน ({rules['min_age']}-{rules['max_age']} ปี)")
            else:
                elig_notes.append(f"อายุ {age} ปี ตรงตามเกณฑ์รับประกัน ({rules['min_age']}-{rules['max_age']} ปี)")

            income_ok = income_num >= rules["min_income"]
            if not income_ok:
                unmet.append(f"รายได้เฉลี่ยต่ำกว่าเกณฑ์ขั้นต่ำ ฿{rules['min_income']*1000:,.0f}/เดือน")
            else:
                elig_notes.append(f"รายได้เฉลี่ยอยู่ในเกณฑ์ที่สามารถจัดสรรเบี้ยประกันได้")

            if rules.get("requires_loan", False):
                if not has_loan:
                    unmet.append("ผลิตภัณฑ์คุ้มครองสินเชื่อ ออกแบบเฉพาะสำหรับผู้มีภาระสินเชื่อที่เปิดอยู่เท่านั้น")
                else:
                    elig_notes.append("มีภาระสินเชื่อคงค้างตรงตามเงื่อนไขของสัญญา")

            # Eligibility Classification
            if not unmet:
                eligibility_status = "eligible"
            elif len(unmet) == 1 and not rules.get("requires_loan", False):
                eligibility_status = "needs_verification"
            else:
                eligibility_status = "ineligible"

            # ── 2. NEED ALIGNMENT SCORING ──
            matched_need = needs_by_cat.get(rules["need_category"])
            n_score = matched_need.score if matched_need else 0.20
            need_signal_text = f"ระดับสัญญาณความต้องการด้าน {rules['need_category']}: {n_score:.2f}/1.00 ({matched_need.label_th if matched_need else ''})"

            # ── 3. PROFILE FIT SCORING ──
            fit_score = 0.80
            if age >= 40 and p.category in ("Health", "Retirement"):
                fit_score = 1.00
                fit_text = "ช่วงอายุและสถานะทางการเงินสอดคล้องกับกลุ่มเป้าหมายของผลิตภัณฑ์อย่างยิ่ง"
            elif has_loan and p.category == "Protection":
                fit_score = 1.00
                fit_text = "มีภาระหนี้สินที่ควรบริหารความเสี่ยงเพื่อคุ้มครองสินทรัพย์ครอบครัว"
            else:
                fit_text = "โปรไฟล์ความเสี่ยงและกำลังการออมสอดคล้องกับผลิตภัณฑ์"

            # ── 4. EXISTING COVERAGE GAP CHECK ──
            already_held = any(
                p.product_code in getattr(pol, "policy_number", "") or
                rules["category"] in getattr(pol, "policy_type", "")
                for pol in policies
            )
            coverage_penalty = 1.0
            if already_held:
                coverage_penalty = self.coverage_gap_penalty
                cov_text = "ตรวจพบความคุ้มครองเดิมในหมวดนี้แล้ว — แนะนำพิจารณาทบทวนเฉพาะส่วนขาด (Coverage Gap)"
            else:
                cov_text = "ยังไม่มีประวัติถือครองความคุ้มครองในหมวดนี้ เป็นโอกาสในการเสริมเกราะความคุ้มครอง"

            # ── 5. FINAL SCORE & EXPLANATION ──
            w = self.weights
            raw_score = (w["base_weight"] * 100.0) + (w["need_weight"] * n_score * 100.0) + (w["fit_weight"] * fit_score * 100.0)
            final_match_score = raw_score * coverage_penalty

            if eligibility_status == "ineligible":
                final_match_score = min(20.0, final_match_score * 0.20)
            elif eligibility_status == "needs_verification":
                final_match_score = min(55.0, final_match_score * 0.70)
            else:
                final_match_score = min(98.0, max(40.0, final_match_score))

            structured_expl = StructuredExplanation(
                need_signal=need_signal_text,
                profile_fit=fit_text,
                eligibility_result=" · ".join(elig_notes) if elig_notes else "ไม่ผ่านเกณฑ์คุณสมบัติ",
                existing_coverage_assessment=cov_text,
            )

            reasons = [
                need_signal_text,
                fit_text,
                cov_text,
            ]

            cov_str = f"฿{p.min_coverage:,.0f} - ฿{p.max_coverage:,.0f}" if p.max_coverage > 0 else "ตามเงื่อนไข"
            confidence = "high" if not missing_info and eligibility_status == "eligible" else "medium" if eligibility_status == "eligible" else "low"

            match_item = ProductMatchOut(
                product_id=p.id,
                product_code=p.product_code,
                product_name=p.product_name,
                category=p.category,
                match_score=int(round(final_match_score)),
                eligibility_status=eligibility_status,
                reasons=reasons,
                unmet_criteria=unmet,
                coverage_range=cov_str,
                status="proposed",
                confidence_level=confidence,
                missing_information=missing_info,
                structured_explanation=structured_expl,
            )

            if eligibility_status == "eligible":
                eligible_matches.append(match_item)
            elif eligibility_status == "needs_verification":
                needs_verify_matches.append(match_item)

        # Sort eligible matches by score descending
        eligible_matches.sort(key=lambda x: x.match_score, reverse=True)
        needs_verify_matches.sort(key=lambda x: x.match_score, reverse=True)

        # Top-K Selection: Take Top eligible candidates (up to top_k_limit)
        final_recommendations = eligible_matches[:self.top_k_limit]
        if len(final_recommendations) < self.top_k_limit and needs_verify_matches:
            final_recommendations.extend(needs_verify_matches[: (self.top_k_limit - len(final_recommendations))])

        for rank, m in enumerate(final_recommendations, start=1):
            m.priority_rank = rank
            if rank == 1:
                m.rank_rationale = f"อันดับ 1 เนื่องจากมีระดับความต้องการสูงสุด ({needs_by_cat.get(PRODUCT_RULES.get(m.product_code, {}).get('need_category', ''), None).score if needs_by_cat.get(PRODUCT_RULES.get(m.product_code, {}).get('need_category', ''), None) else 0.5:.2f}) และไม่มีความคุ้มครองซ้ำซ้อน"
            elif rank == 2:
                m.rank_rationale = f"ทางเลือกอันดับ 2 เสริมความคุ้มครองด้าน {m.category}"
            elif rank == 3:
                m.rank_rationale = f"ทางเลือกอันดับ 3 ทางเลือกเพิ่มเติมสำหรับการจัดสรรเงินออมและบริหารความเสี่ยง"

        # Upsert recommendations into database
        for m in final_recommendations:
            rec_stmt = select(Recommendation).where(
                Recommendation.customer_id == customer.id,
                Recommendation.product_id == m.product_id,
            )
            rec_res = await db.execute(rec_stmt)
            rec_obj = rec_res.scalar_one_or_none()
            if not rec_obj:
                rec_obj = Recommendation(
                    customer_id=customer.id,
                    product_id=m.product_id,
                    rationale=" · ".join(m.reasons),
                    priority_rank=m.priority_rank,
                    status=m.status,
                    generated_at=datetime.now(timezone.utc),
                )
                db.add(rec_obj)
                await db.flush()
            m.recommendation_id = rec_obj.id
            m.status = rec_obj.status

        await db.commit()

        return CustomerRecommendationsResponse(
            customer_id=customer.id,
            external_ref=getattr(customer, "external_ref", ""),
            full_name=getattr(customer, "full_name", ""),
            recommendations=final_recommendations,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )


# Global instance
matching_service = ProductMatchingService()
