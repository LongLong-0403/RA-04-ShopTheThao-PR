"""API quản lý người dùng (Module 1: Quản lý Người dùng & Phân quyền). Chỉ ADMIN được gọi.

    GET    /api/users          danh sách người dùng (lọc theo ?q=, ?role=, ?status=)
    GET    /api/users/{id}     chi tiết 1 người dùng
    POST   /api/users          thêm mới người dùng (tự động băm mật khẩu bcrypt)
    PUT    /api/users/{id}     cập nhật thông tin / quyền / trạng thái người dùng
    DELETE /api/users/{id}     xoá người dùng (409 nếu đã có đơn hàng, đặt sân...)

Gửi kèm header:  Authorization: Bearer <access_token của ADMIN>
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[UserOut])
def list_users(
    q: str | None = None,
    role: UserRole | None = None,
    # alias="status": URL dùng ?status=..., tên biến khác để không trùng module `status`
    user_status: UserStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    return user_service.list_users(db, keyword=q, role=role, status=user_status)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return user_service.get_user(db, user_id)


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, data)


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return user_service.update_user(db, user_id, data, acting_user=admin)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user_service.delete_user(db, user_id, acting_user=admin)
