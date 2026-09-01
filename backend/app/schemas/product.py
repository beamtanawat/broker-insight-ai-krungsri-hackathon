"""Pydantic schemas for product endpoints."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ProductCreate(BaseModel):
    product_code: str
    product_name: str
    category: str
    description: Optional[str] = None
    min_coverage: float = 0.0
    max_coverage: float = 0.0
    is_active: bool = True


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    min_coverage: Optional[float] = None
    max_coverage: Optional[float] = None
    is_active: Optional[bool] = None


class ProductOut(BaseModel):
    id: str
    product_code: str
    product_name: str
    category: str
    description: Optional[str] = None
    min_coverage: float
    max_coverage: float
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: List[ProductOut]
    total: int
