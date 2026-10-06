"""
Streaming chat service — uses Gemini with SSE to power the AI conversation assistant.
"""
import warnings
from typing import AsyncGenerator

with warnings.catch_warnings():
    warnings.filterwarnings("ignore", category=FutureWarning)
    import google.generativeai as genai

from app.core.config import settings
from app.models.audit_log import ConversationMessage

SYSTEM_PROMPT = """คุณคือผู้ช่วย AI สำหรับนายหน้าประกันของธนาคารกรุงศรีอยุธยา

บทบาทของคุณ:
- ช่วยนายหน้าประกันทบทวนข้อมูลลูกค้าและเตรียมการสนทนา
- ตอบคำถามเกี่ยวกับข้อมูลลูกค้า (ข้อมูลจำลองเท่านั้น)
- แนะนำหัวข้อการพูดคุยที่เหมาะสม

กฎสำคัญ:
- ระบบนี้เป็นต้นแบบสาธิต ใช้ข้อมูลจำลองเท่านั้น ไม่ใช่ข้อมูลลูกค้าจริง
- ห้ามแนะนำผลิตภัณฑ์หรือสร้างสคริปต์การขาย
- นายหน้าประกันต้องตรวจสอบและตัดสินใจเอง
- ตอบเป็นภาษาไทยเสมอ กระชับและเป็นประโยชน์"""


async def stream_chat(
    user_message: str,
    history: list[ConversationMessage],
    customer_id: str | None,
    db,
) -> AsyncGenerator[str, None]:
    if not settings.GOOGLE_API_KEY:
        # Fallback stream without API key
        fallback = (
            "ขออภัย ระบบยังไม่ได้กำหนดค่า GOOGLE_API_KEY "
            "กรุณาเพิ่ม API key ใน .env เพื่อใช้งานฟีเจอร์นี้ "
            "[ต้นแบบ: ข้อความสำรองแบบ offline]"
        )
        for word in fallback.split(" "):
            yield word + " "
        return

    genai.configure(api_key=settings.GOOGLE_API_KEY)
    model = genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL,
        system_instruction=SYSTEM_PROMPT,
        generation_config={"temperature": 0.6, "max_output_tokens": 1024},
    )

    # Build Gemini chat history format
    gemini_history = []
    for msg in history[-10:]:  # last 10 turns for context window
        gemini_history.append({
            "role": "user" if msg.role == "user" else "model",
            "parts": [msg.content],
        })

    chat = model.start_chat(history=gemini_history)
    response = chat.send_message(user_message, stream=True)

    for chunk in response:
        if chunk.text:
            yield chunk.text
