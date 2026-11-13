from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import cart_service

router = APIRouter(prefix="/cart", tags=["Cart"])


# Xem giỏ hàng
@router.get("/{user_id}")
def get_cart(
    user_id: int,
    db: Session = Depends(get_db)
):
    return cart_service.get_cart(db, user_id)


# Thêm SKU vào giỏ hàng
@router.post("/{user_id}/items")
def add_cart_item(
    user_id: int,
    product_sku_id: int,
    quantity: int,
    db: Session = Depends(get_db)
):
    item = cart_service.add_cart_item(
        db, user_id, product_sku_id, quantity
    )

    return {
        "message": "Thêm SKU thành công",
        "item_id": item.id,
        "quantity": item.quantity
    }


# Sửa số lượng SKU
@router.put("/{user_id}/items/{item_id}")
def update_cart_item(
    user_id: int,
    item_id: int,
    quantity: int,
    db: Session = Depends(get_db)
):
    item = cart_service.update_cart_item(
        db, user_id, item_id, quantity
    )

    return {
        "message": "Cập nhật thành công",
        "item_id": item.id,
        "quantity": item.quantity
    }


# Xóa SKU
@router.delete("/{user_id}/items/{item_id}")
def delete_cart_item(
    user_id: int,
    item_id: int,
    db: Session = Depends(get_db)
):
    return cart_service.delete_cart_item(
        db, user_id, item_id
    )