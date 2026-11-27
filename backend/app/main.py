"""Điểm khởi động của backend.

Chạy:  uvicorn app.main:app --reload
Tài liệu API tự sinh: http://127.0.0.1:8000/docs
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError, OperationalError

from app import models  # noqa: F401 - import để SQLAlchemy biết các bảng
from app.core.config import settings
from app.db.session import Base, SessionLocal, engine
from app.db.seed_catalog import seed_catalog
from app.routers import auth, courts, health, items, users, commerce, catalog, activities, media
from app.services import court_service, item_service, user_service
from app.services.exceptions import ServiceError

logger = logging.getLogger("uvicorn.error")


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
    with engine.begin() as conn:
        conn.execute(text("INSERT IGNORE INTO user_identity_guard (id) VALUES (1)"))

    # 2b. Bổ sung các thay đổi schema cho database cũ (create_all không ALTER cột).
    inspector = inspect(engine)
    booking_columns = {column["name"] for column in inspector.get_columns("court_bookings")}
    if "held_marker" not in booking_columns:
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE court_bookings ADD COLUMN held_marker TINYINT "
                "GENERATED ALWAYS AS (CASE WHEN status IN ('CHO_XAC_NHAN', 'XAC_NHAN') "
                "THEN 1 ELSE NULL END) STORED"
            ))
    unique_constraints = {item["name"] for item in inspect(engine).get_unique_constraints("court_bookings")}
    if "uk_held_booking" not in unique_constraints:
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE court_bookings ADD UNIQUE KEY uk_held_booking "
                "(court_slot_id, booking_date, held_marker)"
            ))

    # 2c. Bổ sung trường thông tin bài ghép kèo cho database cũ.
    match_columns = {column["name"] for column in inspect(engine).get_columns("match_posts")}
    with engine.begin() as conn:
        if "match_format" not in match_columns:
            conn.execute(text("ALTER TABLE match_posts ADD COLUMN match_format VARCHAR(30) NOT NULL DEFAULT 'Đơn'"))
        if "players_needed" not in match_columns:
            conn.execute(text("ALTER TABLE match_posts ADD COLUMN players_needed INT NOT NULL DEFAULT 1"))

    # 3. Seed dữ liệu mẫu (mỗi hàm tự bỏ qua nếu đã có dữ liệu)
    with SessionLocal() as db:
        item_service.seed_items(db)
        if settings.ENABLE_LOCAL_TEST_ACCOUNTS and settings.DB_HOST.strip().lower() in {"localhost", "127.0.0.1"}:
            user_service.seed_local_test_accounts(db)
        court_service.seed_courts(db)
        seed_catalog(db)  # 6 môn, 20 danh mục, 13 hãng, 160 sản phẩm chuẩn hãng


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tự tạo database, các bảng còn thiếu và dữ liệu mẫu khi server khởi động.
    # Lưu ý: create_all KHÔNG sửa bảng đã tồn tại. Đổi cột -> sửa bằng SQL hoặc xoá bảng tạo lại.
    try:
        init_database()
        logger.info("Connected to MySQL %s:%s/%s", settings.DB_HOST, settings.DB_PORT, settings.DB_NAME)
    except OperationalError as error:
        logger.warning("Could not connect to MySQL. Check the database settings in .env. %s", error.orig)
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
app.include_router(media.router, prefix="/api")
app.include_router(activities.router, prefix="/api")
app.include_router(courts.router, prefix="/api")
app.include_router(courts.router, include_in_schema=False)  # giữ URL cũ /courts/, /slots/
app.include_router(health.router, prefix="/api")
app.include_router(items.router, prefix="/api")
app.include_router(users.router, prefix="/api")


@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} đang chạy. Xem tài liệu API tại /docs"}
