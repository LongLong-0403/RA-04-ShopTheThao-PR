"""Service cho bảng `users`: CRUD, đăng nhập và seed dữ liệu (1 Admin, 5 Khách hàng)."""
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.court import BuybackRequest, CourtBooking, MatchPost
from app.models.order import Order
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreate, UserUpdate
from app.services.exceptions import BadRequestError, ConflictError, NotFoundError

SEED_USERS_DATA: list[dict] = [
    {
        "email": "admin@sportstore.vn",
        "password": "Admin@123",
        "full_name": "Quản Trị Viên Hệ Thống",
        "phone": "0900000001",
        "address": "Tầng 5, Tòa nhà Thể Thao, Quận Cầu Giấy, Hà Nội",
        "role": UserRole.ADMIN,
        "status": UserStatus.ACTIVE,
    },
    {
        "email": "nguyenvanan@sportstore.vn",
        "password": "Customer@123",
        "full_name": "Nguyễn Văn An",
        "phone": "0912345601",
        "address": "Số 15 Xuân Thủy, Quận Cầu Giấy, Hà Nội",
        "role": UserRole.CUSTOMER,
        "status": UserStatus.ACTIVE,
    },
    {
        "email": "tranthibich@sportstore.vn",
        "password": "Customer@123",
        "full_name": "Trần Thị Bích",
        "phone": "0912345602",
        "address": "Số 88 Láng Hạ, Quận Đống Đa, Hà Nội",
        "role": UserRole.CUSTOMER,
        "status": UserStatus.ACTIVE,
    },
    {
        "email": "lehoangnam@sportstore.vn",
        "password": "Customer@123",
        "full_name": "Lê Hoàng Nam",
        "phone": "0912345603",
        "address": "Số 42 Nguyễn Trãi, Quận Thanh Xuân, Hà Nội",
        "role": UserRole.CUSTOMER,
        "status": UserStatus.ACTIVE,
    },
    {
        "email": "phamminhtuan@sportstore.vn",
        "password": "Customer@123",
        "full_name": "Phạm Minh Tuấn",
        "phone": "0912345604",
        "address": "Số 102 Giải Phóng, Quận Hai Bà Trưng, Hà Nội",
        "role": UserRole.CUSTOMER,
        "status": UserStatus.ACTIVE,
    },
    {
        "email": "hoangthimai@sportstore.vn",
        "password": "Customer@123",
        "full_name": "Hoàng Thị Mai",
        "phone": "0912345605",
        "address": "Số 27 Nguyễn Văn Cừ, Quận Long Biên, Hà Nội",
        "role": UserRole.CUSTOMER,
        "status": UserStatus.ACTIVE,
    },
]

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


def create_user(db: Session, data: UserCreate) -> User:
    if get_user_by_email(db, data.email) is not None:
        raise ConflictError(f"Email '{data.email}' đã tồn tại trong hệ thống")
    user = User(
        **data.model_dump(exclude={"password"}),
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

    new_email = updates.get("email")
    if new_email and new_email != user.email and get_user_by_email(db, new_email) is not None:
        raise BadRequestError(f"Email '{new_email}' đã được sử dụng bởi tài khoản khác")

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


def seed_users(db: Session) -> list[User]:
    """Khởi tạo dữ liệu mẫu: 01 Admin và 05 Khách hàng (mật khẩu mã hoá bcrypt)."""
    created_users: list[User] = []
    for entry in SEED_USERS_DATA:
        if get_user_by_email(db, entry["email"]) is not None:
            continue
        user = User(
            **{k: v for k, v in entry.items() if k != "password"},
            password_hash=hash_password(entry["password"]),
        )
        db.add(user)
        created_users.append(user)

    if created_users:
        db.commit()
        for user in created_users:
            db.refresh(user)
    return created_users
