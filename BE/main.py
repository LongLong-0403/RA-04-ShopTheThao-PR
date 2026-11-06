from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, SessionLocal,get_db
import models
import schemas

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="ShopTheThao API")

# seed 3 sân / 12 ca
@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        count = db.query(models.Court).count()
        if count == 0:
            print("Đang tạo dữ liệu mẫu: 3 sân và 12 ca...")
            courts = [
                models.Court(name="Sân Cầu Lông 1", description="Sân tiêu chuẩn"),
                models.Court(name="Sân Cầu Lông 2", description="Sân thảm chống trượt"),
                models.Court(name="Sân Cầu Lông 3", description="Sân VIP")
            ]
            db.add_all(courts)
            db.commit()
            all_courts = db.query(models.Court).all()
            slots_time = [
                "06:00 - 07:30", "07:30 - 09:00", "09:00 - 10:30", "10:30 - 12:00",
                "12:00 - 13:30", "13:30 - 15:00", "15:00 - 16:30", "16:30 - 18:00",
                "18:00 - 19:30", "19:30 - 21:00", "21:00 - 22:30", "22:30 - 00:00"
                ]
            for court in all_courts:
                for time_str in slots_time:
                    slot = models.CourtSlot(
                        court_id=court.id,
                        slot_name=time_str,
                        price=150000.0)
                    db.add(slot)
            db.commit()
            print("Đã seed dữ liệu thành công!")
    except Exception as e:
        print(f"Lỗi seed dữ liệu: {e}")
    finally:
        db.close()

# api cơ bản
@app.get("/")
def read_root():
    return {"message": "ShopTheThao API đang chạy!"}

@app.get("/courts/")
def get_courts(db: Session = Depends(get_db)):
    return db.query(models.Court).all()

@app.get("/slots/")
def get_slots(db: Session, db_session: Session = Depends(get_db)):
    return db_session.query(models.CourtSlot).all()