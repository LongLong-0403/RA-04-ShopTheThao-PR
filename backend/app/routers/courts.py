from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.court import Court, CourtSlot
from app.schemas.court import CourtResponse, CourtSlotResponse

router = APIRouter(tags=["Courts"])


@router.get("/courts/", response_model=list[CourtResponse])
def get_courts(db: Session = Depends(get_db)):
    return db.scalars(select(Court).order_by(Court.id)).all()


@router.get("/slots/", response_model=list[CourtSlotResponse])
def get_slots(db: Session = Depends(get_db)):
    return db.scalars(select(CourtSlot).order_by(CourtSlot.id)).all()
