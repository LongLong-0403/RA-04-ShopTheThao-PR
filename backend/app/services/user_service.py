"""Service cho bảng `users`: CRUD và đăng nhập."""
import re
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.court import BuybackRequest, CourtBooking, MatchPost
from app.models.order import Order
from app.models.user import User, UserIdentityGuard, UserRole, UserStatus
from app.schemas.user import UserCreate, UserUpdate
from app.services.exceptions import BadRequestError, ConflictError, NotFoundError

# Các bảng tham chiếu users với ON DELETE RESTRICT -> phải kiểm tra trước khi xoá
_RESTRICTING_TABLES = (
    (Order, "đơn hàng"),
    (CourtBooking, "lượt đặt sân"),
    (MatchPost, "bài ghép kèo"),
    (BuybackRequest, "yêu cầu thu mua"),
)


def list_users(
    db: Session,
    keyword: str | None = None,
    role: UserRole | None = None,
    status: UserStatus | None = None,
) -> list[User]:
    query = select(User).order_by(User.id.asc())
    if keyword:
        query = query.where(
            or_(
                User.email.contains(keyword),
                User.full_name.contains(keyword),
                User.phone.contains(keyword),
            )
        )
    if role is not None:
        query = query.where(User.role == role)
    if status is not None:
        query = query.where(User.status == status)
    return list(db.scalars(query))


def get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError(f"Không tìm thấy người dùng id={user_id}")
    return user


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.strip().lower()))


def validate_user_identity(db: Session, changes: dict, user: User | None = None) -> None:
    fields = ("email", "phone", "full_name")
    if not changes.keys() & set(fields):
        return

    # A shared row serializes identity changes, including when a value is new.
    db.execute(select(UserIdentityGuard.id).where(UserIdentityGuard.id == 1).with_for_update()).scalar_one()
    if user is not None:
        db.refresh(user, with_for_update=True)
    normalize = {
        "email": lambda value: value.strip().lower(),
        "phone": lambda value: re.sub(r"[\s.()-]", "", value),
        "full_name": lambda value: " ".join(value.split()),
    }
    columns = {
        "email": func.lower(func.trim(User.email)),
        "phone": func.regexp_replace(User.phone, "[[:space:].()-]", ""),
        "full_name": func.lower(func.trim(func.regexp_replace(User.full_name, "[[:space:]]+", " "))).collate("utf8mb4_bin"),
    }
    labels = {"email": "Email", "phone": "Số điện thoại", "full_name": "Họ và tên"}
    for field in fields:
        if field not in changes:
            continue
        raw = changes[field]
        value = normalize[field](raw or "")
        if user is not None and value == normalize[field](getattr(user, field) or ""):
            changes.pop(field)
            continue
        if not value:
            raise BadRequestError(f"{labels[field]} không được để trống")
        if field == "phone" and not re.fullmatch(r"0[35789][0-9]{8}", value):
            raise BadRequestError("Số điện thoại phải là số di động Việt Nam gồm 10 chữ số")
        query = select(User.id).where(columns[field] == (value.lower() if field == "full_name" else value))
        if user is not None:
            query = query.where(User.id != user.id)
        if db.scalar(query.limit(1).with_for_update()) is not None:
            raise ConflictError(f"{labels[field]} đã được sử dụng")
        changes[field] = value


def create_user(db: Session, data: UserCreate) -> User:
    values = data.model_dump(exclude={"password"})
    validate_user_identity(db, values)
    user = User(
        **values,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.flush()
    if user.role == UserRole.CUSTOMER:
        from app.models.order import Cart
        db.add(Cart(user_id=user.id))
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, data: UserUpdate, acting_user: User | None = None) -> User:
    user = get_user(db, user_id)
    updates = data.model_dump(exclude_unset=True)

    validate_user_identity(db, updates, user)

    # Không cho admin tự hạ quyền / tự khoá chính mình (tránh mất quyền quản trị)
    if acting_user is not None and acting_user.id == user.id:
        if updates.get("role") not in (None, UserRole.ADMIN) or updates.get("status") not in (None, UserStatus.ACTIVE):
            raise BadRequestError("Không thể tự hạ quyền hoặc tự khoá tài khoản của chính mình")

    raw_password = updates.pop("password", None)
    if raw_password is not None:
        user.password_hash = hash_password(raw_password)
    for field, value in updates.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int, acting_user: User | None = None) -> None:
    user = get_user(db, user_id)
    if acting_user is not None and acting_user.id == user.id:
        raise BadRequestError("Không thể tự xoá tài khoản của chính mình")

    used_in = [
        label
        for model, label in _RESTRICTING_TABLES
        if db.scalar(select(func.count()).select_from(model).where(model.user_id == user.id))
    ]
    if used_in:
        raise ConflictError(
            f"Không thể xoá người dùng id={user_id} vì đã có {', '.join(used_in)}. "
            "Hãy chuyển trạng thái sang INACTIVE hoặc LOCKED thay vì xoá."
        )
    db.delete(user)
    db.commit()


def authenticate(db: Session, email: str, password: str) -> User | None:
    """Trả về user nếu email + mật khẩu đúng, ngược lại None."""
    user = get_user_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user
