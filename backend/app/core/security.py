"""Các hàm bảo mật: mã hoá và kiểm tra mật khẩu bằng bcrypt."""
import bcrypt


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
