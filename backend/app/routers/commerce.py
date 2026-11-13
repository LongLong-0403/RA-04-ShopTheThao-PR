"""Authenticated cart and atomic COD checkout."""
from decimal import Decimal
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select, delete
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.catalog import ProductSku, Product
from app.models.order import Cart, CartItem, Order, OrderItem, OrderStatusEnum

router = APIRouter()

class Quantity(BaseModel):
    quantity: int = Field(gt=0, strict=True)

class Checkout(BaseModel):
    model_config = ConfigDict(extra='forbid')
    receiver_name: str = Field(min_length=1, max_length=150)
    receiver_phone: str = Field(min_length=9, max_length=20)
    shipping_address: str = Field(min_length=1)

def customer(user):
    if user.role != UserRole.CUSTOMER:
        raise HTTPException(403, 'Chỉ CUSTOMER được giao dịch')

def cart(db, user):
    customer(user)
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
def read_cart(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
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
def add_item(sku_id: int, data: Quantity, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return change_cart(sku_id, data, True, db, user)

@router.put('/cart/items/{sku_id}', tags=['Cart'])
def set_item(sku_id: int, data: Quantity, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return change_cart(sku_id, data, False, db, user)

@router.delete('/cart/items/{sku_id}', tags=['Cart'], status_code=204)
def remove_item(sku_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = cart(db, user)
    db.execute(delete(CartItem).where(CartItem.cart_id == row.id, CartItem.product_sku_id == sku_id))
    db.commit()

@router.post('/orders', tags=['Orders'], status_code=201)
def checkout(data: Checkout, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = cart(db, user)
    items = list(db.scalars(select(CartItem).where(CartItem.cart_id == row.id).order_by(CartItem.product_sku_id).with_for_update()))
    if not items:
        raise HTTPException(409, 'Giỏ hàng rỗng')
    order = Order(order_code='ORD-' + uuid4().hex, user_id=user.id, **data.model_dump(), shipping_fee=0, total_amount=0)
    db.add(order)
    db.flush()
    total = Decimal(0)
    for item in items:
        sku = sellable(db, item.product_sku_id)
        if sku.stock < item.quantity:
            raise HTTPException(409, 'Không đủ tồn kho')
        total += sku.price * item.quantity
        sku.stock -= item.quantity
        db.add(OrderItem(order_id=order.id, product_sku_id=sku.id, quantity=item.quantity,
                         price_at_order=sku.price, condition_at_order=sku.product.condition_type.value))
        db.delete(item)
    order.total_amount = total
    db.commit()
    return {'id': order.id, 'order_code': order.order_code, 'total_amount': total, 'shipping_fee': 0, 'payment_method': 'COD'}

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
    return {'order': order, 'items': order.items}

class OrderState(BaseModel):
    status: OrderStatusEnum

@router.patch('/orders/{order_id}/status', tags=['Orders'])
def order_status(order_id: int, data: OrderState, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if order is None or (user.role != UserRole.ADMIN and order.user_id != user.id):
        raise HTTPException(404, 'Không tìm thấy đơn')
    old, new = order.status.value, data.status.value
    allowed = {'PENDING': {'CONFIRMED', 'CANCELLED'}, 'CONFIRMED': {'SHIPPING', 'CANCELLED'}, 'SHIPPING': {'COMPLETED'}}
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
