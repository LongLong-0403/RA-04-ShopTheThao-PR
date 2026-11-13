"""Court bookings, community matches and buyback workflows."""
from datetime import date, datetime, time, timezone, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, HttpUrl, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.court import Court, CourtSlot, CourtBooking, MatchPost, BuybackRequest, BookingStatusEnum, MatchStatusEnum, BuybackStatusEnum

router = APIRouter()

class CourtInput(BaseModel):
    sport_id: int
    name: str = Field(min_length=1, max_length=150)
    address: str = Field(min_length=1, max_length=255)
    description: str | None = None
    status: str = Field(default='ACTIVE', pattern='^(ACTIVE|INACTIVE|MAINTENANCE)$')

@router.post('/courts', tags=['Courts'], dependencies=[Depends(require_admin)], status_code=201)
def create_court(data: CourtInput, db: Session = Depends(get_db)):
    row = Court(**data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@router.put('/courts/{court_id}', tags=['Courts'], dependencies=[Depends(require_admin)])
def edit_court(court_id: int, data: CourtInput, db: Session = Depends(get_db)):
    row = db.scalar(select(Court).where(Court.id == court_id).with_for_update())
    if row is None: raise HTTPException(404, 'Không tìm thấy sân')
    for key, value in data.model_dump().items(): setattr(row, key, value)
    db.commit()
    return row

class SlotInput(BaseModel):
    court_id: int
    slot_name: str = Field(min_length=1, max_length=100)
    start_time: time
    end_time: time
    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    status: str = Field(default='ACTIVE', pattern='^(ACTIVE|INACTIVE)$')

def save_slot(data, db, slot_id=None):
    court = db.scalar(select(Court).where(Court.id == data.court_id).with_for_update())
    if court is None: raise HTTPException(404, 'Không tìm thấy sân')
    if data.start_time >= data.end_time: raise HTTPException(422, 'Ca phải kết thúc sau khi bắt đầu trong ngày')
    row = db.scalar(select(CourtSlot).where(CourtSlot.id == slot_id).with_for_update()) if slot_id else None
    if slot_id and row is None: raise HTTPException(404, 'Không tìm thấy ca')
    if row and row.court_id != data.court_id: raise HTTPException(409, 'Không chuyển ca sang sân khác')
    if row and (row.start_time != data.start_time or row.end_time != data.end_time):
        held = list(db.scalars(select(CourtBooking).where(CourtBooking.court_slot_id == row.id,
            CourtBooking.booking_date >= now().date(), CourtBooking.status.in_(['CHO_XAC_NHAN', 'XAC_NHAN'])).with_for_update()))
        if any(datetime.combine(b.booking_date, row.start_time) > now() for b in held):
            raise HTTPException(409, 'Ca đang có booking tương lai')
    overlap = db.scalar(select(CourtSlot).where(CourtSlot.court_id == data.court_id,
        CourtSlot.id != (slot_id or -1), CourtSlot.status == 'ACTIVE',
        CourtSlot.start_time < data.end_time, CourtSlot.end_time > data.start_time).with_for_update())
    if data.status == 'ACTIVE' and overlap: raise HTTPException(409, 'Ca chồng giờ')
    if row:
        for key, value in data.model_dump().items(): setattr(row, key, value)
    else:
        row = CourtSlot(**data.model_dump())
        db.add(row)
    db.commit()
    db.refresh(row)
    return row

@router.post('/slots', tags=['Courts'], dependencies=[Depends(require_admin)], status_code=201)
def create_slot(data: SlotInput, db: Session = Depends(get_db)):
    return save_slot(data, db)

@router.put('/slots/{slot_id}', tags=['Courts'], dependencies=[Depends(require_admin)])
def edit_slot(slot_id: int, data: SlotInput, db: Session = Depends(get_db)):
    return save_slot(data, db, slot_id)

def now():
    return datetime.now(timezone(timedelta(hours=7))).replace(tzinfo=None)

def owned(db, model, row_id, user):
    row = db.scalar(select(model).where(model.id == row_id).with_for_update())
    if row is None or (row.user_id != user.id and user.role != UserRole.ADMIN):
        raise HTTPException(404, 'Không tìm thấy dữ liệu')
    return row

class BookingInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    court_id: int
    court_slot_id: int
    booking_date: date

@router.get('/bookings', tags=['Bookings'])
def bookings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = select(CourtBooking)
    if user.role != UserRole.ADMIN: query = query.where(CourtBooking.user_id == user.id)
    return list(db.scalars(query.order_by(CourtBooking.id.desc())))

@router.get('/availability', tags=['Bookings'])
def availability(court_id: int, booking_date: date, db: Session = Depends(get_db)):
    court = db.get(Court, court_id)
    if court is None or court.status.value != 'ACTIVE': raise HTTPException(404, 'Không tìm thấy sân')
    occupied = set(db.scalars(select(CourtBooking.court_slot_id).where(CourtBooking.court_id == court_id,
        CourtBooking.booking_date == booking_date, CourtBooking.status.in_(['CHO_XAC_NHAN', 'XAC_NHAN']))))
    return [{'slot': s, 'available': s.id not in occupied and datetime.combine(booking_date, s.start_time) > now()}
            for s in db.scalars(select(CourtSlot).where(CourtSlot.court_id == court_id, CourtSlot.status == 'ACTIVE'))]

@router.post('/bookings', tags=['Bookings'], status_code=201)
def book(data: BookingInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != UserRole.CUSTOMER: raise HTTPException(403, 'Chỉ CUSTOMER đặt sân')
    court = db.scalar(select(Court).where(Court.id == data.court_id).with_for_update())
    slot = db.scalar(select(CourtSlot).where(CourtSlot.id == data.court_slot_id).with_for_update())
    if court is None or slot is None or slot.court_id != court.id: raise HTTPException(422, 'Ca không thuộc sân')
    if court.status.value != 'ACTIVE' or slot.status.value != 'ACTIVE' or datetime.combine(data.booking_date, slot.start_time) <= now():
        raise HTTPException(409, 'Sân hoặc ca không khả dụng')
    # Locking read sees the latest committed booking after acquiring the court lock.
    existing = db.scalar(select(CourtBooking).where(CourtBooking.court_slot_id == slot.id,
        CourtBooking.booking_date == data.booking_date, CourtBooking.status.in_(['CHO_XAC_NHAN', 'XAC_NHAN'])).with_for_update())
    if existing: raise HTTPException(409, 'Ca đã được giữ chỗ')
    row = CourtBooking(user_id=user.id, **data.model_dump(), price_at_booking=slot.price)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

class BookingState(BaseModel):
    status: BookingStatusEnum

@router.patch('/bookings/{row_id}/status', tags=['Bookings'])
def booking_state(row_id: int, data: BookingState, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = owned(db, CourtBooking, row_id, user)
    if datetime.combine(row.booking_date, row.court_slot.start_time) <= now(): raise HTTPException(409, 'Ca đã bắt đầu')
    old, new = row.status.value, data.status.value
    allowed = {'CHO_XAC_NHAN': {'XAC_NHAN', 'TU_CHOI', 'HUY'}, 'XAC_NHAN': {'HUY'}}
    if user.role != UserRole.ADMIN: allowed = {'CHO_XAC_NHAN': {'HUY'}, 'XAC_NHAN': {'HUY'}}
    if new not in allowed.get(old, set()): raise HTTPException(409, 'Chuyển trạng thái không hợp lệ')
    row.status = data.status
    db.commit()
    return {'id': row.id, 'status': new}

class MatchInput(BaseModel):
    sport_id: int
    match_time: datetime
    location: str = Field(min_length=1, max_length=255)
    skill_level: str = Field(min_length=1, max_length=100)
    contact_info: str = Field(min_length=1, max_length=255)

@router.get('/match-posts', tags=['Matches'])
def matches(sport_id: int | None = None, db: Session = Depends(get_db)):
    query = select(MatchPost).where(MatchPost.status == 'OPEN', MatchPost.match_time > now())
    if sport_id: query = query.where(MatchPost.sport_id == sport_id)
    return list(db.scalars(query.order_by(MatchPost.match_time)))

@router.post('/match-posts', tags=['Matches'], status_code=201)
def create_match(data: MatchInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if data.match_time.tzinfo is not None or data.match_time <= now(): raise HTTPException(422, 'Giờ thi đấu phải là giờ địa phương trong tương lai')
    row = MatchPost(user_id=user.id, **data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@router.put('/match-posts/{row_id}', tags=['Matches'])
def edit_match(row_id: int, data: MatchInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = owned(db, MatchPost, row_id, user)
    if row.user_id != user.id: raise HTTPException(403, 'Chỉ chủ bài được sửa')
    if row.status.value != 'OPEN' or data.match_time.tzinfo or data.match_time <= now(): raise HTTPException(409, 'Bài không còn mở hoặc giờ không hợp lệ')
    for key, value in data.model_dump().items(): setattr(row, key, value)
    db.commit()
    return row

class MatchState(BaseModel):
    status: MatchStatusEnum

@router.patch('/match-posts/{row_id}/status', tags=['Matches'])
def close_match(row_id: int, data: MatchState, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = owned(db, MatchPost, row_id, user)
    if row.user_id != user.id: raise HTTPException(403, 'Chỉ chủ bài được đóng')
    if row.status.value != 'OPEN' or data.status.value not in ('CLOSED', 'CANCELLED'): raise HTTPException(409, 'Chuyển trạng thái không hợp lệ')
    row.status = data.status
    db.commit()
    return {'id': row.id, 'status': row.status}

class BuybackInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    sport_id: int | None = None
    brand_model: str = Field(min_length=1, max_length=255)
    condition_detail: str = Field(min_length=1)
    expected_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    images: list[HttpUrl] = Field(min_length=1, max_length=5)

@router.post('/buyback-requests', tags=['Buyback'], status_code=201)
def buyback(data: BuybackInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = BuybackRequest(user_id=user.id, **data.model_dump(exclude={'images'}), images=[str(x) for x in data.images])
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@router.get('/buyback-requests', tags=['Buyback'])
def buybacks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = select(BuybackRequest)
    if user.role != UserRole.ADMIN: query = query.where(BuybackRequest.user_id == user.id)
    return list(db.scalars(query.order_by(BuybackRequest.id.desc())))

class BuybackState(BaseModel):
    status: BuybackStatusEnum
    offered_price: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)

@router.patch('/buyback-requests/{row_id}/status', tags=['Buyback'])
def buyback_state(row_id: int, data: BuybackState, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = owned(db, BuybackRequest, row_id, user)
    old, new = row.status.value, data.status.value
    if user.role == UserRole.ADMIN:
        allowed = {'PENDING': {'OFFERED', 'REJECTED'}, 'ACCEPTED': {'COMPLETED', 'CANCELLED'}}
    else:
        allowed = {'PENDING': {'CANCELLED'}, 'OFFERED': {'ACCEPTED', 'REJECTED', 'CANCELLED'}}
    if new not in allowed.get(old, set()): raise HTTPException(409, 'Chuyển trạng thái không hợp lệ')
    if new == 'OFFERED':
        if data.offered_price is None: raise HTTPException(422, 'Cần giá đề nghị')
        row.offered_price = data.offered_price
    elif data.offered_price is not None: raise HTTPException(422, 'Không được đổi giá ở bước này')
    row.status = data.status
    db.commit()
    return {'id': row.id, 'status': row.status}
