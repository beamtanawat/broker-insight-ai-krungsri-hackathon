"""Pydantic schemas for admin user management."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "broker"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    items: List[UserOut]
    total: int
