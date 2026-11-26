"""Provision an administrator explicitly from the deployment terminal."""

from argparse import ArgumentParser
from getpass import getpass

from pydantic import ValidationError

from app import models  # noqa: F401
from app.db.session import SessionLocal
from app.models.user import UserRole
from app.schemas.user import UserCreate
from app.services.exceptions import ServiceError
from app.services.user_service import create_user


def main() -> None:
    parser = ArgumentParser(description="Tạo tài khoản quản trị Tsport")
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--phone", required=True)
    args = parser.parse_args()
    password = getpass("Mật khẩu quản trị: ")
    if len(password) < 12 or len(password.encode("utf-8")) > 72:
        parser.error("Mật khẩu cần ít nhất 12 ký tự và tối đa 72 byte UTF-8.")
    if password != getpass("Nhập lại mật khẩu: "):
        parser.error("Hai mật khẩu chưa khớp.")

    try:
        account = UserCreate(email=args.email, full_name=args.name, phone=args.phone,
                             password=password, role=UserRole.ADMIN)
        with SessionLocal() as db:
            user = create_user(db, account)
            print(f"Đã tạo tài khoản quản trị {user.email}.")
    except ValidationError:
        parser.error("Email, tên hoặc số điện thoại chưa hợp lệ.")
    except ServiceError as error:
        parser.error(error.detail)


if __name__ == "__main__":
    main()
