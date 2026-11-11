"""Điểm khởi động của backend.

Chạy:  uvicorn app.main:app --reload
Tài liệu API tự sinh: http://127.0.0.1:8000/docs
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, func, select, text
from sqlalchemy.exc import OperationalError

from app import models  # noqa: F401 - import để SQLAlchemy biết các bảng
from app.core.config import settings
from app.crud.court import seed_courts
from app.crud.user import seed_users
from app.db.session import Base, SessionLocal, engine
from app.models.item import Item
from app.routers import courts, health, items, products, users


def init_database() -> None:
    """Tự tạo database, bảng và dữ liệu mẫu nếu chưa tồn tại."""
    # 1. Tự tạo database nếu chưa chạy sql/init.sql
    server_engine = create_engine(settings.server_url, isolation_level="AUTOCOMMIT")
    try:
        with server_engine.connect() as conn:
            conn.execute(
                text(
                    f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` "
                    "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
            )
    finally:
        server_engine.dispose()

    # 2. Tự tạo các bảng còn thiếu theo model
    Base.metadata.create_all(bind=engine)

    # 3. Thêm dữ liệu mẫu nếu bảng items đang trống
    with SessionLocal() as db:
        count = db.scalar(select(func.count()).select_from(Item))
        if count == 0:
            db.add_all(
                [
                    Item(name="Cơm rang dưa bò", description="Món mẫu để kiểm tra API", price=45000),
                    Item(name="Trà đá", description="Dữ liệu mẫu số 2", price=5000),
                ]
            )
            db.commit()

        # 4. Seed 1 Admin + 5 Khách hàng cho bảng users nếu chưa có
        seed_users(db)
        seed_courts(db)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tự tạo database, các bảng còn thiếu và dữ liệu mẫu khi server khởi động.
    # Lưu ý: create_all KHÔNG sửa bảng đã tồn tại. Đổi cột -> sửa bằng SQL hoặc xoá bảng tạo lại.
    try:
        init_database()
        print(f"[DB] Đã kết nối MySQL {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    except OperationalError as error:
        print("[DB] KHÔNG kết nối được MySQL! Kiểm tra MySQL đã bật chưa và mật khẩu DB_PASSWORD trong file .env.")
        print(f"[DB] Chi tiết: {error.orig}")
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

# CORS: cho phép trang FE (khác cổng/khác domain) gọi được API này
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mọi API đều bắt đầu bằng /api. Thêm router mới thì include ở đây.
app.include_router(courts.router, prefix="/api")
app.include_router(courts.router, include_in_schema=False)
app.include_router(health.router, prefix="/api")
app.include_router(items.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(users.router, prefix="/api")


@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} đang chạy. Xem tài liệu API tại /docs"}
