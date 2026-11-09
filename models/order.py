import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import (
    String,
    Text,
    Enum,
    TIMESTAMP,
    ForeignKey,
    Integer,
    Numeric,
    UniqueConstraint,
    CheckConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.catalog import ProductSku, ConditionEnum


class PaymentMethodEnum(str, enum.Enum):
    COD = "COD"


class OrderStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    SHIPPING = "SHIPPING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# 1. Cart
class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="Định danh giỏ hàng")
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"),
        unique=True,
        nullable=False,
        comment="Khách hàng sở hữu giỏ hàng",
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp(), comment="Thời điểm tạo giỏ"
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        comment="Thời điểm cập nhật",
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="cart")
    items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

    __table_args__ = {"comment": "Giỏ hàng của người dùng (1-1 với users)"}


# 2. CartItem
class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="Định danh dòng giỏ hàng")
    cart_id: Mapped[int] = mapped_column(
        ForeignKey("carts.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Thuộc giỏ hàng nào",
    )
    product_sku_id: Mapped[int] = mapped_column(
        ForeignKey("product_skus.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Tham chiếu biến thể SKU",
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1, comment="Số lượng chọn mua")
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp(), comment="Thời điểm thêm vào giỏ"
    )

    # Relationships
    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
    product_sku: Mapped["ProductSku"] = relationship("ProductSku", back_populates="cart_items")

    __table_args__ = (
        UniqueConstraint("cart_id", "product_sku_id", name="uk_cart_sku"),
        CheckConstraint("quantity > 0", name="chk_cart_items_qty"),
        {"comment": "Chi tiết các mặt hàng trong giỏ"},
    )


# 3. Order
class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="Định danh đơn hàng")
    order_code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, comment="Mã đơn hàng hiển thị duy nhất (VD: ORD-20261106-001)"
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Khách hàng đặt mua",
    )
    receiver_name: Mapped[str] = mapped_column(String(150), nullable=False, comment="Họ tên người nhận hàng")
    receiver_phone: Mapped[str] = mapped_column(String(20), nullable=False, comment="Số điện thoại người nhận")
    shipping_address: Mapped[str] = mapped_column(Text, nullable=False, comment="Địa chỉ giao hàng chi tiết")
    payment_method: Mapped[PaymentMethodEnum] = mapped_column(
        Enum(PaymentMethodEnum), nullable=False, default=PaymentMethodEnum.COD, comment="Phương thức COD"
    )
    shipping_fee: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00"), comment="Phí vận chuyển (0đ)"
    )
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, comment="Tổng tiền thanh toán của đơn hàng"
    )
    status: Mapped[OrderStatusEnum] = mapped_column(
        Enum(OrderStatusEnum),
        nullable=False,
        default=OrderStatusEnum.PENDING,
        index=True,
        comment="Trạng thái đơn hàng",
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=func.current_timestamp(),
        index=True,
        comment="Thời điểm đặt hàng",
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        comment="Thời điểm cập nhật",
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("shipping_fee >= 0", name="chk_orders_shipping_fee"),
        CheckConstraint("total_amount >= 0", name="chk_orders_total_amount"),
        {"comment": "Đơn hàng thương mại điện tử"},
    )


# 4. OrderItem
class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="Định danh chi tiết đơn hàng")
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Thuộc đơn hàng nào",
    )
    product_sku_id: Mapped[int] = mapped_column(
        ForeignKey("product_skus.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="SKU được đặt mua",
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, comment="Số lượng mua")
    price_at_order: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, comment="Giá SKU lưu cố định tại thời điểm đặt"
    )
    condition_at_order: Mapped[str] = mapped_column(
        String(10), nullable=False, comment="Tình trạng sản phẩm (MOI/CU) lúc đặt hàng"
    )

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product_sku: Mapped["ProductSku"] = relationship("ProductSku", back_populates="order_items")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_order_items_quantity"),
        CheckConstraint("price_at_order >= 0", name="chk_order_items_price"),
        {"comment": "Chi tiết các sản phẩm trong đơn hàng kèm lịch sử giá & tình trạng"},
    )
