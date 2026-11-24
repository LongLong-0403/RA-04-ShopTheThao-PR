"""API xác thực.

    POST /api/auth/register    khách tự đăng ký (luôn là CUSTOMER)
    POST /api/auth/login       đăng nhập, trả access_token (JWT)
    GET  /api/auth/me          thông tin người đang đăng nhập

Sau khi login, gửi header  Authorization: Bearer <access_token>  cho các API cần đăng nhập.
Trên /docs: bấm nút "Authorize" và dán access_token vào.
"""
from pydantic import BaseModel, Field, ConfigDict
from app.core.security import hash_password, verify_password
from fastapi import HTTPException, APIRouter, Depends, status
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


class ProfileInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    full_name: str = Field(min_length=1, max_length=150)
    phone: str = Field(min_length=9, max_length=20)
    address: str | None = None


@router.put("/me", response_model=UserOut)
def update_profile(data: ProfileInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for key, value in data.model_dump().items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


class PasswordInput(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)


@router.post("/password", status_code=204)
def change_password(data: PasswordInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if len(data.new_password.encode()) > 72:
        raise HTTPException(422, "Mật khẩu vượt 72 byte")
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(403, "Mật khẩu hiện tại không đúng")
    user.password_hash = hash_password(data.new_password)
    db.commit()


@router.post('/logout', status_code=204)
def logout(user: User = Depends(get_current_user), credentials=Depends(bearer_scheme)):
    payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[JWT_ALGORITHM])
    revoke(credentials.credentials, payload['exp'])
