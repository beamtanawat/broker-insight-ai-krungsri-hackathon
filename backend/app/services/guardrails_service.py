"""
AI Guardrails and Output Validation Service.
Provides robust input sanitization, prompt injection defense, secret/PII stripping,
strict output schema validation, prohibited regulatory language filtering,
groundedness verification, and safe fallback triggers.
"""
from datetime import datetime, timezone
import json
import re
from typing import Any, Dict, List, Optional, Tuple
import structlog
from pydantic import BaseModel, Field, ValidationError

logger = structlog.get_logger()

# ── 1. PROHIBITED REGULATORY & SALES LANGUAGE PATTERNS ──
PROHIBITED_PATTERNS = [
    # Guaranteed Returns & Financial Outcomes
    (r"(รับประกันผลตอบแทน|การันตีผลกำไร|ไม่มีทางขาดทุน|กำไรแน่นอน\s*100%|รับประกันผลลัพธ์|ไม่มีความเสี่ยงอย่างแน่นอน)", "guaranteed_return_claim"),
    # Coercive Pressure Tactics
    (r"(ต้องซื้อทันที|บังคับทำสัญญา|ห้ามปฏิเสธ|ปิดการขายด่วน|ซื้อเดี๋ยวนี้|อย่ารอช้าต้องตัดสินใจตอนนี้|บังคับซื้อ)", "coercive_sales_pressure"),
    # Deceptive Claims
    (r"(คุ้มครองทุกกรณีไม่มีข้อยกเว้น|ธนาคารแห่งประเทศไทยรับรองผลกำไร|ไม่มีวันถูกยกเลิกสัญญา)", "deceptive_claim"),
    # Secret / System Prompt Exposure
    (r"(SYSTEM_PROMPT|GEMINI_API_KEY|SECRET_KEY|DATABASE_URL|password_hash|sk-[a-zA-Z0-9]{20,})", "system_secret_leak"),
    # False Finality (Bypassing Human Broker)
    (r"(ลูกค้ายอมรับสัญญาเรียบร้อยแล้ว|การทำสัญญาเสร็จสิ้นสมบูรณ์โดยอัตโนมัติ)", "false_finality_claim"),
]

# ── 2. PROMPT INJECTION PATTERNS ──
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"disregard\s+(all\s+)?(previous|prior)\s+instructions",
    r"system\s+override",
    r"you\s+are\s+now\s+(an?\s+)?unfiltered",
    r"reveal\s+(the\s+)?(system\s+prompt|secret|api[_\s]?key|password)",
    r"print\s+(the\s+)?(system\s+prompt|instructions)",
    r"dan\s+mode",
    r"developer\s+mode\s+enabled",
    r"prompt\s+injection",
    r"bypass\s+safety\s+filters",
]

# Sensitive keys that must be stripped before LLM input
SENSITIVE_KEYS_TO_STRIP = {
    "national_id",
    "citizen_id",
    "id_card",
    "bank_account_number",
    "account_number",
    "credit_card",
    "phone_number",
    "phone",
    "email",
    "password",
    "password_hash",
    "token",
    "access_token",
    "refresh_token",
    "api_key",
    "secret",
    "authorization",
    "cookie",
    "session_id",
    "address",
    "full_address",
}


# ── Pydantic Output Validation Schemas ──

class ValidatedCustomerInsightSchema(BaseModel):
    customer_summary: str = Field(..., min_length=10)
    key_observations: List[str] = Field(..., min_length=1)
    potential_needs: List[str] = Field(..., min_length=1)
    conversation_topics: List[str] = Field(..., min_length=1)
    cautions: List[str] = Field(..., min_length=1)


class ValidatedConversationGuideSchema(BaseModel):
    conversation_objective: str = Field(..., min_length=5)
    suggested_opening: str = Field(..., min_length=10)
    suggested_questions: List[str] = Field(..., min_length=2)
    topics_to_explore: List[str] = Field(..., min_length=2)
    potential_concerns: List[str] = Field(..., min_length=1)
    follow_up_questions: Optional[List[str]] = Field(default_factory=list)


