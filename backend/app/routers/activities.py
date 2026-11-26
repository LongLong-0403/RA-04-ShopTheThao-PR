"""Court bookings, community matches and buyback workflows."""
from datetime import date, datetime, time, timezone, timedelta
from decimal import Decimal
from typing import Annotated
from pydantic import StringConstraints
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field, HttpUrl, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, require_admin, require_customer
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.court import Court, CourtSlot, CourtBooking, MatchParticipant, MatchPost, BuybackRequest, BookingStatusEnum, MatchStatusEnum, BuybackStatusEnum
from app.models.catalog import CommonStatusEnum, Sport

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
    db.refresh(row)
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
    query = query.order_by(CourtBooking.id.desc())
    if user.role != UserRole.ADMIN:
        return list(db.scalars(query.where(CourtBooking.user_id == user.id)))
    query = query.add_columns(User.full_name, User.phone, Court.name, CourtSlot.start_time, CourtSlot.end_time)
    query = query.join(User, CourtBooking.user_id == User.id).join(Court, CourtBooking.court_id == Court.id)
    query = query.join(CourtSlot, CourtBooking.court_slot_id == CourtSlot.id)
    return [
        {**jsonable_encoder(row), 'customer_name': name, 'phone': phone, 'court_name': court,
         'time_slot': f'{start:%H:%M} - {end:%H:%M}'}
        for row, name, phone, court, start, end in db.execute(query)
    ]

@router.get('/availability', tags=['Bookings'])
def availability(court_id: int, booking_date: date, db: Session = Depends(get_db)):
    if booking_date < now().date():
        raise HTTPException(422, 'Không thể chọn ngày đặt sân trong quá khứ')
    court = db.get(Court, court_id)
    if court is None or court.status.value != 'ACTIVE': raise HTTPException(404, 'Không tìm thấy sân')
    occupied = set(db.scalars(select(CourtBooking.court_slot_id).where(CourtBooking.court_id == court_id,
        CourtBooking.booking_date == booking_date, CourtBooking.status.in_(['CHO_XAC_NHAN', 'XAC_NHAN']))))
    return [{'slot': s, 'available': s.id not in occupied and datetime.combine(booking_date, s.start_time) > now()}
            for s in db.scalars(select(CourtSlot).where(CourtSlot.court_id == court_id, CourtSlot.status == 'ACTIVE'))]

@router.post('/bookings', tags=['Bookings'], status_code=201)
def book(data: BookingInput, db: Session = Depends(get_db), user: User = Depends(require_customer)):
    if data.booking_date < now().date():
        raise HTTPException(422, 'Không thể chọn ngày đặt sân trong quá khứ')
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
    model_config = ConfigDict(str_strip_whitespace=True)

    sport_id: int = Field(gt=0)
    match_time: datetime
    location: str = Field(min_length=1, max_length=255)
    skill_level: str = Field(min_length=1, max_length=100)
    contact_info: str = Field(min_length=1, max_length=255)
    match_format: str = Field(default="Đơn", min_length=1, max_length=30)
    players_needed: int = Field(gt=0, le=7, strict=True)


def match_registration_status(row: MatchPost, current_time: datetime) -> str:
    if row.status == MatchStatusEnum.CANCELLED:
        return 'CANCELLED'
    if row.players_needed <= 0:
        return 'FULL'
    if row.status == MatchStatusEnum.CLOSED:
        return 'CLOSED'
    return 'OPEN' if row.match_time > current_time else 'EXPIRED'


def match_public(row: MatchPost, current_time: datetime) -> dict:
    return {
        'id': row.id, 'user_id': row.user_id, 'sport_id': row.sport_id,
        'match_time': row.match_time, 'location': row.location, 'skill_level': row.skill_level,
        'contact_info': row.contact_info, 'players_needed': max(0, row.players_needed),
        'match_format': 'Sân 7' if row.sport_id == 2 else row.match_format,
        'status': row.status, 'created_at': row.created_at,
        'registration_status': match_registration_status(row, current_time),
    }

@router.get('/match-posts', tags=['Matches'])
def matches(sport_id: int | None = None, include_closed: bool = True, db: Session = Depends(get_db)):
    current_time = now()
    query = select(MatchPost).where(MatchPost.match_time > current_time, MatchPost.status != MatchStatusEnum.CANCELLED)
    if not include_closed:
        query = query.where(MatchPost.status == MatchStatusEnum.OPEN, MatchPost.players_needed > 0)
    if sport_id: query = query.where(MatchPost.sport_id == sport_id)
    return [match_public(row, current_time) for row in db.scalars(query.order_by(MatchPost.match_time, MatchPost.id))]

