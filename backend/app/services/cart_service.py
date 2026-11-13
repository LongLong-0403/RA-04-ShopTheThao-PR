from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.order import Cart, CartItem
from app.models.catalog import ProductSku


def get_user_cart(db: Session, user_id: int):
    cart = db.query(Cart).filter(
        Cart.user_id == user_id
    ).first()

    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    return cart


def get_cart(db: Session, user_id: int):
    cart = get_user_cart(db, user_id)

    items = db.query(CartItem).filter(
        CartItem.cart_id == cart.id
    ).all()

    result = []
    total = 0

    for item in items:
        sku = db.query(ProductSku).filter(
            ProductSku.id == item.product_sku_id
        ).first()

        if not sku:
            continue

        item_total = sku.price * item.quantity
        total += item_total

        result.append({
            "id": item.id,
            "product_sku_id": sku.id,
            "sku_code": sku.sku_code,
            "quantity": item.quantity,
            "unit": sku.unit.value,
            "price": float(sku.price),
            "item_total": float(item_total)
        })

    return {
        "cart_id": cart.id,
        "items": result,
        "total_amount": float(total)
    }


def add_cart_item(
    db: Session,
    user_id: int,
    product_sku_id: int,
    quantity: int
):
    if type(quantity) is not int or quantity <= 0:
        raise HTTPException(400, "Số lượng phải là số nguyên dương")

    sku = db.query(ProductSku).filter(
        ProductSku.id == product_sku_id
    ).first()

    if not sku:
        raise HTTPException(404, "SKU không tồn tại")

    cart = get_user_cart(db, user_id)

    item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_sku_id == product_sku_id
    ).first()

    new_quantity = quantity + item.quantity if item else quantity

    if new_quantity > sku.stock:
        raise HTTPException(400, "Số lượng vượt quá tồn kho")

    if item:
        item.quantity = new_quantity
    else:
        item = CartItem(
            cart_id=cart.id,
            product_sku_id=product_sku_id,
            quantity=quantity
        )
        db.add(item)

    db.commit()
    db.refresh(item)

    return item


def update_cart_item(
    db: Session,
    user_id: int,
    item_id: int,
    quantity: int
):
    if type(quantity) is not int or quantity <= 0:
        raise HTTPException(400, "Số lượng phải là số nguyên dương")

    cart = get_user_cart(db, user_id)

    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()

    if not item:
        raise HTTPException(404, "Sản phẩm không có trong giỏ hàng")

    sku = db.query(ProductSku).filter(
        ProductSku.id == item.product_sku_id
    ).first()

    if not sku:
        raise HTTPException(404, "SKU không tồn tại")

    if quantity > sku.stock:
        raise HTTPException(400, "Số lượng vượt quá tồn kho")

    item.quantity = quantity
    db.commit()
    db.refresh(item)

    return item


def delete_cart_item(
    db: Session,
    user_id: int,
    item_id: int
):
    cart = get_user_cart(db, user_id)

    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()

    if not item:
        raise HTTPException(404, "Sản phẩm không có trong giỏ hàng")

    db.delete(item)
    db.commit()

    return {"message": "Xóa sản phẩm thành công"}