class AIGuardrailsService:
    """Service to enforce input sanitization, prompt injection defense, and output verification."""

    @classmethod
    def sanitize_input(cls, customer_data: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
        """
        Sanitizes input data before sending to LLM:
        - Strips secrets, authentication tokens, and sensitive PII
        - Detects and neutralizes prompt injection attempts
        - Normalizes numerical and string formats
        """
        sanitized = {}
        flags_detected = []

        for k, v in customer_data.items():
            k_lower = str(k).lower()
            # 1. Strip sensitive keys
            if k_lower in SENSITIVE_KEYS_TO_STRIP or any(s in k_lower for s in ["token", "secret", "password", "api_key"]):
                flags_detected.append(f"stripped_sensitive_key:{k}")
                continue

            # 2. String values: check prompt injection & normalize
            if isinstance(v, str):
                v_clean = v.strip()
                # Check injection patterns
                for pat in INJECTION_PATTERNS:
                    if re.search(pat, v_clean, re.IGNORECASE):
                        flags_detected.append(f"prompt_injection_neutralized_in:{k}")
                        v_clean = re.sub(pat, "[FILTERED_SECURITY_VIOLATION]", v_clean, flags=re.IGNORECASE)
                sanitized[k] = v_clean
            elif isinstance(v, (int, float)):
                # Normalize numerical values
                sanitized[k] = max(0.0, float(v))
            elif isinstance(v, list):
                # Clean list of strings
                cleaned_list = []
                for item in v:
                    if isinstance(item, str):
                        item_clean = item.strip()
                        for pat in INJECTION_PATTERNS:
                            if re.search(pat, item_clean, re.IGNORECASE):
                                flags_detected.append(f"prompt_injection_neutralized_in_list:{k}")
                                item_clean = re.sub(pat, "[FILTERED_SECURITY_VIOLATION]", item_clean, flags=re.IGNORECASE)
                        cleaned_list.append(item_clean)
                    else:
                        cleaned_list.append(item)
                sanitized[k] = cleaned_list
            else:
                sanitized[k] = v

        return sanitized, flags_detected

    @classmethod
    def check_prohibited_content(cls, text_corpus: str) -> List[str]:
        """Scans text corpus against prohibited regulatory and deceptive patterns."""
        violations = []
        for pattern, label in PROHIBITED_PATTERNS:
            matches = re.findall(pattern, text_corpus, re.IGNORECASE)
            if matches:
                violations.append(f"{label}:{len(matches)}_occurrences")
        return violations

    @classmethod
    def check_groundedness(cls, output_data: Dict[str, Any], input_data: Dict[str, Any]) -> List[str]:
        """
        Validates whether output claims are grounded in supplied input data.
        Returns list of detected ungrounded assertions.
        """
        issues = []
        all_output_text = " ".join([
            str(output_data.get("customer_summary", "")),
            " ".join(output_data.get("key_observations", [])),
            " ".join(output_data.get("potential_needs", [])),
            " ".join(output_data.get("conversation_topics", [])),
            str(output_data.get("conversation_objective", "")),
            str(output_data.get("suggested_opening", "")),
        ])

        # 1. Zero liabilities contradiction
        if input_data.get("total_liabilities", 0.0) == 0 and not input_data.get("has_active_loan"):
            if any(term in all_output_text for term in ["หนี้สินท่วมตัว", "มีหนี้ก้อนโต", "ภาระหนี้สินล้นพ้น"]):
                issues.append("ungrounded_claim:alleged_high_debt_for_debt_free_customer")

        # 2. Zero policies contradiction
        if len(input_data.get("policies", [])) == 0:
            if "มีความคุ้มครองครอบคลุมมากเกินพอ" in all_output_text or "มีประกันครบทุกด้านแล้ว" in all_output_text:
                issues.append("ungrounded_claim:alleged_excess_coverage_for_uninsured_customer")

        return issues

    @classmethod
    def validate_insight_output(
        cls,
        raw_output: Dict[str, Any],
        input_data: Dict[str, Any],
    ) -> Tuple[bool, Dict[str, Any], Dict[str, Any]]:
        """
        Validates LLM Customer Insight output against:
        1. Pydantic schema
        2. Prohibited content filter
        3. Groundedness verifier
        Returns: (is_valid, sanitized_output_or_fallback, guardrail_audit_log)
        """
        audit_log = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "schema_validated": False,
            "prohibited_content_violations": [],
            "groundedness_violations": [],
            "guardrail_status": "passed",
            "human_review_required": True,
        }

        # 1. Schema Validation
        try:
            validated = ValidatedCustomerInsightSchema(**raw_output)
            audit_log["schema_validated"] = True
        except (ValidationError, TypeError) as e:
            audit_log["schema_validated"] = False
            audit_log["guardrail_status"] = "schema_validation_failed"
            logger.warning("llm_insight_schema_validation_failed", error=str(e))
            return False, raw_output, audit_log

        # 2. Prohibited Content Check
        all_text = " ".join([
            validated.customer_summary,
            " ".join(validated.key_observations),
            " ".join(validated.potential_needs),
            " ".join(validated.conversation_topics),
            " ".join(validated.cautions),
        ])
        prohibited_violations = cls.check_prohibited_content(all_text)
        if prohibited_violations:
            audit_log["prohibited_content_violations"] = prohibited_violations
            audit_log["guardrail_status"] = "prohibited_content_blocked"
            logger.warning("llm_insight_prohibited_content_blocked", violations=prohibited_violations)
            return False, raw_output, audit_log

        # 3. Groundedness Check
        groundedness_violations = cls.check_groundedness(validated.model_dump(), input_data)
        if groundedness_violations:
            audit_log["groundedness_violations"] = groundedness_violations
            audit_log["guardrail_status"] = "groundedness_check_failed"
            logger.warning("llm_insight_groundedness_check_failed", violations=groundedness_violations)
            return False, raw_output, audit_log

        # All Guardrails Passed
        clean_dict = validated.model_dump()
        clean_dict["guardrail_status"] = "passed"
        clean_dict["human_review_required"] = True
        return True, clean_dict, audit_log

    @classmethod
    def validate_conversation_output(
        cls,
        raw_output: Dict[str, Any],
        input_data: Dict[str, Any],
    ) -> Tuple[bool, Dict[str, Any], Dict[str, Any]]:
        """
        Validates LLM Conversation Guide output against:
        1. Pydantic schema
        2. Prohibited content filter
        3. Groundedness verifier
        """
        audit_log = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "schema_validated": False,
            "prohibited_content_violations": [],
            "groundedness_violations": [],
            "guardrail_status": "passed",
            "human_review_required": True,
        }

        # 1. Schema Validation
        try:
            validated = ValidatedConversationGuideSchema(**raw_output)
            audit_log["schema_validated"] = True
        except (ValidationError, TypeError) as e:
            audit_log["schema_validated"] = False
            audit_log["guardrail_status"] = "schema_validation_failed"
            logger.warning("llm_conversation_schema_validation_failed", error=str(e))
            return False, raw_output, audit_log

        # 2. Prohibited Content Check
        all_text = " ".join([
            validated.conversation_objective,
            validated.suggested_opening,
            " ".join(validated.suggested_questions),
            " ".join(validated.topics_to_explore),
            " ".join(validated.potential_concerns),
            " ".join(validated.follow_up_questions or []),
        ])
        prohibited_violations = cls.check_prohibited_content(all_text)
        if prohibited_violations:
            audit_log["prohibited_content_violations"] = prohibited_violations
            audit_log["guardrail_status"] = "prohibited_content_blocked"
            logger.warning("llm_conversation_prohibited_content_blocked", violations=prohibited_violations)
            return False, raw_output, audit_log

        # 3. Groundedness Check
        groundedness_violations = cls.check_groundedness(validated.model_dump(), input_data)
        if groundedness_violations:
            audit_log["groundedness_violations"] = groundedness_violations
            audit_log["guardrail_status"] = "groundedness_check_failed"
            return False, raw_output, audit_log

        clean_dict = validated.model_dump()
        clean_dict["guardrail_status"] = "passed"
        clean_dict["human_review_required"] = True
        return True, clean_dict, audit_log
