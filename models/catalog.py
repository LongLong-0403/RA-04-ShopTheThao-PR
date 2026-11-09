import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any, TYPE_CHECKING
from sqlalchemy import (
    String,
    Text,
    Enum,
    TIMESTAMP,
    ForeignKey,
    JSON,
    Boolean,
    Integer,
    Numeric,
    CheckConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.court import Court, MatchPost, BuybackRequest
    from app.models.order import CartItem, OrderItem


class CommonStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class ConditionEnum(str, enum.Enum):
    MOI = "MOI"
    CU = "CU"


class ProductStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class UnitEnum(str, enum.Enum):
    CHIEC = "CHIEC"
    LO = "LO"


# 1. Sport
class Sport(Base):
    __tablename__ = "sports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="Định danh môn thể thao")
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="Tên môn thể thao")
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, comment="Đường dẫn tĩnh duy nhất")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="Mô tả môn thể thao")
    status: Mapped[CommonStatusEnum] = mapped_column(
        Enum(CommonStatusEnum), nullable=False, default=CommonStatusEnum.ACTIVE, comment="Trạng thái hiển thị"
    )

    # Relationships
    products: Mapped[List["Product"]] = relationship("Product", back_populates="sport")
    courts: Mapped[List["Court"]] = relationship("Court", back_populates="sport")
    match_posts: Mapped[List["MatchPost"]] = relationship("MatchPost", back_populates="sport")
    buyback_requests: Mapped[List["BuybackRequest"]] = relationship("BuybackRequest", back_populates="sport")

    __table_args__ = {"comment": "Danh mục môn thể thao"}


# 2. Category (cha/con)
class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="Định danh danh mục")
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
        index=True,
        comment="ID danh mục cha (NULL nếu là danh mục gốc)",
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False, comment="Tên danh mục")
    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, comment="Đường dẫn tĩnh duy nhất")
    status: Mapped[CommonStatusEnum] = mapped_column(
        Enum(CommonStatusEnum), nullable=False, default=CommonStatusEnum.ACTIVE, comment="Trạng thái hiển thị"
    )

    # Relationships
    parent: Mapped[Optional["Category"]] = relationship("Category", remote_side=[id], back_populates="children")
    children: Mapped[List["Category"]] = relationship("Category", back_populates="parent")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="category")

    __table_args__ = {"comment": "Danh mục sản phẩm hỗ trợ đa cấp cha - con"}


# 3. Brand
class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="Định danh thương hiệu")
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, comment="Tên thương hiệu")
    slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, comment="Đường dẫn tĩnh duy nhất")
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, comment="Ảnh logo thương hiệu")
    status: Mapped[CommonStatusEnum] = mapped_column(
        Enum(CommonStatusEnum), nullable=False, default=CommonStatusEnum.ACTIVE, comment="Trạng thái hiển thị"
    )

    # Relationships
    products: Mapped[List["Product"]] = relationship("Product", back_populates="brand")

    __table_args__ = {"comment": "Danh mục thương hiệu thể thao"}


# 4. Product (Hàng Mới & Hàng Cũ)
class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="Định danh sản phẩm")
    sport_id: Mapped[int] = mapped_column(
        ForeignKey("sports.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Thuộc môn thể thao",
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Thuộc danh mục",
    )
    brand_id: Mapped[int] = mapped_column(
        ForeignKey("brands.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Thuộc thương hiệu",
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, comment="Tên sản phẩm")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="Mô tả chi tiết sản phẩm")
    specifications: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True, comment="Thông số kỹ thuật JSON")
    condition_type: Mapped[ConditionEnum] = mapped_column(
        Enum(ConditionEnum), nullable=False, default=ConditionEnum.MOI, index=True, comment="Tình trạng: MOI / CU"
    )
    wear_description: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="Mô tả hao mòn (bắt buộc với hàng CU)"
    )
    status: Mapped[ProductStatusEnum] = mapped_column(
        Enum(ProductStatusEnum),
        nullable=False,
        default=ProductStatusEnum.ACTIVE,
        index=True,
        comment="Trạng thái sản phẩm",
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp(), comment="Thời điểm tạo"
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        comment="Thời điểm cập nhật",
    )

    # Relationships
    sport: Mapped["Sport"] = relationship("Sport", back_populates="products")
    category: Mapped["Category"] = relationship("Category", back_populates="products")
    brand: Mapped["Brand"] = relationship("Brand", back_populates="products")
    skus: Mapped[List["ProductSku"]] = relationship("ProductSku", back_populates="product", cascade="all, delete-orphan")
    images: Mapped[List["ProductImage"]] = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_products_filter", "sport_id", "category_id", "brand_id", "condition_type", "status"),
        {"comment": "Thông tin sản phẩm chung (Hàng Mới & Hàng Cũ)"},
    )


# 5. ProductSku
class ProductSku(Base):
    __tablename__ = "product_skus"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="Định danh SKU")
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Thuộc sản phẩm nào",
    )
    sku_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="Mã quản lý kho duy nhất")
    size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="Kích cỡ")
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="Màu sắc")
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, index=True, comment="Giá bán biến thể")
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="Số lượng tồn kho")
    unit: Mapped[UnitEnum] = mapped_column(
        Enum(UnitEnum), nullable=False, default=UnitEnum.CHIEC, comment="Đơn vị bán: CHIEC hoặc LO"
    )
    quantity_per_lot: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, comment="Số lượng sản phẩm trong 1 lô/ống"
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="skus")
    cart_items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="product_sku")
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="product_sku")

    __table_args__ = (
        CheckConstraint("price >= 0", name="chk_product_skus_price"),
        CheckConstraint("stock >= 0", name="chk_product_skus_stock"),
        CheckConstraint("quantity_per_lot >= 1", name="chk_product_skus_qty_lot"),
        {"comment": "Biến thể SKU chi tiết (size, màu, giá, tồn kho, đơn vị tính)"},
    )


# 6. ProductImage
class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="Định danh hình ảnh")
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
        comment="Thuộc sản phẩm",
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=False, comment="Đường dẫn ảnh")
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, comment="Ảnh đại diện chính")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="Thứ tự ưu tiên hiển thị")

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="images")

    __table_args__ = {"comment": "Danh sách hình ảnh sản phẩm"}
