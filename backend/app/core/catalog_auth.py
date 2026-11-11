"""Temporary Basic-auth adapter until the shared login dependency is available."""
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus

basic = HTTPBasic()


def require_catalog_admin(
    credentials: HTTPBasicCredentials = Depends(basic),
    db: Session = Depends(get_db),
) -> User:
    user = db.scalar(select(User).where(User.email == credentials.username))
    try:
        valid = user is not None and verify_password(credentials.password, user.password_hash)
    except (ValueError, TypeError):
        valid = False
    if not valid:
        raise HTTPException(401, "Thông tin đăng nhập không hợp lệ", headers={"WWW-Authenticate": "Basic"})
    if user.status != UserStatus.ACTIVE or user.role != UserRole.ADMIN:
        raise HTTPException(403, "Chỉ ADMIN đang ACTIVE được quản lý danh mục")
    return user