@router.get('/match-posts/mine', tags=['Matches'])
def my_matches(db: Session = Depends(get_db), user: User = Depends(require_customer)):
    query = select(MatchPost).where(MatchPost.user_id == user.id).order_by(MatchPost.match_time.desc())
    current_time = now()
    return [match_public(row, current_time) for row in db.scalars(query)]


@router.get('/admin/match-posts', tags=['Matches'], dependencies=[Depends(require_admin)])
def admin_matches(db: Session = Depends(get_db)):
    current_time = now()
    participants = {}
    for participant in db.scalars(select(MatchParticipant).order_by(MatchParticipant.created_at)):
        participants.setdefault(participant.match_post_id, []).append(participant.full_name)
    query = select(MatchPost, User.full_name).join(User, MatchPost.user_id == User.id)
    return [
        {**match_public(row, current_time), 'customer_name': name, 'participants': participants.get(row.id, [])}
        for row, name in db.execute(query.order_by(MatchPost.id.desc()))
    ]


def get_match_post(db: Session, row_id: int, *, lock: bool = False) -> MatchPost:
    query = select(MatchPost).where(MatchPost.id == row_id, MatchPost.status != MatchStatusEnum.CANCELLED)
    row = db.scalar(query.with_for_update() if lock else query)
    if row is None:
        raise HTTPException(404, 'Không tìm thấy bài ghép kèo')
    return row


@router.get('/match-posts/{row_id}', tags=['Matches'])
def match_detail(row_id: int, db: Session = Depends(get_db)):
    return match_public(get_match_post(db, row_id), now())


class MatchJoinInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=1, max_length=150)
    contact_info: str = Field(min_length=1, max_length=100)
    skill_level: str | None = Field(default=None, max_length=100)
    note: str | None = Field(default=None, max_length=500)


