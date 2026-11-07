"""CRUD & Seed dữ liệu cho bảng `users` (1 Admin, 5 Khách hàng)."""
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreate, UserUpdate

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


def get_users(
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


def get_user(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_user_by_email(db: Session, email: str) -> User | None:
    query = select(User).where(User.email == email)
    return db.scalar(query)


def create_user(db: Session, data: UserCreate) -> User:
    payload = data.model_dump(exclude={"password"})
    user = User(
        **payload,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    updates = data.model_dump(exclude_unset=True)
    raw_password = updates.pop("password", None)
    if raw_password is not None:
        user.password_hash = hash_password(raw_password)
    for field, value in updates.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()


def seed_users(db: Session) -> list[User]:
    """Khởi tạo dữ liệu mẫu: 01 Admin và 05 Khách hàng (mật khẩu mã hoá bcrypt)."""
    created_users: list[User] = []
    for entry in SEED_USERS_DATA:
        existing = get_user_by_email(db, entry["email"])
        if existing is not None:
            continue
        user = User(
            email=entry["email"],
            password_hash=hash_password(entry["password"]),
            full_name=entry["full_name"],
            phone=entry["phone"],
            address=entry["address"],
            role=entry["role"],
            status=entry["status"],
        )
        db.add(user)
        created_users.append(user)

    if created_users:
        db.commit()
        for user in created_users:
            db.refresh(user)
    return created_users
