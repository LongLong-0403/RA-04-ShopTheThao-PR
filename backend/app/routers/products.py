import math
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.crud import product as product_crud
from app.db.session import get_db
from app.models.catalog import ConditionEnum
from app.schemas.product import ProductDetail, ProductListItem, ProductListResponse

router = APIRouter(prefix="/products", tags=["Products"])


def _serialize(product, min_price: Decimal | float) -> ProductListItem:
    primary_image = next(
        (
            image.image_url
            for image in sorted(
                product.images,
                key=lambda image: (not image.is_primary, image.sort_order, image.id),
            )
        ),
        None,
    )
    return ProductListItem(
        id=product.id,
        name=product.name,
        description=product.description,
        specifications=product.specifications,
        condition_type=product.condition_type,
        wear_description=product.wear_description,
        sport_id=product.sport_id,
        sport_name=product.sport.name,
        category_id=product.category_id,
        category_name=product.category.name,
        brand_id=product.brand_id,
        brand_name=product.brand.name,
        primary_image_url=primary_image,
        min_price=min_price,
    )


@router.get("", response_model=ProductListResponse)
def list_products(
    q: str | None = Query(default=None, description="Tìm theo tên hoặc mô tả"),
    sport_id: int | None = Query(default=None, ge=1),
    category_id: int | None = Query(default=None, ge=1),
    brand_id: int | None = Query(default=None, ge=1),
    condition_type: str | None = Query(default=None, pattern="^(MOI|CU)$"),
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    sort: str = Query(default="newest", pattern="^(newest|price_asc|price_desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(status_code=422, detail="min_price không được lớn hơn max_price")
    rows, total = product_crud.list_products(
        db,
        q=q,
        sport_id=sport_id,
        category_id=category_id,
        brand_id=brand_id,
        condition_type=ConditionEnum(condition_type) if condition_type else None,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return ProductListResponse(
        items=[_serialize(product, price) for product, price in rows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 0,
    )


@router.get("/{product_id}", response_model=ProductDetail)
def get_product(product_id: int, db: Session = Depends(get_db)):
    row = product_crud.get_public_product(db, product_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm đang bán")
    product, price = row
    summary = _serialize(product, price)
    return ProductDetail(**summary.model_dump(), skus=product.skus, images=product.images)
