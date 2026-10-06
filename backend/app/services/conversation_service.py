"""
Conversation Assistant Service (Phase 25 Optimized).
Generates structured advisory dialogue guides, suggested questions, topics to explore,
and potential customer concerns using neutral, non-coercive advisory language.
Includes deterministic safe caching, token tracking, and structured fallback.
"""
import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import structlog

from app.core.config import settings
from app.schemas.conversation import ConversationAssistantResponse, ModelTraceabilityOut
from app.services.guardrails_service import AIGuardrailsService
from app.ml.llm_optimizer import TokenEstimator, llm_cache, llm_tracker

logger = structlog.get_logger()

PROMPT_VERSION = "v2.0-optimized"


class ConversationAssistantService:
    """Generates structured conversation guides for insurance and financial brokers with strict AI guardrails."""

    def __init__(self):
        self.api_key = getattr(settings, "GEMINI_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
        self.model_name = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")
        self.prompt_version = PROMPT_VERSION

    def _build_prompt_v1(self, customer_context: Dict[str, Any]) -> str:
        """Unoptimized Baseline Prompt (v1.0.0) for benchmark comparison."""
        return f"""คุณคือผู้ช่วยวางแผนบทสนทนาสำหรับนายหน้าประกันและที่ปรึกษาทางการเงิน (Broker Insight AI)
จงสร้างคู่มือบทสนทนา (Conversation Guide) เป็นภาษาไทยในรูปแบบ JSON เพื่อช่วยให้นายหน้าสื่อสารกับลูกค้าอย่างเป็นมืออาชีพ

[บริบทข้อมูลลูกค้า]:
- ชื่อและรหัส: {customer_context.get('full_name')} ({customer_context.get('external_ref')})
- อายุและอาชีพ: {customer_context.get('age', 40)} ปี, {customer_context.get('occupation', 'ไม่ระบุ')}
- สินทรัพย์ / หนี้สิน: ฿{customer_context.get('total_assets', 0):,.0f} / ฿{customer_context.get('total_liabilities', 0):,.0f}
- สถานะสินเชื่อ: {'มีสินเชื่อคงค้าง' if customer_context.get('has_active_loan') else 'ไม่มี'}
- กรมธรรม์ปัจจุบัน: {', '.join(customer_context.get('policies', [])) or 'ยังไม่มี'}
- คะแนน AI Priority: {customer_context.get('score', 50)}/100 (ระดับ {customer_context.get('priority_level', 'medium')})
- ปัจจัย SHAP หลัก: {', '.join(customer_context.get('top_factors', []))}
- สัญญาณความต้องการ: {', '.join(customer_context.get('needs', []))}
- ผลิตภัณฑ์ที่ระบบแนะนำเบื้องต้น: {', '.join(customer_context.get('recommended_products', []))}

ข้อกำหนดจริยธรรมที่เข้มงวด (Strict Advisory Guidelines):
1. ใช้ภาษาที่สุภาพ เป็นกลาง และให้เกียรติลูกค้า (Advisory & Consultative Tone)
2. ห้ามใช้กลยุทธ์กดดัน (No pressure tactics)
3. ห้ามอ้างผลตอบแทนหรือความคุ้มครองที่เกินจริง หรือรับประกันผลลัพธ์ที่ไม่มีอยู่จริง (No deceptive / guaranteed claims)
4. ห้ามใช้สคริปต์ปิดการขายแบบบังคับ (No manipulative closing scripts)
5. นายหน้าประกันต้องเป็นผู้ควบคุมและปรับใช้คำถามตามสถานการณ์จริง

ตอบกลับเป็น JSON ภาษาไทยที่มีโครงสร้างดังนี้เท่านั้น:
{{
  "conversation_objective": "วัตถุประสงค์หลักของการสนทนาอย่างสร้างสรรค์ 1 ประโยค",
  "suggested_opening": "ประโยคเปิดบทสนทนาที่นุ่มนวลและถามไถ่ความสะดวกของลูกค้า",
  "suggested_questions": ["คำถามปลายเปิดเพื่อสอบถามความต้องการและเป้าหมาย 3 ข้อ"],
  "topics_to_explore": ["ประเด็นหรือสาระสำคัญที่ควรชวนลูกค้าแลกเปลี่ยนความคิดเห็น 3 ข้อ"],
  "potential_concerns": ["ข้อกังวลที่ลูกค้าอาจมี เช่น ภาระเบี้ยประกัน หรือระยะเวลาผูกพัน 2-3 ข้อ"],
  "follow_up_questions": ["คำถามเพื่อต่อยอดบทสนทนาและสรุปความเข้าใจร่วมกัน 2-3 ข้อ"]
}}
"""

    def _build_prompt(self, customer_context: Dict[str, Any]) -> str:
        """
        Optimized High-Density Consultative Dialogue Prompt (v2.0-optimized).
        Reduces ~30% tokens while strictly maintaining consultative neutrality and safety rules.
        """
        compact_ctx = {
            "name_ref": f"{customer_context.get('full_name')} ({customer_context.get('external_ref')})",
            "profile": f"{customer_context.get('age', 40)}y, {customer_context.get('occupation', 'General')}",
            "finances": f"Assets:฿{customer_context.get('total_assets', 0):,.0f}, Debt:฿{customer_context.get('total_liabilities', 0):,.0f}",
            "policies": customer_context.get("policies", []),
            "priority": f"{customer_context.get('score', 50)}/100 ({customer_context.get('priority_level', 'medium')})",
            "focus_signals": (customer_context.get("top_factors", [])[:2] + customer_context.get("needs", [])[:2]),
            "prelim_products": customer_context.get("recommended_products", [])[:2],
        }

        return f"""สร้างคู่มือบทสนทนาที่ปรึกษาทางการเงิน (Broker Dialogue Guide) รูปแบบ JSON ภาษาไทย:
บริบทลูกค้า: {json.dumps(compact_ctx, ensure_ascii=False)}

กฎจริยธรรม:
1. ภาษาเป็นกลาง ให้เกียรติ ไม่กดดันปิดการขาย ไม่การันตีผลตอบแทน
2. มุ่งเน้นการสอบถามความต้องการและเป้าหมายชีวิตของลูกค้า

โครงสร้าง JSON:
{{
  "conversation_objective": "วัตถุประสงค์ 1 ประโยค",
  "suggested_opening": "ประโยคเปิดสนทนาที่สุภาพ 1 ประโยค",
  "suggested_questions": ["คำถามปลายเปิด 2-3 ข้อ"],
  "topics_to_explore": ["ประเด็นแลกเปลี่ยน 2-3 ข้อ"],
  "potential_concerns": ["ข้อกังวลของลูกค้า 1-2 ข้อ"],
  "follow_up_questions": ["คำถามต่อยอด 1-2 ข้อ"]
}}"""

    def generate_conversation_guide(
        self,
        customer_id: str,
        customer_context: Dict[str, Any],
    ) -> ConversationAssistantResponse:
        t_start = time.perf_counter()
        now_str = datetime.now(timezone.utc).isoformat()

        # 1. Input Guardrails
        sanitized_ctx, input_flags = AIGuardrailsService.sanitize_input(customer_context)

        # 2. Check Deterministic Safe Cache
        cached_guide = llm_cache.get(
            customer_id=customer_id,
            customer_data=sanitized_ctx,
            task="conversation",
            prompt_version=self.prompt_version,
            model_version=self.model_name,
        )
        if cached_guide:
            lat_ms = (time.perf_counter() - t_start) * 1000.0
            llm_tracker.record_call(
                task="conversation",
                model_name=self.model_name,
                prompt_version=self.prompt_version,
                input_tokens=0,
                output_tokens=0,
                latency_ms=lat_ms,
                cache_hit=True,
                fallback_used=False,
                guardrail_passed=True,
            )
            # Reconstruct response model from cached dict
            return ConversationAssistantResponse(**cached_guide)

        # 3. LLM Generation
        prompt = self._build_prompt(sanitized_ctx)
        input_tokens = TokenEstimator.estimate_tokens(prompt)

        if self.api_key:
            try:
                import warnings
                with warnings.catch_warnings():
                    warnings.filterwarnings("ignore", category=FutureWarning)
                    import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                model = genai.GenerativeModel(self.model_name)
                
                max_out = getattr(settings, "LLM_MAX_OUTPUT_TOKENS_CONVERSATION", 400)
                resp = model.generate_content(
                    prompt,
                    generation_config={
                        "response_mime_type": "application/json",
                        "max_output_tokens": max_out,
                        "temperature": 0.3,
                    }
                )
                if resp.text:
                    output_tokens = TokenEstimator.estimate_tokens(resp.text)
                    data = json.loads(resp.text)
                    
                    # 4. Output Guardrails
                    is_valid, validated_data, audit_log = AIGuardrailsService.validate_conversation_output(
                        data, sanitized_ctx
                    )
                    lat_ms = (time.perf_counter() - t_start) * 1000.0
                    
                    if is_valid:
                        res_obj = ConversationAssistantResponse(
                            customer_id=customer_id,
                            customer_name=sanitized_ctx.get("full_name", ""),
                            external_ref=sanitized_ctx.get("external_ref", ""),
                            conversation_objective=validated_data.get("conversation_objective", "สอบถามเป้าหมายและทบทวนความคุ้มครอง"),
                            suggested_opening=validated_data.get("suggested_opening", f"สวัสดีครับ/ค่ะ คุณ{sanitized_ctx.get('full_name')} สะดวกสนทนาสักครู่ไหมครับ"),
                            suggested_questions=validated_data.get("suggested_questions", []),
                            topics_to_explore=validated_data.get("topics_to_explore", []),
                            potential_concerns=validated_data.get("potential_concerns", []),
                            follow_up_questions=validated_data.get("follow_up_questions", []),
                            model_metadata=ModelTraceabilityOut(
                                model_name="Gemini Dialogue Assistant",
                                model_version=self.model_name,
                                timestamp=now_str,
                                provider="google_gemini",
                                disclaimer="คู่มือบทสนทนานี้เป็นคำแนะนำสำหรับนายหน้าประกัน ห้ามใช้เป็นสคริปต์บังคับปิดการขาย",
                            ),
                        )
                        # Save to cache
                        llm_cache.set(
                            customer_id=customer_id,
                            customer_data=sanitized_ctx,
                            task="conversation",
                            prompt_version=self.prompt_version,
                            model_version=self.model_name,
                            data=res_obj.model_dump(),
                        )
                        llm_tracker.record_call(
                            task="conversation",
                            model_name=self.model_name,
                            prompt_version=self.prompt_version,
                            input_tokens=input_tokens,
                            output_tokens=output_tokens,
                            latency_ms=lat_ms,
                            cache_hit=False,
                            fallback_used=False,
                            guardrail_passed=True,
                        )
                        return res_obj
                    else:
                        logger.warning("llm_conversation_guardrail_rejected_fallback", audit=audit_log)
                        llm_tracker.record_call(
                            task="conversation",
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
                logger.warning("llm_conversation_failed_fallback", error=str(e))

        # 5. Deterministic Structured Fallback
        fallback_resp = self._generate_deterministic_fallback(customer_id, sanitized_ctx)
        lat_ms = (time.perf_counter() - t_start) * 1000.0
        
        llm_cache.set(
            customer_id=customer_id,
            customer_data=sanitized_ctx,
            task="conversation",
            prompt_version=self.prompt_version,
            model_version="deterministic_dialogue_engine",
            data=fallback_resp.model_dump(),
        )
        llm_tracker.record_call(
            task="conversation",
            model_name="deterministic_dialogue_engine",
            prompt_version=self.prompt_version,
            input_tokens=input_tokens,
            output_tokens=TokenEstimator.estimate_tokens(json.dumps(fallback_resp.model_dump(), ensure_ascii=False)),
            latency_ms=lat_ms,
            cache_hit=False,
            fallback_used=True,
            guardrail_passed=True,
        )
        return fallback_resp

    def _generate_deterministic_fallback_v1(
        self, customer_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Baseline fallback dictionary for benchmark testing."""
        res = self._generate_deterministic_fallback(
            customer_context.get("id", "bench-id"), customer_context
        )
        return res.model_dump()

    def _generate_deterministic_fallback(
        self,
        customer_id: str,
        ctx: Dict[str, Any],
    ) -> ConversationAssistantResponse:
        """Deterministic rule-based consultative dialogue generation."""
        now_str = datetime.now(timezone.utc).isoformat()
        name = ctx.get("full_name", "ลูกค้า")
        score = ctx.get("score", 50)
        has_loan = ctx.get("has_active_loan", False)
        policies = ctx.get("policies", [])
        age = ctx.get("age", 40)

        # Objective
        if has_loan and len(policies) == 0:
            objective = "สอบถามความพร้อมและปรึกษาแนวทางการคุ้มครองภาระสินเชื่อและสวัสดิการครอบครัว"
        elif len(policies) >= 2:
            objective = "ทบทวนสิทธิประโยชน์และตรวจสอบความสอดคล้องของกรมธรรม์ที่มีอยู่กับเป้าหมายชีวิตปัจจุบัน"
        else:
            objective = "ทักทายอย่างอบอุ่นและสอบถามเป้าหมายการวางแผนทางการเงินและการบริหารความเสี่ยง"

        # Opening
        opening = f"สวัสดีครับ/ค่ะ คุณ{name} ผม/ดิฉัน จากธนาคารกรุงศรีอยุธยา ขออนุญาตติดต่อเพื่อสอบถามความสะดวกในการสนทนาสักครู่ครับ/ค่ะ"

        # Questions
        questions = [
            "ช่วงนี้เป้าหมายทางการเงินและการวางแผนครอบครัวของคุณมีส่วนใดที่อยากให้ทางเราช่วยดูแลเพิ่มเติมไหมครับ/ค่ะ?",
            "สำหรับสวัสดิการความคุ้มครองสุขภาพและอุบัติเหตุที่มีอยู่ตอนนี้ รู้สึกเพียงพอกับการดำเนินชีวิตในปัจจุบันไหมครับ/ค่ะ?",
        ]
        if has_loan:
            questions.append("ในส่วนของภาระสินเชื่อ มีการวางแผนแผนสำรองเพื่อความอุ่นใจของครอบครัวไว้บ้างแล้วหรือยังครับ/ค่ะ?")
        elif age >= 40:
            questions.append("สำหรับการเตรียมตัวและแผนการออมเงินเพื่อการเกษียณอายุ มีการจัดสรรเงินสำรองไว้ในรูปแบบใดบ้างครับ/ค่ะ?")
        else:
            questions.append("มีแผนการออมระยะยาวหรือการลดหย่อนภาษีช่วงปลายปีที่ต้องการปรึกษาเพิ่มเติมไหมครับ/ค่ะ?")

        # Topics
        topics = [
            "การตรวจเช็กความเพียงพอของวงเงินคุ้มครองค่ารักษาพยาบาลในปัจจุบัน",
            "สิทธิประโยชน์ทางภาษีและการจัดสรรเงินออมผ่านผลิตภัณฑ์ประกันชีวิต",
        ]
        if has_loan:
            topics.append("แนวทางการคุ้มครองความเสี่ยงภาระหนี้สินเพื่อไม่ให้กระทบต่อสินทรัพย์ครอบครัว")

        # Concerns
        concerns = [
            "ลูกค้าอาจกังวลเรื่องระยะเวลาผูกพันของการจ่ายเบี้ยประกัน (ควรเน้นย้ำความยืดหยุ่นและการเลือกแผนที่เหมาะสมกับรายได้)",
            "ลูกค้าอาจเข้าใจว่ามีความคุ้มครองจากประกันกลุ่มของที่ทำงานเพียงพอแล้ว (ควรชวนเปรียบเทียบสวัสดิการส่วนบุคคล)",
        ]

        # Follow-ups
        follow_ups = [
            "หากคุณลูกค้าสะดวก ขออนุญาตสรุปรายละเอียดและนำส่งข้อมูลเปรียบเทียบให้ทางช่องทางที่สะดวกครับ/ค่ะ",
            "สามารถนัดหมายเวลาที่สะดวกเพื่อให้คำปรึกษาเพิ่มเติมในรายละเอียดได้ตลอดเวลาครับ/ค่ะ",
        ]

        return ConversationAssistantResponse(
            customer_id=customer_id,
            customer_name=name,
            external_ref=ctx.get("external_ref", ""),
            conversation_objective=objective,
            suggested_opening=opening,
            suggested_questions=questions,
            topics_to_explore=topics,
            potential_concerns=concerns,
            follow_up_questions=follow_ups,
            model_metadata=ModelTraceabilityOut(
                model_name="Deterministic Dialogue Engine",
                model_version="RuleBased-v1.0",
                timestamp=now_str,
                provider="deterministic_rule_engine",
                disclaimer="คู่มือบทสนทนานี้เป็นแนวทางเบื้องต้นสำหรับนายหน้าประกันในการสื่อสารเชิงที่ปรึกษา ห้ามใช้กดดันหรือบังคับขาย",
            ),
        )


# Global instance
conversation_service = ConversationAssistantService()
