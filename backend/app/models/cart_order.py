from sqlalchemy import Column, Integer, String, Text,DECIMAL, TIMESTAMP, Enum, ForeignKey, text
from sqlalchemy.orm import relationship
from db import session

class Cart(session):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer,ForeignKey("users.id"),unique=True,nullable=False)
    created_at = Column(TIMESTAMP,server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(TIMESTAMP,server_default=text("CURRENT_TIMESTAMP"),onupdate=text("CURRENT_TIMESTAMP"))

    user = relationship("User", back_populates="cart")
    cart_items = relationship("CartItem",back_populates="cart",cascade="all, delete-orphan")


class CartItem(session):
    __tablename__ = "cart_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    cart_id = Column(Integer,ForeignKey("carts.id"),nullable=False)
    product_sku_id = Column(Integer,ForeignKey("product_skus.id"),nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(TIMESTAMP,server_default=text("CURRENT_TIMESTAMP"))

    cart = relationship("Cart", back_populates="cart_items")
    product_sku = relationship("ProductSKU")


class Order(session):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_code = Column(String(50), unique=True, nullable=False)
    user_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    receiver_name = Column(String(150), nullable=False)
    receiver_phone = Column(String(20), nullable=False)
    shipping_address = Column(Text, nullable=False)

    payment_method = Column(Enum("COD", name="payment_method_enum"),nullable=False,default="COD",server_default="COD")
    shipping_fee = Column(DECIMAL(12, 2),nullable=False,default=0,server_default="0")
    total_amount = Column(DECIMAL(12, 2), nullable=False)
    status = Column(Enum("PENDING","CONFIRMED","SHIPPING","COMPLETED","CANCELLED",name="order_status_enum"),nullable=False,default="PENDING",server_default="PENDING")

    created_at = Column(TIMESTAMP,server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(TIMESTAMP,server_default=text("CURRENT_TIMESTAMP"),onupdate=text("CURRENT_TIMESTAMP"))
    user = relationship("User", back_populates="orders")
    order_items = relationship("OrderItem",back_populates="order",cascade="all, delete-orphan")


class OrderItem(session):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer,ForeignKey("orders.id"),nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_order = Column(DECIMAL(12, 2), nullable=False)
    condition_at_order = Column(Enum("MOI", "CU", name="product_condition_enum"),nullable=False)

    order = relationship("Order", back_populates="order_items")
    product_sku = relationship("ProductSKU")