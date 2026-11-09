from datetime import time

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog import Sport
from app.models.court import Court, CourtSlot


def seed_courts(db: Session) -> None:
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
        for start in range(360, 1440, 90):
            end = (start + 90) % 1440
            start_time = time(start // 60, start % 60)
            end_time = time(end // 60, end % 60)
            court.slots.append(CourtSlot(
                slot_name=f"{start_time:%H:%M} - {end_time:%H:%M}",
                start_time=start_time, end_time=end_time, price=150000,
            ))
    db.commit()
