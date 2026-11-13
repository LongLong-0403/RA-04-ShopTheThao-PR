"""API sân và ca sân (công khai, không cần đăng nhập).

    GET /api/courts/            danh sách sân
    GET /api/slots/             danh sách ca (lọc theo sân: ?court_id=1)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.court import CourtResponse, CourtSlotResponse
from app.services import court_service

router = APIRouter(tags=["Courts"])


@router.get("/courts/", response_model=list[CourtResponse])
def get_courts(db: Session = Depends(get_db)):
    return court_service.list_courts(db)


@router.get("/slots/", response_model=list[CourtSlotResponse])
def get_slots(court_id: int | None = None, db: Session = Depends(get_db)):
    return court_service.list_slots(db, court_id=court_id)
