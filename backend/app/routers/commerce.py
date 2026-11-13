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

from fastapi import Header
from sqlalchemy.exc import SQLAlchemyError
from pydantic import field_validator
import re

router = APIRouter()

class Quantity(BaseModel):
    quantity: int = Field(gt=0, strict=True)

class Checkout(BaseModel):
    model_config = ConfigDict(extra='forbid')
    receiver_name: str = Field(min_length=1, max_length=150)
    receiver_phone: str = Field(min_length=9, max_length=20)
    shipping_address: str = Field(min_length=1)
    @field_validator('receiver_name', 'shipping_address')
    @classmethod
    def validate_text(cls, value):
        value = value.strip()
        if not value:
            raise ValueError('Thông tin không được để trống')
        return value
    @field_validator('receiver_phone')
    @classmethod
    def validate_phone(cls, value):
        value = value.strip()
        if not re.fullmatch(r'0\d{8,10}', value):
            raise ValueError('Số điện thoại không hợp lệ')
        return value

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

def checkout_response(order):
    return {
        'id': order.id,
        'order_code': order.order_code,
        'total_amount': order.total_amount,
        'shipping_fee': order.shipping_fee,
        'payment_method': order.payment_method.value,
    }   

@router.post('/orders', tags=['Orders'], status_code=201)
def checkout(
    data: Checkout,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    idempotency_key: str = Header(..., alias='Idempotency-Key', min_length=1, max_length=64),
):
    try:
        customer(user)
        # Khóa user để hai yêu cầu checkout cùng tài khoản chạy tuần tự
        db.scalar(
            select(User)
            .where(User.id == user.id)
            .with_for_update()
        )
        # Kiểm tra yêu cầu đã xử lý trước đó chưa
        old_order = db.scalar(
            select(Order).where(
                Order.user_id == user.id,
                Order.idempotency_key == idempotency_key,
            )
        )
        if old_order:
            db.commit()
            return checkout_response(old_order)
        # Khóa giỏ hàng
        row = db.scalar(
            select(Cart)
            .where(Cart.user_id == user.id)
            .with_for_update()
        )
        if row is None:
            raise HTTPException(409, 'Giỏ hàng không tồn tại')
        items = list(db.scalars(
            select(CartItem)
            .where(CartItem.cart_id == row.id)
            .order_by(CartItem.product_sku_id)
            .with_for_update()
        ))
        if not items:
            raise HTTPException(409, 'Giỏ hàng rỗng')
        total = Decimal('0.00')
        order_items = []
        # Khóa từng SKU và kiểm tra tồn kho
        for item in items:
            sku = sellable(db, item.product_sku_id)
            if sku.stock < item.quantity:
                raise HTTPException(409, 'Không đủ tồn kho')
            total += sku.price * item.quantity
            order_items.append({
                'sku': sku,
                'quantity': item.quantity,
                'price': sku.price,
                'condition': sku.product.condition_type.value,
            })
        # Tạo đơn hàng
        order = Order(
            order_code='ORD-' + uuid4().hex,
            user_id=user.id,
            idempotency_key=idempotency_key,
            **data.model_dump(),
            shipping_fee=Decimal('0.00'),
            total_amount=total,
        )
        db.add(order)
        db.flush()
        # Tạo chi tiết đơn và trừ tồn kho
        for item in order_items:
            sku = item['sku']
            sku.stock -= item['quantity']
            db.add(OrderItem(
                order_id=order.id,
                product_sku_id=sku.id,
                quantity=item['quantity'],
                price_at_order=item['price'],
                condition_at_order=item['condition'],
            ))
        # Xóa sản phẩm khỏi giỏ
        for item in items:
            db.delete(item)
        # Chỉ commit một lần
        db.commit()
        db.refresh(order)
        return checkout_response(order)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(500, 'Lỗi xử lý đơn hàng')
    except Exception:
        db.rollback()
        raise

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
