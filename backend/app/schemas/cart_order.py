from datetime import datetime
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class CartItemCreate(BaseModel):
    product_sku_id: int
    quantity: int = Field(default=1, gt=0)


class CartItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    cart_id: int
    product_sku_id: int
    quantity: int
    created_at: Optional[datetime] = None


class CartCreate(BaseModel):
    user_id: int


class CartResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    cart_items: List[CartItemResponse] = Field(default_factory=list, validation_alias="items")


class OrderItemCreate(BaseModel):
    product_sku_id: int
    quantity: int = Field(gt=0)


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    order_id: int
    product_sku_id: int
    quantity: int
    price_at_order: Decimal
    condition_at_order: Literal["MOI", "CU"]


# ORDER

class OrderCreate(BaseModel):
    receiver_name: str = Field(max_length=150)
    receiver_phone: str = Field(max_length=20)
    shipping_address: str
    payment_method: Literal["COD"] = "COD"
    shipping_fee: Decimal = Decimal("0")
    items: List[OrderItemCreate]


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    order_code: str
    user_id: int
    receiver_name: str
    receiver_phone: str
    shipping_address: str
    payment_method: str
    shipping_fee: Decimal
    total_amount: Decimal
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    order_items: List[OrderItemResponse] = Field(default_factory=list, validation_alias="items")
