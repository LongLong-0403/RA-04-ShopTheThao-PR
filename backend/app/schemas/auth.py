"""Schema cho đăng ký / đăng nhập."""
from pydantic import BaseModel, Field, field_validator

from app.schemas.user import UserOut

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class RegisterRequest(BaseModel):
    """Khách tự đăng ký: không có role/status (luôn là CUSTOMER + ACTIVE)."""

    email: str = Field(min_length=5, max_length=255, pattern=EMAIL_PATTERN, examples=["khachmoi@sportstore.vn"])
    password: str = Field(min_length=8, max_length=72, examples=["Customer@123"])
    full_name: str = Field(min_length=1, max_length=150, examples=["Nguyễn Văn B"])
    phone: str = Field(min_length=9, max_length=20, examples=["0901234567"])
    address: str | None = None

    @field_validator('email', mode='before')
    @classmethod
    def normalize_email(cls, value):
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator('password')
    @classmethod
    def password_bytes(cls, value):
        if len(value.encode('utf-8')) > 72:
            raise ValueError('Mật khẩu vượt 72 byte UTF-8')
        return value


class LoginRequest(BaseModel):
    email: str = Field(examples=["admin@sportstore.vn"])
    password: str = Field(examples=["Admin@123"])


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
