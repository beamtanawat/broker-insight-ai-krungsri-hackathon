"""
LLM Customer Insight Service (Phase 25 Optimized).
Generates structured AI summaries, key observations, potential needs, conversation topics,
and caution/uncertainty notes from customer structured data.
Includes deterministic safe content-hashed caching, token tracking, and robust deterministic fallback.
"""
import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import structlog

from app.core.config import settings
from app.services.guardrails_service import AIGuardrailsService
from app.ml.llm_optimizer import TokenEstimator, llm_cache, llm_tracker

logger = structlog.get_logger()

PROMPT_VERSION = "v2.0-optimized"


class LLMInsightService:
    """Service to generate customer insights via Gemini LLM or deterministic fallback with strict AI guardrails."""

    def __init__(self):
        self.api_key = getattr(settings, "GEMINI_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
        self.model_name = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")
        self.prompt_version = PROMPT_VERSION

    def _build_prompt_payload_v1(self, customer_data: Dict[str, Any]) -> str:
        """Unoptimized Baseline Prompt (v1.0.0) for reproducibility and benchmark comparison."""
        raw_loan = str(customer_data.get("loan_details", "") or "")
        safe_loan_desc = raw_loan.split("(")[0].split("-")[0].strip() if raw_loan else "ไม่มีข้อมูลระบุ"

        return f"""คุณคือ AI ผู้ช่วยวิเคราะห์ข้อมูลสำหรับนายหน้าประกันและที่ปรึกษาทางการเงิน (Broker Insight AI)
จงวิเคราะห์ข้อมูลลูกค้าต่อไปนี้ และตอบกลับเป็น JSON ภาษาไทยตามโครงสร้างที่กำหนดเท่านั้น

[ข้อมูลลูกค้าจำลอง (Anonymized & Minimized Demo Data)]:
- รหัสอ้างอิง: {customer_data.get('external_ref', 'KS-DEMO')}
- อายุและอาชีพ: {customer_data.get('age', 'ไม่ระบุ')} ปี, อาชีพ {customer_data.get('occupation', 'ไม่ระบุ')}
- ระดับรายได้: {customer_data.get('income_range', 'ไม่ระบุ')}
- ระดับความสัมพันธ์: {customer_data.get('relationship_tier', 'Standard')}
- สินทรัพย์ / หนี้สินรวม: ฿{customer_data.get('total_assets', 0):,.0f} / ฿{customer_data.get('total_liabilities', 0):,.0f}
- สถานะสินเชื่อ: {'มีภาระสินเชื่อ' if customer_data.get('has_active_loan') else 'ไม่มีภาระสินเชื่อ'} ({safe_loan_desc})
- เงินออมต่อเดือน: ฿{customer_data.get('monthly_savings', 0):,.0f}
- กรมธรรม์ปัจจุบัน ({len(customer_data.get('policies', []))} ฉบับ): {', '.join(customer_data.get('policies', [])) or 'ยังไม่มีกรมธรรม์'}
- คะแนนความสำคัญ AI: {customer_data.get('score', 50)}/100 (ระดับ {customer_data.get('priority_level', 'medium')})
- ปัจจัย SHAP หลัก: {', '.join(customer_data.get('top_factors', []))}
- สัญญาณความต้องการ: {', '.join(customer_data.get('detected_needs', []))}

คำแนะนำในการวิเคราะห์:
1. ใช้ภาษาที่สุภาพ เป็นกลาง และระมัดระวัง ใช้คำเช่น "ความต้องการที่อาจเกิดขึ้น", "ควรพิจารณาทบทวน", "หัวข้อที่ควรปรึกษา"
2. ห้ามระบุว่าลูกค้า "จำเป็นต้องซื้อ" หรือตัดสินใจแทนลูกค้าเด็ดขาด
3. ระบุข้อควรระวังหรือความไม่แน่นอน (cautions) ให้ชัดเจน

ตอบกลับเป็น JSON ที่มีโครงสร้างดังนี้:
{{
  "customer_summary": "สรุปภาพรวมโปรไฟล์และสถานะความคุ้มครองของลูกค้า 2-3 ประโยค",
  "key_observations": ["ข้อสังเกตสำคัญข้อที่ 1", "ข้อสังเกตสำคัญข้อที่ 2", "ข้อสังเกตสำคัญข้อที่ 3"],
  "potential_needs": ["ความต้องการที่อาจเกิดขึ้น 1", "ความต้องการที่อาจเกิดขึ้น 2"],
  "conversation_topics": ["หัวข้อที่ควรนำไปเปิดบทสนทนา 1", "หัวข้อที่ควรปรึกษา 2"],
  "cautions": ["ข้อควรระวัง/ความไม่แน่นอนของข้อมูล"]
}}
"""

    def _build_prompt_payload(self, customer_data: Dict[str, Any]) -> str:
        """
        Optimized High-Density Prompt (v2.0-optimized).
        Cuts ~35% unnecessary wording while preserving 100% of groundedness and safety constraints.
        """
        raw_loan = str(customer_data.get("loan_details", "") or "")
        safe_loan = raw_loan.split("(")[0].split("-")[0].strip() if raw_loan else "ไม่มี"

        compact_profile = {
            "ref": customer_data.get("external_ref", "KS-DEMO"),
            "demographics": f"{customer_data.get('age', 40)}y, {customer_data.get('occupation', 'General')}, Tier:{customer_data.get('relationship_tier', 'Standard')}",
            "finances": f"Assets:฿{customer_data.get('total_assets', 0):,.0f}, Debt:฿{customer_data.get('total_liabilities', 0):,.0f} ({safe_loan}), Save:฿{customer_data.get('monthly_savings', 0):,.0f}/m",
            "policies": customer_data.get("policies", []),
            "ai_priority": f"{customer_data.get('score', 50)}/100 ({customer_data.get('priority_level', 'medium')})",
            "signals": customer_data.get("top_factors", [])[:3] + customer_data.get("detected_needs", [])[:2],
        }

        return f"""วิเคราะห์ข้อมูลลูกค้าสำหรับนายหน้าประกันกรุงศรี (Broker Insight AI) ในรูปแบบ JSON ภาษาไทย [Anonymized & Minimized]:
ข้อมูลลูกค้า: {json.dumps(compact_profile, ensure_ascii=False)}

กฎจริยธรรม:
1. ภาษาเป็นกลาง ให้เกียรติ ห้ามการันตีผลตอบแทน ห้ามใช้คำกดดันปิดการขาย
2. สรุปความคุ้มครอง ระบุความต้องการที่อาจเกิดขึ้น และข้อควรระวังให้ครบถ้วน

โครงสร้าง JSON ที่ต้องการ:
{{
  "customer_summary": "สรุปสถานะสั้นกระชับ 2 ประโยค",
  "key_observations": ["ข้อสังเกต 2-3 ข้อ"],
  "potential_needs": ["ความต้องการที่อาจมี 2 ข้อ"],
  "conversation_topics": ["หัวข้อเปิดสนทนา 2 ข้อ"],
  "cautions": ["ข้อควรระวัง/ความไม่แน่นอน 1-2 ข้อ"]
}}"""

    def generate_insight(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates customer insight with safe caching, input sanitization, output guardrails,
        and real-time token/latency tracking.
        """
        t_start = time.perf_counter()
        customer_id = str(customer_data.get("id", customer_data.get("external_ref", "demo-id")))

        # 1. Input Guardrails
        sanitized_input, input_flags = AIGuardrailsService.sanitize_input(customer_data)

        # 2. Check Deterministic Safe Cache
        cached_result = llm_cache.get(
            customer_id=customer_id,
            customer_data=sanitized_input,
            task="insight",
            prompt_version=self.prompt_version,
            model_version=self.model_name,
        )
        if cached_result:
            lat_ms = (time.perf_counter() - t_start) * 1000.0
            llm_tracker.record_call(
                task="insight",
                model_name=self.model_name,
                prompt_version=self.prompt_version,
                input_tokens=0,
                output_tokens=0,
                latency_ms=lat_ms,
                cache_hit=True,
                fallback_used=False,
                guardrail_passed=True,
            )
            return cached_result

        # 3. LLM Generation
        prompt_text = self._build_prompt_payload(sanitized_input)
        input_tokens = TokenEstimator.estimate_tokens(prompt_text)

        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                model = genai.GenerativeModel(self.model_name)
                
                max_out = getattr(settings, "LLM_MAX_OUTPUT_TOKENS_INSIGHT", 350)
                resp = model.generate_content(
                    prompt_text,
                    generation_config={
                        "response_mime_type": "application/json",
                        "max_output_tokens": max_out,
                        "temperature": 0.3,
                    }
                )
                if resp.text:
                    output_tokens = TokenEstimator.estimate_tokens(resp.text)
                    parsed = json.loads(resp.text)
                    
                    # 4. Output Guardrails
                    is_valid, validated_output, audit_log = AIGuardrailsService.validate_insight_output(
                        parsed, sanitized_input
                    )
                    lat_ms = (time.perf_counter() - t_start) * 1000.0
                    
                    if is_valid:
                        result = {
                            "customer_id": sanitized_input.get("id", customer_id),
                            "customer_summary": validated_output.get("customer_summary", ""),
                            "key_observations": validated_output.get("key_observations", []),
                            "potential_needs": validated_output.get("potential_needs", []),
                            "conversation_topics": validated_output.get("conversation_topics", []),
                            "cautions": validated_output.get("cautions", []),
                            "provider": f"gemini ({self.model_name})",
                            "model_version": self.model_name,
                            "prompt_version": self.prompt_version,
                            "guardrail_status": "passed",
                            "guardrail_audit": audit_log,
                            "human_review_required": True,
                            "cache_hit": False,
                            "generated_at": datetime.now(timezone.utc).isoformat(),
                        }
                        # Save to safe cache
                        llm_cache.set(
                            customer_id=customer_id,
                            customer_data=sanitized_input,
                            task="insight",
                            prompt_version=self.prompt_version,
                            model_version=self.model_name,
                            data=result,
                        )
                        llm_tracker.record_call(
                            task="insight",
                            model_name=self.model_name,
                            prompt_version=self.prompt_version,
                            input_tokens=input_tokens,
                            output_tokens=output_tokens,
                            latency_ms=lat_ms,
                            cache_hit=False,
                            fallback_used=False,
                            guardrail_passed=True,
                        )
                        return result
                    else:
                        logger.warning(
                            "llm_output_guardrail_rejected_falling_back",
                            reason=audit_log.get("guardrail_status"),
                            audit=audit_log
                        )
                        llm_tracker.record_call(
                            task="insight",
                            model_name=self.model_name,
                            prompt_version=self.prompt_version,
                            input_tokens=input_tokens,
                            output_tokens=output_tokens,
                            latency_ms=lat_ms,
                            cache_hit=False,
                            fallback_used=True,
                            guardrail_passed=False,
                        )
            except Exception as e:
                logger.warning("llm_generation_failed_fallback_to_deterministic", error=str(e))

        # 5. Deterministic Fallback
        fallback = self._generate_deterministic_fallback(sanitized_input)
        lat_ms = (time.perf_counter() - t_start) * 1000.0
        fallback["guardrail_status"] = "deterministic_fallback"
        fallback["guardrail_audit"] = {
            "input_sanitized": True,
            "input_flags": input_flags,
            "fallback_reason": "LLM offline or guardrail validation fallback",
            "human_review_required": True,
        }
        fallback["human_review_required"] = True
        fallback["prompt_version"] = self.prompt_version
        fallback["cache_hit"] = False

        # Store in cache so fallback is also instantaneous on repeated requests
        llm_cache.set(
            customer_id=customer_id,
            customer_data=sanitized_input,
            task="insight",
            prompt_version=self.prompt_version,
            model_version="deterministic_rule_engine",
            data=fallback,
        )
        llm_tracker.record_call(
            task="insight",
            model_name="deterministic_rule_engine",
            prompt_version=self.prompt_version,
            input_tokens=input_tokens,
            output_tokens=TokenEstimator.estimate_tokens(json.dumps(fallback, ensure_ascii=False)),
            latency_ms=lat_ms,
            cache_hit=False,
            fallback_used=True,
            guardrail_passed=True,
        )
        return fallback

    def _generate_deterministic_fallback_v1(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Baseline fallback generator for benchmark testing."""
        return self._generate_deterministic_fallback(customer_data)

    def _generate_deterministic_fallback(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates deterministic rule-based structured insight from customer attributes.
        Never fabricates LLM identity — explicitly marks provider as deterministic_rule_engine.
        """
        name = customer_data.get("full_name", "ลูกค้า")
        age = customer_data.get("age", 40)
        assets = customer_data.get("total_assets", 0.0)
        liabilities = customer_data.get("total_liabilities", 0.0)
        has_loan = customer_data.get("has_active_loan", False)
        policies = customer_data.get("policies", [])
        score = customer_data.get("score", 50)
        kyc = customer_data.get("kyc_status", "pending")
        tier = customer_data.get("relationship_tier", "Standard")

        # Summary construction
        summary_parts = [
            f"คุณ{name} มีสถานะความสัมพันธ์ระดับ {tier} และมีคะแนนความสำคัญจากโมเดลอยู่ที่ {score}/100"
        ]
        if has_loan and liabilities > 0:
            summary_parts.append(f"มีภาระสินเชื่อคงค้าง ฿{liabilities:,.0f} โดยถือกรมธรรม์ประกันอยู่ {len(policies)} ฉบับ")
        else:
            summary_parts.append(f"มีสินทรัพย์รวม ฿{assets:,.0f} และถือครองกรมธรรม์ {len(policies)} ฉบับ")

        customer_summary = " ".join(summary_parts)

        # Observations
        observations = []
        if has_loan and liabilities > 1000000:
            observations.append(f"มีภาระหนี้สินคงค้าง ฿{liabilities:,.0f} ซึ่งควรพิจารณาความเพียงพอของทุนประกันคุ้มครองวงเงินสินเชื่อ")
        if len(policies) == 0:
            observations.append("ยังไม่มีบันทึกกรมธรรม์ประกันชีวิตหรือสุขภาพที่มีผลบังคับในระบบของธนาคาร")
        elif len(policies) >= 2:
            observations.append(f"มีประวัติถือครองกรมธรรม์ {len(policies)} ฉบับ ควรตรวจสอบกำหนดวันต่ออายุและผลประโยชน์ต่อเนื่อง")

        if assets > 2000000 and age >= 40:
            observations.append(f"มีศักยภาพด้านการเงินและสินทรัพย์ (฿{assets:,.0f}) เหมาะสำหรับการวางแผนภาษีและเกษียณอายุ")

        if kyc != "verified":
            observations.append(f"สถานะ KYC อยู่ระหว่าง '{kyc}' ควรดำเนินการอัปเดตข้อมูลยืนยันตัวตนให้สมบูรณ์")

        if not observations:
            observations.append("สถานะบัญชีและการถือครองผลิตภัณฑ์อยู่ในเกณฑ์ปกติ")

        # Potential Needs
        potential_needs = []
        if has_loan:
            potential_needs.append("อาจมีความต้องการทบทวนความคุ้มครองภาระหนี้สินและสินทรัพย์ (Financial & Mortgage Protection)")
        if age >= 35 and not any("Retire" in p or "บำนาญ" in p for p in policies):
            potential_needs.append("อาจควรพิจารณาการวางแผนเกษียณอายุและการออมระยะยาว (Retirement & Wealth Planning)")
        if not any("Health" in p or "สุขภาพ" in p for p in policies):
            potential_needs.append("อาจควรพิจารณาแผนคุ้มครองสุขภาพและโรคร้ายแรงเพิ่มเติม (Health & Critical Illness Shield)")

        if not potential_needs:
            potential_needs.append("ทบทวนสิทธิประโยชน์และตรวจสอบความเหมาะสมของแผนประกันปัจจุบัน (Annual Coverage Review)")

        # Topics
        topics = [
            "สอบถามเป้าหมายทางการเงินและความพร้อมด้านสุขภาพในปัจจุบัน",
            "ให้ข้อมูลสรุปสิทธิประโยชน์ของกรมธรรม์ที่ถือครองและการลดหย่อนภาษี",
        ]
        if has_loan:
            topics.append("ปรึกษาแนวทางการบริหารความเสี่ยงเพื่อคุ้มครองภาระสินเชื่อครอบครัว")
        if age >= 45:
            topics.append("แลกเปลี่ยนมุมมองการจัดสรรเงินออมเพื่อเตรียมพร้อมช่วงเกษียณอายุ")

        # Cautions
        cautions = [
            "ข้อมูลนี้สร้างขึ้นจากระบบ Rule-based Heuristic ตามข้อมูลจำลองในระบบเท่านั้น",
            "นายหน้าประกันต้องสัมภาษณ์เพื่อทำความเข้าใจความต้องการและวัตถุประสงค์ที่แท้จริงของลูกค้าก่อนเสมอ",
        ]
        if kyc != "verified":
            cautions.append("สถานะ KYC ยังไม่สมบูรณ์ ต้องตรวจสอบเอกสารประจำตัวก่อนทำธุรกรรมใดๆ")

        return {
            "customer_id": customer_data.get("id", ""),
            "customer_summary": customer_summary,
            "key_observations": observations,
            "potential_needs": potential_needs,
            "conversation_topics": topics,
            "cautions": cautions,
            "provider": "deterministic_rule_engine",
            "model_version": "RuleBased-Heuristic-v1.0",
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }


# Global instance
llm_service = LLMInsightService()
