"""Authenticated cart and atomic COD checkout."""
from decimal import Decimal
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select, delete
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, require_customer
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.catalog import ProductSku
from app.models.order import Cart, CartItem, Order, OrderItem, OrderStatusEnum

router = APIRouter()

class Quantity(BaseModel):
    quantity: int = Field(gt=0, strict=True)

class CheckoutItem(Quantity):
    product_sku_id: int = Field(gt=0, strict=True)

class Checkout(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    receiver_name: str = Field(min_length=1, max_length=150)
    receiver_phone: str = Field(min_length=9, max_length=20)
    shipping_address: str = Field(min_length=1)
    items: list[CheckoutItem] | None = Field(default=None, min_length=1, max_length=200)
    request_id: UUID | None = None

def cart(db, user):
    db.scalar(select(User).where(User.id == user.id).with_for_update())
    row = db.scalar(select(Cart).where(Cart.user_id == user.id).with_for_update())
    if row is None:
        row = Cart(user_id=user.id)
        db.add(row)
        db.flush()
    return row

def sellable(db, sku_id):
    sku = db.scalar(select(ProductSku).where(ProductSku.id == sku_id).with_for_update())
    if sku is None or sku.product.status.value != 'ACTIVE':
        raise HTTPException(409, 'SKU không được bán')
    return sku

@router.get('/cart', tags=['Cart'])
def read_cart(db: Session = Depends(get_db), user: User = Depends(require_customer)):
    row = cart(db, user)
    result = [{'product_sku_id': i.product_sku_id, 'quantity': i.quantity,
               'unit': i.product_sku.unit, 'price': i.product_sku.price,
               'subtotal': i.quantity * i.product_sku.price} for i in row.items]
    db.commit()
    return {'items': result, 'total_amount': sum((i['subtotal'] for i in result), Decimal(0))}

def change_cart(sku_id, data, add, db, user):
    row = cart(db, user)
    sku = sellable(db, sku_id)
    item = db.scalar(select(CartItem).where(CartItem.cart_id == row.id, CartItem.product_sku_id == sku_id))
    quantity = data.quantity + (item.quantity if item and add else 0)
    if quantity > sku.stock:
        raise HTTPException(409, 'Số lượng vượt tồn kho')
    if item:
        item.quantity = quantity
    else:
        db.add(CartItem(cart_id=row.id, product_sku_id=sku_id, quantity=quantity))
    db.commit()
    return {'product_sku_id': sku_id, 'quantity': quantity}

@router.post('/cart/items/{sku_id}', tags=['Cart'])
def add_item(sku_id: int, data: Quantity, db: Session = Depends(get_db), user: User = Depends(require_customer)):
    return change_cart(sku_id, data, True, db, user)

@router.put('/cart/items/{sku_id}', tags=['Cart'])
def set_item(sku_id: int, data: Quantity, db: Session = Depends(get_db), user: User = Depends(require_customer)):
    return change_cart(sku_id, data, False, db, user)

@router.delete('/cart/items/{sku_id}', tags=['Cart'], status_code=204)
def remove_item(sku_id: int, db: Session = Depends(get_db), user: User = Depends(require_customer)):
    row = cart(db, user)
    db.execute(delete(CartItem).where(CartItem.cart_id == row.id, CartItem.product_sku_id == sku_id))
    db.commit()

@router.post('/orders', tags=['Orders'], status_code=201)
def checkout(data: Checkout, db: Session = Depends(get_db), user: User = Depends(require_customer)):
    row = cart(db, user)
    order_code = 'ORD-' + (data.request_id or uuid4()).hex
    if data.request_id:
        previous = db.scalar(select(Order).where(Order.order_code == order_code).with_for_update())
        if previous:
            if previous.user_id != user.id:
                raise HTTPException(409, 'Mã yêu cầu đã được sử dụng')
            return checkout_result(previous)
    cart_items = [] if data.items else list(db.scalars(
        select(CartItem).where(CartItem.cart_id == row.id).with_for_update()
    ))
    items = {item.product_sku_id: item.quantity for item in (data.items or cart_items)}
    if not items:
        raise HTTPException(409, 'Giỏ hàng rỗng')
    if data.items and len(items) != len(data.items):
        raise HTTPException(422, 'SKU bị trùng trong đơn hàng')
    order = Order(order_code=order_code, user_id=user.id,
                  **data.model_dump(exclude={'items', 'request_id'}), shipping_fee=0, total_amount=0)
    db.add(order)
    db.flush()
    total = Decimal(0)
    for sku_id, quantity in sorted(items.items()):
        sku = sellable(db, sku_id)
        if sku.stock < quantity:
            raise HTTPException(409, 'Không đủ tồn kho')
        total += sku.price * quantity
        sku.stock -= quantity
        db.add(OrderItem(order_id=order.id, product_sku_id=sku.id, quantity=quantity,
                         price_at_order=sku.price, condition_at_order=sku.product.condition_type.value))
    for item in cart_items:
        db.delete(item)
    order.total_amount = total
    db.commit()
    return checkout_result(order)

def checkout_result(order: Order):
    return {'id': order.id, 'order_code': order.order_code, 'total_amount': order.total_amount,
            'shipping_fee': order.shipping_fee, 'payment_method': order.payment_method}

@router.get('/orders', tags=['Orders'])
def orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = select(Order).order_by(Order.id.desc())
    if user.role != UserRole.ADMIN:
        query = query.where(Order.user_id == user.id)
    return list(db.scalars(query))

@router.get('/orders/{order_id}', tags=['Orders'])
def order_detail(order_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = db.get(Order, order_id)
    if order is None or (user.role != UserRole.ADMIN and order.user_id != user.id):
        raise HTTPException(404, 'Không tìm thấy đơn')
    return {'order': order, 'items': [
        {'id': item.id, 'product_sku_id': item.product_sku_id, 'quantity': item.quantity,
         'price_at_order': item.price_at_order, 'condition_at_order': item.condition_at_order,
         'sku_code': item.product_sku.sku_code, 'product_name': item.product_sku.product.name,
         'size': item.product_sku.size, 'color': item.product_sku.color, 'unit': item.product_sku.unit,
         'image_url': next((image.image_url for image in item.product_sku.product.images if image.is_primary), None)}
        for item in order.items
    ]}

class OrderState(BaseModel):
    status: OrderStatusEnum

@router.patch('/orders/{order_id}/status', tags=['Orders'])
def order_status(order_id: int, data: OrderState, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if order is None or (user.role != UserRole.ADMIN and order.user_id != user.id):
        raise HTTPException(404, 'Không tìm thấy đơn')
    old, new = order.status.value, data.status.value
    allowed = {'PENDING': {'CONFIRMED', 'CANCELLED'}, 'CONFIRMED': {'SHIPPING', 'CANCELLED'},
               'SHIPPING': {'COMPLETED', 'CANCELLED'}}
    if user.role != UserRole.ADMIN:
        allowed = {'PENDING': {'CANCELLED'}}
    if new not in allowed.get(old, set()):
        raise HTTPException(409, 'Chuyển trạng thái không hợp lệ')
    if new == 'CANCELLED':
        for item in sorted(order.items, key=lambda i: i.product_sku_id):
            sku = db.scalar(select(ProductSku).where(ProductSku.id == item.product_sku_id).with_for_update())
            sku.stock += item.quantity
    order.status = data.status
    db.commit()
    return {'id': order.id, 'status': new}
