"""Các hàm bảo mật: mã hoá và kiểm tra mật khẩu bằng bcrypt, tạo và giải mã JWT."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from uuid import uuid4
from app.core.token_store import is_revoked

from app.core.config import settings

JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Băm mật khẩu dạng plain-text sang chuỗi bcrypt hash."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Kiểm tra mật khẩu nhập vào có khớp với chuỗi bcrypt hash trong DB không."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        password_hash.encode("utf-8"),
    )


def create_access_token(user_id: int, role: str) -> str:
    """Tạo JWT chứa id người dùng (sub) và quyền (role)."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "jti": uuid4().hex,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> int | None:
    """Trả về user_id nếu token hợp lệ và chưa hết hạn, ngược lại trả None."""
    try:
        if is_revoked(token):
            return None
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
