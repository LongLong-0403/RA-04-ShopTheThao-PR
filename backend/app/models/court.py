import enum
from datetime import datetime, date, time
from decimal import Decimal
from typing import Optional, List, Any, TYPE_CHECKING
from sqlalchemy import (
    BigInteger,
    String,
    Text,
    Enum,
    TIMESTAMP,
    ForeignKey,
    JSON,
    Date,
    Time,
    DateTime,
    Numeric,
    CheckConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.catalog import Sport


class CommonStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class CourtStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    MAINTENANCE = "MAINTENANCE"
    INACTIVE = "INACTIVE"


class BookingStatusEnum(str, enum.Enum):
    CHO_XAC_NHAN = "CHO_XAC_NHAN"
    XAC_NHAN = "XAC_NHAN"
    TU_CHOI = "TU_CHOI"
    HUY = "HUY"


class MatchStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class BuybackStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    OFFERED = "OFFERED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# 1. Court
class Court(Base):
    __tablename__ = "courts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, comment="Định danh sân thể thao")
    sport_id: Mapped[int] = mapped_column(
        ForeignKey("sports.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Thuộc môn thể thao",
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False, comment="Tên sân")
    address: Mapped[str] = mapped_column(String(255), nullable=False, comment="Địa chỉ sân")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="Mô tả tiện ích, mặt sân")
    status: Mapped[CourtStatusEnum] = mapped_column(
        Enum(CourtStatusEnum),
        nullable=False,
        default=CourtStatusEnum.ACTIVE,
        index=True,
        comment="Trạng thái hoạt động",
    )

    # Relationships
    sport: Mapped["Sport"] = relationship("Sport", back_populates="courts")
    slots: Mapped[List["CourtSlot"]] = relationship("CourtSlot", back_populates="court", cascade="all, delete-orphan")
    bookings: Mapped[List["CourtBooking"]] = relationship("CourtBooking", back_populates="court")

    __table_args__ = {"comment": "Danh sách sân thể thao phục vụ đặt lịch"}


# 2. CourtSlot
class CourtSlot(Base):
    __tablename__ = "court_slots"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, comment="Định danh ca giờ")
    court_id: Mapped[int] = mapped_column(
        ForeignKey("courts.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Thuộc sân nào",
    )
    slot_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="Tên ca (VD: Ca 1: 06:00 - 08:00)")
    start_time: Mapped[time] = mapped_column(Time, nullable=False, comment="Giờ bắt đầu")
    end_time: Mapped[time] = mapped_column(Time, nullable=False, comment="Giờ kết thúc")
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, comment="Đơn giá thuê ca giờ")
    status: Mapped[CommonStatusEnum] = mapped_column(
        Enum(CommonStatusEnum), nullable=False, default=CommonStatusEnum.ACTIVE, comment="Trạng thái ca"
    )

    # Relationships
    court: Mapped["Court"] = relationship("Court", back_populates="slots")
    bookings: Mapped[List["CourtBooking"]] = relationship("CourtBooking", back_populates="court_slot")

    __table_args__ = (
        CheckConstraint("price >= 0", name="chk_court_slots_price"),
        {"comment": "Các khung ca giờ cố định và giá thuê của từng sân"},
    )


