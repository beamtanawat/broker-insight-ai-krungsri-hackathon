"""AI Chat router with SSE streaming."""
import uuid
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.audit_log import ConversationMessage
from app.schemas.score import ChatMessage
from app.services.chat_service import stream_chat

router = APIRouter()


@router.post("/")
async def chat(
    body: ChatMessage,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session_id = body.session_id or str(uuid.uuid4())

    # Load conversation history for context
    result = await db.execute(
        select(ConversationMessage)
        .where(ConversationMessage.session_id == session_id)
        .order_by(ConversationMessage.created_at)
    )
    history = result.scalars().all()

    # Save user message
    user_msg = ConversationMessage(
        session_id=session_id,
        customer_id=body.customer_id,
        user_id=current_user.id,
        role="user",
        content=body.content,
    )
    db.add(user_msg)
    await db.flush()

    async def event_generator():
        full_response = ""
        async for chunk in stream_chat(body.content, history, body.customer_id, db):
            full_response += chunk
            yield f"data: {json.dumps({'chunk': chunk, 'session_id': session_id})}\n\n"

        # Save assistant message
        async with db.begin_nested():
            assistant_msg = ConversationMessage(
                session_id=session_id,
                customer_id=body.customer_id,
                user_id=current_user.id,
                role="assistant",
                content=full_response,
            )
            db.add(assistant_msg)

        yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"

    await db.commit()
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/{session_id}")
async def get_history(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ConversationMessage)
        .where(
            ConversationMessage.session_id == session_id,
            ConversationMessage.user_id == current_user.id,
        )
        .order_by(ConversationMessage.created_at)
    )
    messages = result.scalars().all()
    return [
        {"role": m.role, "content": m.content, "created_at": m.created_at}
        for m in messages
    ]
