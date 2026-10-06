"""
Customer Need Analysis Service.
Evaluates 5 structured need categories based on customer profile, financial metrics,
and existing insurance policies using prudent, non-coercive advisory language.
"""
from datetime import date, datetime, timezone
from typing import Any, Dict, List
from app.schemas.recommendation import NeedCategoryScore, CustomerNeedAnalysisResponse


class NeedAnalysisService:
    """Evaluates customer needs across 5 canonical insurance categories."""

    def analyze_customer_needs(self, customer: Any) -> CustomerNeedAnalysisResponse:
        today = date.today()
        prof = getattr(customer, "profile", None)
        fin = getattr(customer, "financial_profile", None)
        policies = getattr(customer, "insurance_policies", []) or []
        followups = getattr(customer, "follow_ups", []) or []

        age = getattr(prof, "age", 40) if prof and prof.age else 40
        assets = getattr(fin, "total_assets", 0.0) if fin else 0.0
        liabilities = getattr(fin, "total_liabilities", 0.0) if fin else 0.0
        savings = getattr(fin, "monthly_savings", 0.0) if fin else 0.0
        has_loan = getattr(fin, "has_active_loan", False) if fin else False

        active_policies = [p for p in policies if getattr(p, "status", "") == "Active"]
        total_cov = sum(getattr(p, "coverage_amount", 0.0) for p in active_policies)
        has_health = any("Health" in getattr(p, "policy_type", "") or "เฮลท์" in getattr(p, "policy_type", "") for p in active_policies)
        has_life = any("Life" in getattr(p, "policy_type", "") or "ไลฟ์" in getattr(p, "policy_type", "") for p in active_policies)
        has_pension = any("Pension" in getattr(p, "policy_type", "") or "บำนาญ" in getattr(p, "policy_type", "") or "Retire" in getattr(p, "policy_type", "") for p in active_policies)
        has_mrta = any("MRTA" in getattr(p, "policy_type", "") or "สินเชื่อ" in getattr(p, "policy_type", "") for p in active_policies)

        # Nearest renewal check
        renewal_days = []
        for p in active_policies:
            ren_d = getattr(p, "renewal_date", None)
            if ren_d:
                delta = (ren_d - today).days
                if delta >= 0:
                    renewal_days.append(delta)
        min_renewal = min(renewal_days) if renewal_days else 365

        needs_list: List[NeedCategoryScore] = []

        # ── 1. Health Protection ──
        health_signals = []
        health_score = 0.20
        if not has_health:
            health_signals.append("ยังไม่มีบันทึกประกันสุขภาพหรือโรคร้ายแรงในระบบ")
            health_score += 0.45
        if age >= 40:
            health_signals.append(f"อายุ {age} ปี อยู่ในเกณฑ์ที่ค่ารักษาพยาบาลและโอกาสเกิดโรคไม่ติดต่อเรื้อรังสูงขึ้น")
            health_score += 0.20
        if savings > 10000:
            health_signals.append("มีกระแสเงินสดและเงินออมเพียงพอสำหรับจัดสรรความคุ้มครองสุขภาพ")
            health_score += 0.10

        health_severity = "high" if health_score >= 0.70 else "medium" if health_score >= 0.40 else "low"
        needs_list.append(NeedCategoryScore(
            category="Health protection",
            label_th="ความคุ้มครองสุขภาพและโรคร้ายแรง",
            score=min(1.0, round(health_score, 2)),
            severity=health_severity,
            supporting_signals=health_signals or ["มีความคุ้มครองพื้นฐานอยู่แล้ว"],
            explanation="Potential need: อาจเป็นโอกาสดีในการทบทวนวงเงินค่ารักษาพยาบาลและค่าชดเชยโรคร้ายแรงเพื่อให้สอดคล้องกับค่าครองชีพปัจจุบัน"
            if health_score >= 0.40 else "Consider discussing: ความคุ้มครองสุขภาพปัจจุบันอยู่ในเกณฑ์ที่ครอบคลุม แนะนำติดตามสิทธิประโยชน์ตามรอบ",
        ))

        # ── 2. Life Protection ──
        life_signals = []
        life_score = 0.20
        if not has_life:
            life_signals.append("ยังไม่มีกรมธรรม์ประกันชีวิตเพื่อคุ้มครองรายได้ครอบครัว")
            life_score += 0.40
        if liabilities > total_cov:
            life_signals.append(f"ทุนประกันรวม (฿{total_cov:,.0f}) ต่ำกว่าภาระหนี้สิน (฿{liabilities:,.0f})")
            life_score += 0.30
        if age <= 50 and (liabilities > 0 or savings > 5000):
            life_signals.append("อยู่ในวัยทำงานและเป็นเสาหลักของครอบครัว")
            life_score += 0.15

        life_severity = "high" if life_score >= 0.70 else "medium" if life_score >= 0.40 else "low"
        needs_list.append(NeedCategoryScore(
            category="Life protection",
            label_th="ความคุ้มครองชีวิตและรายได้ครอบครัว",
            score=min(1.0, round(life_score, 2)),
            severity=life_severity,
            supporting_signals=life_signals or ["มีทุนประกันชีวิตสอดคล้องกับภาระผูกพัน"],
            explanation="May warrant review: ควรพิจารณาทบทวนทุนประกันชีวิตให้ครอบคลุมภาระหนี้สินและค่าใช้จ่ายของคนในครอบครัวอย่างเพียงพอ"
            if life_score >= 0.40 else "Consider discussing: ทุนประกันชีวิตอยู่ในระดับเหมาะสม แนะนำตรวจสอบผู้รับผลประโยชน์ให้เป็นปัจจุบัน",
        ))

        # ── 3. Financial Protection (Debt & Assets) ──
        fin_signals = []
        fin_score = 0.10
        if has_loan and liabilities > 0:
            fin_signals.append(f"มีภาระสินเชื่อคงค้าง ฿{liabilities:,.0f}")
            fin_score += 0.45
            if not has_mrta:
                fin_signals.append("ยังไม่มีประกันคุ้มครองวงเงินสินเชื่อบ้าน (MRTA) ที่บันทึกไว้")
                fin_score += 0.30
        if total_cov < liabilities * 0.7:
            fin_signals.append("สัดส่วนความคุ้มครองรวมยังไม่ครอบคลุมภาระหนี้สิน")
            fin_score += 0.15

        fin_severity = "high" if fin_score >= 0.70 else "medium" if fin_score >= 0.40 else "low"
        needs_list.append(NeedCategoryScore(
            category="Financial protection",
            label_th="ความคุ้มครองภาระหนี้สินและสินทรัพย์",
            score=min(1.0, round(fin_score, 2)),
            severity=fin_severity,
            supporting_signals=fin_signals or ["ไม่มีภาระหนี้สินผูกพันที่มีนัยสำคัญ"],
            explanation="May warrant review: พิจารณาแผนคุ้มครองภาระสินเชื่อเพื่อป้องกันไม่ให้ภาระหนี้สินตกเป็นของครอบครัวในกรณีเกิดเหตุไม่คาดฝัน"
            if fin_score >= 0.40 else "Consider discussing: สถานะภาระหนี้สินและการคุ้มครองอยู่ในระดับที่ปลอดภัย",
        ))

        # ── 4. Retirement Planning ──
        ret_signals = []
        ret_score = 0.15
        if age >= 35 and not has_pension:
            ret_signals.append(f"อายุ {age} ปี และยังไม่มีประกันบำนาญหรือแผนออมเงินเกษียณอายุ")
            ret_score += 0.45
        if assets > 500000 and savings > 15000:
            ret_signals.append(f"มีเงินออมต่อเดือน (฿{savings:,.0f}) และสินทรัพย์ที่พร้อมจัดสรรเพื่อสิทธิประโยชน์ทางภาษี")
            ret_score += 0.25
        if age >= 45:
            ret_signals.append("เข้าสู่ช่วง 10-15 ปีก่อนเกษียณอายุ ควรเร่งสร้างกระแสเงินสดหลังเกษียณ")
            ret_score += 0.15

        ret_severity = "high" if ret_score >= 0.70 else "medium" if ret_score >= 0.40 else "low"
        needs_list.append(NeedCategoryScore(
            category="Retirement planning",
            label_th="การวางแผนเกษียณอายุและการออม",
            score=min(1.0, round(ret_score, 2)),
            severity=ret_severity,
            supporting_signals=ret_signals or ["มีการจัดสรรแผนเกษียณอายุหรืออายุน้อยกว่า 30 ปี"],
            explanation="Potential need: เหมาะสำหรับการนำเสนอแผนบำนาญหรือประกันสะสมทรัพย์ระยะยาวควบคู่สิทธิลดหย่อนภาษี"
            if ret_score >= 0.40 else "Consider discussing: ตรวจสอบเป้าหมายทางการเงินและสิทธิประโยชน์ทางภาษีตามรอบปี",
        ))

        # ── 5. Coverage Review ──
        rev_signals = []
        rev_score = 0.10
        if min_renewal <= 60:
            rev_signals.append(f"มีกรมธรรม์ที่จะถึงกำหนดต่ออายุภายใน {min_renewal} วัน")
            rev_score += 0.60
        if any(getattr(f, "payment_status", "") == "overdue" for f in followups):
            rev_signals.append("มีรายการติดตามเบี้ยประกันค้างชำระ")
            rev_score += 0.35
        if len(active_policies) > 0 and min_renewal > 60:
            rev_signals.append(f"มีกรมธรรม์ที่ถือครอง {len(active_policies)} ฉบับ ควรทบทวนความคุ้มครองประจำปี")
            rev_score += 0.20

        rev_severity = "high" if rev_score >= 0.70 else "medium" if rev_score >= 0.40 else "low"
        needs_list.append(NeedCategoryScore(
            category="Coverage review",
            label_th="การทบทวนปรับปรุงวงเงินคุ้มครองและต่ออายุ",
            score=min(1.0, round(rev_score, 2)),
            severity=rev_severity,
            supporting_signals=rev_signals or ["กรมธรรม์ทั้งหมดมีผลบังคับปกติและยังไม่ใกล้กำหนดต่ออายุ"],
            explanation="May warrant review: ควรติดต่อเพื่อแจ้งเตือนกำหนดการต่ออายุและแนะนำการปรับปรุงผลประโยชน์ให้ตรงกับช่วงชีวิต"
            if rev_score >= 0.40 else "Consider discussing: กรมธรรม์อยู่ในสถานะปกติ แนะนำประสานงานตามรอบปกติ",
        ))

        # Overall summary
        top_needs = [n for n in needs_list if n.severity in ("high", "medium")]
        if top_needs:
            top_names = ", ".join(n.label_th for n in top_needs[:2])
            overall = f"พบสัญญาณความต้องการที่ควรพิจารณาในด้าน: {top_names}"
        else:
            overall = "สถานะความคุ้มครองของลูกค้าครอบคลุมในเกณฑ์ดี แนะนำทบทวนสิทธิประโยชน์ประจำปี"

        return CustomerNeedAnalysisResponse(
            customer_id=customer.id,
            external_ref=getattr(customer, "external_ref", ""),
            full_name=getattr(customer, "full_name", ""),
            overall_need_summary=overall,
            needs=needs_list,
            evaluated_at=datetime.now(timezone.utc).isoformat(),
        )


# Global instance
need_service = NeedAnalysisService()
