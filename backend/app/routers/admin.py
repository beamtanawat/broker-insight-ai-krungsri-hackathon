"""Admin management router: user administration, product management, audit inspection."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.core.deps import require_role
from app.core.security import hash_password
from app.models.user import User
from app.models.role import Role
from app.models.audit_log import AuditLog
from app.schemas.admin import UserCreate, UserUpdate, UserOut, UserListResponse

router = APIRouter()


@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = Query(None, description="Filter by role: admin, manager, broker"),
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: List all system users."""
    query = select(User)
    if role:
        query = query.where(User.role == role)

    count_query = select(func.count(User.id))
    if role:
        count_query = count_query.where(User.role == role)
    total_res = await db.execute(count_query)
    total = total_res.scalar_one()

    offset = (page - 1) * page_size
    result = await db.execute(
        query.order_by(desc(User.created_at)).offset(offset).limit(page_size)
    )
    users = result.scalars().all()

    return UserListResponse(
        items=[UserOut.model_validate(u) for u in users],
        total=total,
    )


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Create a new user with hashed password."""
    # Check if email exists
    exist = await db.execute(select(User).where(User.email == body.email))
    if exist.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    # Check role
    role_res = await db.execute(select(Role).where(Role.name == body.role))
    role_obj = role_res.scalar_one_or_none()

    new_user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
        role_id=role_obj.id if role_obj else None,
        is_active=True,
    )
    db.add(new_user)
    await db.flush()

    # Log audit
    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE_USER",
        entity_type="USER",
        entity_id=new_user.id,
        metadata_={"created_email": body.email, "role": body.role},
    )
    db.add(audit)
    await db.commit()

    return UserOut.model_validate(new_user)


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    body: UserUpdate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Update user details or toggle active status."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found",
        )

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.role is not None:
        user.role = body.role
        role_res = await db.execute(select(Role).where(Role.name == body.role))
        role_obj = role_res.scalar_one_or_none()
        if role_obj:
            user.role_id = role_obj.id

    # Log audit
    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE_USER",
        entity_type="USER",
        entity_id=user.id,
        metadata_={"updated_fields": body.model_dump(exclude_unset=True)},
    )
    db.add(audit)
    await db.commit()

    return UserOut.model_validate(user)
