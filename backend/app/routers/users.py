"""API CRUD cho bảng `users` (Module 1: Quản lý Người dùng & Phân quyền).

    GET    /api/users          danh sách người dùng (lọc theo ?q=, ?role=, ?status=)
    GET    /api/users/{id}     chi tiết 1 người dùng
    POST   /api/users          thêm mới người dùng (tự động băm mật khẩu bcrypt)
    PUT    /api/users/{id}     cập nhật thông tin / quyền / trạng thái người dùng
    DELETE /api/users/{id}     xoá người dùng
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import user as user_crud
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


def get_user_or_404(user_id: int, db: Session = Depends(get_db)) -> User:
    user = user_crud.get_user(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy người dùng id={user_id}",
        )
    return user


@router.get("", response_model=list[UserOut])
def list_users(
    q: str | None = None,
    role: UserRole | None = None,
    user_status: UserStatus | None = None,
    db: Session = Depends(get_db),
):
    return user_crud.get_users(db, keyword=q, role=role, status=user_status)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user: User = Depends(get_user_or_404)):
    return user


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    existing = user_crud.get_user_by_email(db, data.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{data.email}' đã tồn tại trong hệ thống",
        )
    return user_crud.create_user(db, data)


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    data: UserUpdate,
    user: User = Depends(get_user_or_404),
    db: Session = Depends(get_db),
):
    if data.email and data.email != user.email:
        existing = user_crud.get_user_by_email(db, data.email)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{data.email}' đã được sử dụng bởi tài khoản khác",
            )
    return user_crud.update_user(db, user, data)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user: User = Depends(get_user_or_404), db: Session = Depends(get_db)):
    user_crud.delete_user(db, user)
