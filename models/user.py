import enum
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Enum, TIMESTAMP, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.order import Cart, Order
    from app.models.court import CourtBooking, MatchPost, BuybackRequest


class RoleEnum(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    ADMIN = "ADMIN"


class UserStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    LOCKED = "LOCKED"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="Định danh duy nhất người dùng")
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, comment="Email đăng nhập duy nhất")
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False, comment="Mật khẩu băm bcrypt")
    full_name: Mapped[str] = mapped_column(String(150), nullable=False, comment="Họ và tên người dùng")
    phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True, comment="Số điện thoại liên hệ")
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="Địa chỉ mặc định")
    role: Mapped[RoleEnum] = mapped_column(
        Enum(RoleEnum), nullable=False, default=RoleEnum.CUSTOMER, comment="Vai trò người dùng"
    )
    status: Mapped[UserStatusEnum] = mapped_column(
        Enum(UserStatusEnum), nullable=False, default=UserStatusEnum.ACTIVE, comment="Trạng thái tài khoản"
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp(), comment="Thời điểm tạo tài khoản"
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        comment="Thời điểm cập nhật",
    )

    # Relationships
    cart: Mapped[Optional["Cart"]] = relationship("Cart", back_populates="user", uselist=False, cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="user")
    court_bookings: Mapped[List["CourtBooking"]] = relationship("CourtBooking", back_populates="user")
    match_posts: Mapped[List["MatchPost"]] = relationship("MatchPost", back_populates="user")
    buyback_requests: Mapped[List["BuybackRequest"]] = relationship("BuybackRequest", back_populates="user")

    __table_args__ = (
        Index("idx_users_role_status", "role", "status"),
        {"comment": "Bảng quản lý tài khoản người dùng và phân quyền"}
    )
