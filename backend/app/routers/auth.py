"""Auth router: login, refresh, logout, me with rate limiting and audit logging."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user
from app.core.rate_limiter import rate_limit
from app.core.audit import log_audit_event
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, UserOut

router = APIRouter()


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit(max_requests=15, window_seconds=60, key_prefix="auth_login"))],
)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account inactive")

    user.last_login = datetime.now(timezone.utc)
    
    # Audit log login (without logging raw password)
    await log_audit_event(
        db=db,
        user_id=user.id,
        action="LOGIN",
        entity_type="USER",
        entity_id=user.id,
        metadata={"email": user.email, "role": user.role},
    )
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="LOGOUT",
        entity_type="USER",
        entity_id=current_user.id,
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
    )
