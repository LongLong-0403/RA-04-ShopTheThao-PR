"""Service cho sân và ca sân."""
from datetime import time

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog import Sport
from app.models.court import Court, CourtSlot

SLOT_MINUTES = 90
FIRST_SLOT_START = 6 * 60  # 06:00
LAST_SLOT_END = 22 * 60 + 30  # 22:30 -> mọi ca kết thúc trong ngày (end_time > start_time)


def list_courts(db: Session) -> list[Court]:
    return list(db.scalars(select(Court).order_by(Court.id)))


def list_slots(db: Session, court_id: int | None = None) -> list[CourtSlot]:
    query = select(CourtSlot).order_by(CourtSlot.id)
    if court_id is not None:
        query = query.where(CourtSlot.court_id == court_id)
    return list(db.scalars(query))


def seed_courts(db: Session) -> None:
    """Tạo 3 sân, mỗi sân 4 ca; tổng 12 ca theo SRS."""
    if db.scalar(select(Court.id).limit(1)) is not None:
        return

    sport = db.scalar(select(Sport).where(Sport.name == "Cầu lông"))
    if sport is None:
        sport = Sport(name="Cầu lông", slug="cau-long")
        db.add(sport)

    descriptions = ("Sân tiêu chuẩn", "Sân thảm chống trượt", "Sân VIP")
    for number, description in enumerate(descriptions, start=1):
        court = Court(name=f"Sân Cầu Lông {number}", description=description,
                      address="Chưa cập nhật", sport=sport)
        db.add(court)
        for start in (360, 480, 960, 1080):
            end = start + SLOT_MINUTES
            start_time = time(start // 60, start % 60)
            end_time = time(end // 60, end % 60)
            court.slots.append(CourtSlot(
                slot_name=f"{start_time:%H:%M} - {end_time:%H:%M}",
                start_time=start_time, end_time=end_time, price=150000,
            ))
    db.commit()
