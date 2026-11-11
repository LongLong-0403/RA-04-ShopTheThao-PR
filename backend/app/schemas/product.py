from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.catalog import ConditionEnum, UnitEnum


class ProductSkuOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sku_code: str
    size: str | None
    color: str | None
    price: float
    stock: int
    unit: UnitEnum
    quantity_per_lot: int


class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    is_primary: bool
    sort_order: int


class ProductListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    specifications: dict[str, Any] | None
    condition_type: ConditionEnum
    wear_description: str | None
    sport_id: int
    sport_name: str
    category_id: int
    category_name: str
    brand_id: int
    brand_name: str
    primary_image_url: str | None
    min_price: float


class ProductDetail(ProductListItem):
    skus: list[ProductSkuOut] = Field(default_factory=list)
    images: list[ProductImageOut] = Field(default_factory=list)


class ProductListResponse(BaseModel):
    items: list[ProductListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
