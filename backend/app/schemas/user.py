"""Schema dữ liệu vào/ra (Request/Response) cho Model User."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.user import UserRole, UserStatus


class UserBase(BaseModel):
    email: str = Field(
        min_length=5,
        max_length=255,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        examples=["khachhang1@sportstore.vn"],
    )
    full_name: str = Field(
        min_length=1,
        max_length=150,
        examples=["Nguyễn Văn An"],
    )
    phone: str = Field(
        min_length=9,
        max_length=20,
        examples=["0901234561"],
    )
    address: str | None = Field(
        default=None,
        examples=["Số 12 Cầu Giấy, Quận Cầu Giấy, Hà Nội"],
    )
    role: UserRole = Field(
        default=UserRole.CUSTOMER,
        examples=[UserRole.CUSTOMER],
    )
    status: UserStatus = Field(
        default=UserStatus.ACTIVE,
        examples=[UserStatus.ACTIVE],
    )


class UserCreate(UserBase):
    """Schema khi tạo mới người dùng (nhận mật khẩu gốc và băm bằng bcrypt khi lưu)."""

    password: str = Field(
        min_length=6,
        max_length=100,
        examples=["Customer@123"],
    )


class UserUpdate(BaseModel):
    """Schema khi cập nhật thông tin người dùng (chỉ cập nhật trường được gửi lên)."""

    email: str | None = Field(
        default=None,
        min_length=5,
        max_length=255,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
    )
    password: str | None = Field(default=None, min_length=6, max_length=100)
    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    phone: str | None = Field(default=None, min_length=9, max_length=20)
    address: str | None = None
    role: UserRole | None = None
    status: UserStatus | None = None


class UserOut(UserBase):
    """Schema trả dữ liệu người dùng về cho Frontend (ẩn password_hash)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
