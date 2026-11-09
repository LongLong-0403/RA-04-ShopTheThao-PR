from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# Khởi tạo SQLAlchemy Engine kết nối tới MySQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,  # Đổi thành True nếu muốn xem log câu lệnh SQL chạy ngầm
)

# Khởi tạo Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# SQLAlchemy 2.0 Base class
class Base(DeclarativeBase):
    pass


# Dependency get_db dùng cho FastAPI routes (Depends(get_db))
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
