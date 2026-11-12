"""API xác thực.

    POST /api/auth/register    khách tự đăng ký (luôn là CUSTOMER)
    POST /api/auth/login       đăng nhập, trả access_token (JWT)
    GET  /api/auth/me          thông tin người đang đăng nhập

Sau khi login, gửi header  Authorization: Bearer <access_token>  cho các API cần đăng nhập.
Trên /docs: bấm nút "Authorize" và dán access_token vào.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenOut
from app.schemas.user import UserOut
from app.services import auth_service
from app.core.deps import bearer_scheme
from app.core.token_store import revoke
from app.core.config import settings
from app.core.security import JWT_ALGORITHM
import jwt

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    return auth_service.register(db, data)


@router.post("/login", response_model=TokenOut)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    token, user = auth_service.login(db, data)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post('/logout', status_code=204)
def logout(user: User = Depends(get_current_user), credentials=Depends(bearer_scheme)):
    payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[JWT_ALGORITHM])
    revoke(credentials.credentials, payload['exp'])