# 3. CourtBooking
class CourtBooking(Base):
    __tablename__ = "court_bookings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, comment="Định danh phiếu đặt sân")
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Khách hàng đặt sân",
    )
    court_id: Mapped[int] = mapped_column(
        ForeignKey("courts.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Sân được đặt",
    )
    court_slot_id: Mapped[int] = mapped_column(
        ForeignKey("court_slots.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Ca giờ được đặt",
    )
    booking_date: Mapped[date] = mapped_column(Date, nullable=False, comment="Ngày sử dụng sân")
    price_at_booking: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, comment="Giá ca giờ lưu cố định tại thời điểm đặt"
    )
    status: Mapped[BookingStatusEnum] = mapped_column(
        Enum(BookingStatusEnum),
        nullable=False,
        default=BookingStatusEnum.CHO_XAC_NHAN,
        comment="Trạng thái đặt sân",
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp(), comment="Thời gian tạo yêu cầu"
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        comment="Thời gian cập nhật",
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="court_bookings")
    court: Mapped["Court"] = relationship("Court", back_populates="bookings")
    court_slot: Mapped["CourtSlot"] = relationship("CourtSlot", back_populates="bookings")

    __table_args__ = (
        Index("idx_court_bookings_schedule", "court_id", "court_slot_id", "booking_date", "status"),
        CheckConstraint("price_at_booking >= 0", name="chk_court_bookings_price"),
        {"comment": "Lịch sử và phiếu đặt lịch sân thể thao"},
    )


# 4. MatchPost (Ghép kèo)
class MatchPost(Base):
    __tablename__ = "match_posts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, comment="Định danh bài đăng")
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Người đăng tin",
    )
    sport_id: Mapped[int] = mapped_column(
        ForeignKey("sports.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        comment="Môn thể thao cần ghép kèo",
    )
    match_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, comment="Ngày giờ giao lưu/thi đấu")
    location: Mapped[str] = mapped_column(String(255), nullable=False, comment="Địa điểm sân giao lưu")
    skill_level: Mapped[str] = mapped_column(String(100), nullable=False, comment="Trình độ")
    contact_info: Mapped[str] = mapped_column(String(255), nullable=False, comment="SĐT / Zalo liên hệ")
    status: Mapped[MatchStatusEnum] = mapped_column(
        Enum(MatchStatusEnum), nullable=False, default=MatchStatusEnum.OPEN, index=True, comment="Trạng thái tìm đối"
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp(), comment="Thời điểm đăng"
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="match_posts")
    sport: Mapped["Sport"] = relationship("Sport", back_populates="match_posts")

    __table_args__ = (
        Index("idx_match_posts_sport_time", "sport_id", "match_time"),
        {"comment": "Cộng đồng đăng tin tìm đối thủ và ghép kèo thể thao"},
    )


# 5. BuybackRequest (Thu mua đồ cũ)
class BuybackRequest(Base):
    __tablename__ = "buyback_requests"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, comment="Định danh yêu cầu thu mua")
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Khách hàng gửi yêu cầu",
    )
    sport_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("sports.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
        index=True,
        comment="Môn thể thao liên quan",
    )
    brand_model: Mapped[str] = mapped_column(String(255), nullable=False, comment="Hãng & Model đồ cũ")
    condition_detail: Mapped[str] = mapped_column(Text, nullable=False, comment="Mô tả tình trạng thực tế")
    expected_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, comment="Mức giá mong muốn bán của khách"
    )
    images: Mapped[Any] = mapped_column(JSON, nullable=False, comment="Danh sách URL hình ảnh thực tế (JSON Array)")
    offered_price: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2), nullable=True, comment="Mức giá đề nghị thu mua từ Admin"
    )
    status: Mapped[BuybackStatusEnum] = mapped_column(
        Enum(BuybackStatusEnum),
        nullable=False,
        default=BuybackStatusEnum.PENDING,
        index=True,
        comment="Trạng thái xử lý thu mua",
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp(), comment="Thời điểm gửi yêu cầu"
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        comment="Thời điểm cập nhật",
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="buyback_requests")
    sport: Mapped[Optional["Sport"]] = relationship("Sport", back_populates="buyback_requests")

    __table_args__ = (
        CheckConstraint("expected_price >= 0", name="chk_buyback_expected_price"),
        CheckConstraint("offered_price IS NULL OR offered_price >= 0", name="chk_buyback_offered_price"),
        {"comment": "Phiếu yêu cầu thu mua ký gửi đồ thể thao cũ (Buyback)"},
    )
