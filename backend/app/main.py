"""Điểm khởi động của backend.

Chạy:  uvicorn app.main:app --reload
Tài liệu API tự sinh: http://127.0.0.1:8000/docs
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError, OperationalError

from app import models  # noqa: F401 - import để SQLAlchemy biết các bảng
from app.core.config import settings
from app.db.session import Base, SessionLocal, engine
from app.routers import auth, courts, health, items, users, commerce, catalog, activities, cart
from app.services import court_service, item_service, user_service
from app.services.exceptions import ServiceError



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

    # 3. Seed dữ liệu mẫu (mỗi hàm tự bỏ qua nếu đã có dữ liệu)
    with SessionLocal() as db:
        item_service.seed_items(db)
        user_service.seed_users(db)  # 1 Admin + 5 Khách hàng
        court_service.seed_courts(db)


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


# Lỗi nghiệp vụ từ tầng service -> JSON {"detail": "..."} với mã HTTP tương ứng
@app.exception_handler(ServiceError)
async def service_error_handler(request: Request, exc: ServiceError):
    headers = {"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else None
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=headers)


# Lưới an toàn: vi phạm ràng buộc DB (trùng khoá, khoá ngoại...) -> 409 thay vì 500
@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={"detail": "Dữ liệu vi phạm ràng buộc của hệ thống (trùng lặp hoặc đang được sử dụng)"},
    )


# Mọi API đều bắt đầu bằng /api. Thêm router mới thì include ở đây.
app.include_router(auth.router, prefix="/api")
app.include_router(commerce.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(activities.router, prefix="/api")
app.include_router(courts.router, prefix="/api")
app.include_router(courts.router, include_in_schema=False)  # giữ URL cũ /courts/, /slots/
app.include_router(health.router, prefix="/api")
app.include_router(items.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(cart.router, prefix="/api")


@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} đang chạy. Xem tài liệu API tại /docs"}
