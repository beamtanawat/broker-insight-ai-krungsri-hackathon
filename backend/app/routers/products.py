"""Product catalog router with Admin management."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductListResponse, ProductOut, ProductCreate, ProductUpdate

router = APIRouter()


@router.get("", response_model=ProductListResponse)
async def list_products(
    category: Optional[str] = Query(None, description="Filter by category (e.g. Life, Health, Investment)"),
    is_active: bool = Query(True, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
):
    """List available insurance and financial products in catalog."""
    query = select(Product).where(Product.is_active == is_active)
    if category:
        query = query.where(Product.category.ilike(f"%{category}%"))

    result = await db.execute(query.order_by(Product.category, Product.product_name))
    products = result.scalars().all()

    return ProductListResponse(
        items=[ProductOut.model_validate(p) for p in products],
        total=len(products),
    )


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Add a new product to demo catalog."""
    exist = await db.execute(select(Product).where(Product.product_code == body.product_code))
    if exist.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product code '{body.product_code}' already exists",
        )

    product = Product(
        product_code=body.product_code,
        product_name=body.product_name,
        category=body.category,
        description=body.description,
        min_coverage=body.min_coverage,
        max_coverage=body.max_coverage,
        is_active=body.is_active,
    )
    db.add(product)
    await db.commit()
    return ProductOut.model_validate(product)


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    body: ProductUpdate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Update product information or availability."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id '{product_id}' not found",
        )

    if body.product_name is not None:
        product.product_name = body.product_name
    if body.category is not None:
        product.category = body.category
    if body.description is not None:
        product.description = body.description
    if body.min_coverage is not None:
        product.min_coverage = body.min_coverage
    if body.max_coverage is not None:
        product.max_coverage = body.max_coverage
    if body.is_active is not None:
        product.is_active = body.is_active

    await db.commit()
    return ProductOut.model_validate(product)