@router.get('/match-posts/{row_id}/participation', tags=['Matches'])
def match_participation(row_id: int, response: Response, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = get_match_post(db, row_id)
    response.headers['Cache-Control'] = 'no-store'
    is_owner = row.user_id == user.id
    participants = []
    if is_owner:
        participants = list(db.execute(
            select(MatchParticipant.full_name, MatchParticipant.contact_info, MatchParticipant.skill_level, MatchParticipant.note)
            .where(MatchParticipant.match_post_id == row_id)
            .order_by(MatchParticipant.created_at, MatchParticipant.user_id)
        ).mappings())
        participants = [dict(person) for person in participants]
    return {
        'is_owner': is_owner,
        'joined': db.get(MatchParticipant, (row_id, user.id)) is not None,
        'can_join': user.role == UserRole.CUSTOMER and not is_owner,
        'full_name': user.full_name,
        'phone': user.phone,
        'participants': participants,
    }


@router.post('/match-posts/{row_id}/participation', tags=['Matches'], status_code=201)
def join_match(row_id: int, data: MatchJoinInput, db: Session = Depends(get_db), user: User = Depends(require_customer)):
    row = get_match_post(db, row_id, lock=True)
    if row.user_id == user.id:
        raise HTTPException(403, 'Bạn là người đăng bài này')
    existing = db.scalar(
        select(MatchParticipant).where(
            MatchParticipant.match_post_id == row_id, MatchParticipant.user_id == user.id
        ).with_for_update()
    )
    if existing is not None:
        raise HTTPException(409, 'Bạn đã tham gia kèo này')
    registration = match_registration_status(row, now())
    if registration != 'OPEN':
        raise HTTPException(409, {
            'FULL': 'Kèo đã đủ người',
            'EXPIRED': 'Kèo đã qua giờ thi đấu',
            'CLOSED': 'Chủ kèo đã đóng đăng ký',
        }[registration])
    db.add(MatchParticipant(match_post_id=row_id, user_id=user.id, **data.model_dump()))
    row.players_needed -= 1
    if row.players_needed == 0:
        row.status = MatchStatusEnum.CLOSED
    db.commit()
    db.refresh(row)
    return match_public(row, now())


def match_slot_limit(sport_id: int) -> int:
    return 6 if sport_id == 2 else 7


def validate_match_input(db: Session, data: MatchInput):
    sport = db.get(Sport, data.sport_id)
    if sport is None or sport.status != CommonStatusEnum.ACTIVE:
        raise HTTPException(422, 'Môn thể thao không khả dụng')
    max_players = match_slot_limit(data.sport_id)
    if data.players_needed > max_players:
        raise HTTPException(422, f'Số người cần tuyển tối đa là {max_players} người cho môn này')
    if data.sport_id == 2 and data.match_format != 'Sân 7':
        raise HTTPException(422, 'Bóng đá phải chọn hình thức Sân 7')
    if data.sport_id != 2 and data.match_format not in ('Đơn', 'Đôi'):
        raise HTTPException(422, 'Hãy chọn hình thức Đơn hoặc Đôi')
    if data.match_time.tzinfo is not None or data.match_time <= now():
        raise HTTPException(422, 'Giờ thi đấu phải là giờ Việt Nam trong tương lai')


def validate_remaining_slots(db: Session, row_id: int, sport_id: int, remaining: int) -> None:
    joined = len(list(db.scalars(
        select(MatchParticipant.user_id).where(MatchParticipant.match_post_id == row_id).with_for_update()
    )))
    available = max(0, match_slot_limit(sport_id) - joined)
    if remaining > available:
        raise HTTPException(422, f'Đã có {joined} người đăng ký. Có thể mở thêm tối đa {available} chỗ.')

@router.post('/match-posts', tags=['Matches'], status_code=201)
def create_match(data: MatchInput, db: Session = Depends(get_db), user: User = Depends(require_customer)):
    validate_match_input(db, data)
    row = MatchPost(user_id=user.id, **data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return match_public(row, now())

@router.put('/match-posts/{row_id}', tags=['Matches'])
def edit_match(row_id: int, data: MatchInput, db: Session = Depends(get_db), user: User = Depends(require_customer)):
    row = owned(db, MatchPost, row_id, user)
    if row.user_id != user.id: raise HTTPException(403, 'Chỉ chủ bài được sửa')
    if match_registration_status(row, now()) != 'OPEN':
        raise HTTPException(409, 'Bài không còn mở đăng ký')
    validate_match_input(db, data)
    validate_remaining_slots(db, row_id, data.sport_id, data.players_needed)
    for key, value in data.model_dump().items(): setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return match_public(row, now())


class MatchCapacity(BaseModel):
    players_needed: int = Field(ge=0, le=7, strict=True)


@router.patch('/match-posts/{row_id}/capacity', tags=['Matches'])
def change_match_capacity(row_id: int, data: MatchCapacity, db: Session = Depends(get_db), user: User = Depends(require_customer)):
    row = owned(db, MatchPost, row_id, user)
    if row.user_id != user.id:
        raise HTTPException(403, 'Chỉ chủ bài được đổi số chỗ')
    if match_registration_status(row, now()) != 'OPEN':
        raise HTTPException(409, 'Bài không còn mở đăng ký')
    validate_remaining_slots(db, row_id, row.sport_id, data.players_needed)
    row.players_needed = data.players_needed
    if row.players_needed == 0:
        row.status = MatchStatusEnum.CLOSED
    db.commit()
    db.refresh(row)
    return match_public(row, now())

class MatchState(BaseModel):
    status: MatchStatusEnum

@router.patch('/match-posts/{row_id}/status', tags=['Matches'])
def close_match(row_id: int, data: MatchState, db: Session = Depends(get_db), user: User = Depends(require_customer)):
    row = owned(db, MatchPost, row_id, user)
    if row.user_id != user.id: raise HTTPException(403, 'Chỉ chủ bài được đóng')
    can_close = match_registration_status(row, now()) == 'OPEN' and data.status == MatchStatusEnum.CLOSED
    can_cancel = row.status != MatchStatusEnum.CANCELLED and data.status == MatchStatusEnum.CANCELLED
    if not (can_close or can_cancel):
        raise HTTPException(409, 'Chuyển trạng thái không hợp lệ')
    row.status = data.status
    db.commit()
    return {'id': row.id, 'status': row.status}

class BuybackInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    sport_id: int | None = None
    brand_model: str = Field(min_length=1, max_length=255)
    condition_detail: str = Field(min_length=1)
    expected_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    images: list[HttpUrl | Annotated[str, StringConstraints(pattern=r'^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$', max_length=2000000)]] = Field(min_length=1, max_length=5)

@router.post('/buyback-requests', tags=['Buyback'], status_code=201)
def buyback(data: BuybackInput, db: Session = Depends(get_db), user: User = Depends(require_customer)):
    row = BuybackRequest(user_id=user.id, **data.model_dump(exclude={'images'}), images=[str(x) for x in data.images])
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@router.get('/buyback-requests', tags=['Buyback'])
def buybacks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = select(BuybackRequest).order_by(BuybackRequest.id.desc())
    if user.role != UserRole.ADMIN:
        return list(db.scalars(query.where(BuybackRequest.user_id == user.id)))
    query = query.add_columns(User.full_name, Sport.name).join(User, BuybackRequest.user_id == User.id)
    query = query.outerjoin(Sport, BuybackRequest.sport_id == Sport.id)
    return [
        {**jsonable_encoder(row), 'customer_name': name, 'sport_name': sport}
        for row, name, sport in db.execute(query)
    ]

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
