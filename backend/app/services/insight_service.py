"""
Gemini LLM service — generates customer insights and discussion topics in Thai.
Uses google-generativeai SDK with structured output parsing.
"""
import json
import warnings
from datetime import datetime, timezone

with warnings.catch_warnings():
    warnings.filterwarnings("ignore", category=FutureWarning)
    import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.customer import Customer
from app.models.insight import AIInsight
from app.models.ai_score import AIScore

PROMPT_VERSION = "v1"

SYSTEM_PROMPT = """คุณคือผู้ช่วย AI สำหรับนายหน้าประกันของธนาคารกรุงศรีอยุธยา
ระบบนี้เป็นต้นแบบสำหรับการสาธิตเท่านั้น และใช้ข้อมูลจำลอง
คุณช่วยนายหน้าประกันสรุปข้อมูลสำคัญและเตรียมการพูดคุยกับลูกค้า

กฎสำคัญ:
1. ห้ามแนะนำผลิตภัณฑ์ประกันหรือผลิตภัณฑ์ทางการเงินใดๆ โดยตรง
2. ข้อมูลทั้งหมดเป็นข้อมูลจำลอง ไม่ใช่ข้อมูลจริงของลูกค้า
3. นายหน้าประกันต้องตรวจสอบข้อมูลและเป็นผู้ตัดสินใจขั้นสุดท้ายเสมอ
4. ตอบเป็นภาษาไทยเสมอ
5. ตอบในรูปแบบ JSON เท่านั้น"""


def _build_user_prompt(customer: Customer, score: AIScore | None) -> str:
    snap = customer.financial_profile
    shap_reasons = []
    if score:
        shap_reasons = [r["label"] for r in (score.feature_importance or [])[:3]]

    return f"""สรุปข้อมูลลูกค้าสำหรับนายหน้าประกัน:

ชื่อลูกค้า: {customer.full_name}
สถานะ KYC: {customer.profile.kyc_status if customer.profile else "ไม่ระบุ"}
การติดต่อล่าสุด: {str(snap.last_financial_activity) if snap and snap.last_financial_activity else "ไม่ระบุ"}
คะแนนความสำคัญ: {score.score_display if score else "ไม่มี"}/100
สัญญาณสำคัญ: {", ".join(shap_reasons) if shap_reasons else "ไม่ระบุ"}

กรุณาสร้างผลลัพธ์ในรูปแบบ JSON ดังนี้:
{{
  "insight_text": "ข้อความสรุปข้อมูลลูกค้า 2-3 ประโยค",
  "discussion_topics": ["หัวข้อ 1", "หัวข้อ 2", "หัวข้อ 3"]
}}"""


async def generate_insight(
    customer: Customer,
    score: AIScore | None,
    db: AsyncSession,
) -> AIInsight:
    if not settings.GOOGLE_API_KEY:
        # Fallback when no API key configured (demo mode)
        insight_text = (
            f"ข้อมูลจำลองแสดงว่า {customer.full_name} มีสถานะ KYC {customer.kyc_status} "
            "นายหน้าประกันควรตรวจสอบรายละเอียดและติดต่อลูกค้าตามกำหนด "
            "[หมายเหตุ: ระบบยังไม่ได้กำหนดค่า GOOGLE_API_KEY — นี่คือข้อความสำรอง]"
        )
        topics = [
            "ทบทวนความคุ้มครองของกรมธรรม์ที่มีอยู่",
            "ยืนยันว่าข้อมูลลูกค้าเป็นปัจจุบัน",
            "สอบถามว่าความต้องการของลูกค้าเปลี่ยนแปลงหรือไม่",
        ]
        model_name = "fallback-demo"
    else:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=SYSTEM_PROMPT,
            generation_config={"temperature": 0.4, "max_output_tokens": 512},
        )

        prompt = _build_user_prompt(customer, score)
        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Parse JSON output
        try:
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()
            parsed = json.loads(raw)
            insight_text = parsed.get("insight_text", raw)
            topics = parsed.get("discussion_topics", [])
        except (json.JSONDecodeError, IndexError):
            insight_text = raw
            topics = []

        model_name = settings.GEMINI_MODEL

    insight = AIInsight(
        customer_id=customer.id,
        score_id=score.id if score else None,
        insight_text=insight_text,
        discussion_topics=topics,
        model=model_name,
        prompt_version=PROMPT_VERSION,
        generated_at=datetime.now(timezone.utc),
    )
    db.add(insight)
    await db.flush()
    return insight
