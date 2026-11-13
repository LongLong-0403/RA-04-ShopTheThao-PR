"""Service đăng ký / đăng nhập."""
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.user import User, UserRole, UserStatus
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.user import UserCreate
from app.services import user_service
from app.services.exceptions import PermissionDeniedError, ServiceError


class InvalidCredentialsError(ServiceError):
    status_code = 401


def register(db: Session, data: RegisterRequest) -> User:
    """Khách tự đăng ký: luôn là CUSTOMER + ACTIVE, không cho tự chọn quyền."""
    payload = UserCreate(**data.model_dump(), role=UserRole.CUSTOMER, status=UserStatus.ACTIVE)
    return user_service.create_user(db, payload)


def login(db: Session, data: LoginRequest) -> tuple[str, User]:
    user = user_service.authenticate(db, data.email, data.password)
    if user is None:
        raise InvalidCredentialsError("Email hoặc mật khẩu không đúng")
    if user.status != UserStatus.ACTIVE:
        raise PermissionDeniedError("Tài khoản đã bị khoá hoặc ngừng hoạt động")
    return create_access_token(user.id, user.role.value), user
