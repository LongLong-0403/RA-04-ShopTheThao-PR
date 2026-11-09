from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from pydantic import BaseModel

# Import get_db từ thư mục db và models từ thư mục models của project
from app.db.session import get_db
from app import models

router = APIRouter(prefix="/bookings", tags=["Bookings"])

# Schema nhận dữ liệu đặt sân
class BookingCreate(BaseModel):
    customer_name: str
    court_id: int
    slot_id: int
    booking_date: date

# Schema duyệt/hủy lịch
class BookingStatusUpdate(BaseModel):
    status: str  # "XAC_NHAN", "TU_CHOI", "HUY"

# 1. API Khách đặt sân (UC3.2)
@router.post("/")
def create_booking(booking_in: BookingCreate, db: Session = Depends(get_db)):
    # Bước a: Kiểm tra trùng lịch (CHO_XAC_NHAN hoặc XAC_NHAN)
    existing_booking = db.query(models.CourtBooking).filter(
        models.CourtBooking.court_id == booking_in.court_id,
        models.CourtBooking.slot_id == booking_in.slot_id,
        models.CourtBooking.booking_date == booking_in.booking_date,
        models.CourtBooking.status.in_(["CHO_XAC_NHAN", "XAC_NHAN"])
    ).first()
    
    if existing_booking:
        raise HTTPException(status_code=400, detail="Ca giờ này đã được đặt hoặc đang chờ xác nhận!")

    # Bước b: Lấy giá ca tại thời điểm đặt (price_at_booking)
    slot = db.query(models.CourtSlot).filter(models.CourtSlot.id == booking_in.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Ca giờ không tồn tại")

    # Bước c: Tạo đơn đặt mới với trạng thái CHO_XAC_NHAN
    new_booking = models.CourtBooking(
        customer_name=booking_in.customer_name,
        court_id=booking_in.court_id,
        slot_id=booking_in.slot_id,
        booking_date=booking_in.booking_date,
        price_at_booking=slot.price,  # Lưu cố định giá thời điểm này
        status="CHO_XAC_NHAN"
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

# 2. API Admin duyệt / từ chối / hủy (Dùng Transaction khóa dòng - with_for_update)
@router.put("/{booking_id}/status")
def update_booking_status(booking_id: int, status_update: BookingStatusUpdate, db: Session = Depends(get_db)):
    # Bắt đầu Transaction & Khóa dòng để tránh 2 Admin cùng bấm duyệt 1 lúc
    try:
        booking = db.query(models.CourtBooking).filter(
            models.CourtBooking.id == booking_id
        ).with_for_update().first()

        if not booking:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn đặt sân")

        # Nếu admin duyệt XAC_NHAN -> kiểm tra lại lần nữa xem có ai khác vừa được duyệt ca này chưa
        if status_update.status == "XAC_NHAN":
            conflict = db.query(models.CourtBooking).filter(
                models.CourtBooking.court_id == booking.court_id,
                models.CourtBooking.slot_id == booking.slot_id,
                models.CourtBooking.booking_date == booking.booking_date,
                models.CourtBooking.status == "XAC_NHAN",
                models.CourtBooking.id != booking_id
            ).first()
            if conflict:
                booking.status = "TU_CHOI"
                db.commit()
                raise HTTPException(status_code=400, detail="Ca giờ này đã được duyệt cho khách khác!")

        booking.status = status_update.status
        db.commit()
        db.refresh(booking)
        return booking
    except Exception as e:
        db.rollback()
        raise e