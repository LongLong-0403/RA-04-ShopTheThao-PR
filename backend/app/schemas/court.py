from pydantic import BaseModel, ConfigDict
from datetime import date, time, datetime
from decimal import Decimal
from typing import Optional

class CourtBase(BaseModel):
    name: str
    description: Optional[str] = None

class CourtCreate(CourtBase):
    pass

class CourtResponse(CourtBase):
    id: int
    sport_id: int
    address: str
    status: str

    model_config = ConfigDict(from_attributes=True)

class CourtSlotBase(BaseModel):
    court_id: int
    slot_name: str
    price: float

class CourtSlotCreate(CourtSlotBase):
    pass

class CourtSlotResponse(CourtSlotBase):
    id: int
    start_time: time
    end_time: time
    status: str

    model_config = ConfigDict(from_attributes=True)

class CourtBookingBase(BaseModel):
    court_id: int
    court_slot_id: int
    booking_date: date

class CourtBookingCreate(CourtBookingBase):
    pass

class CourtBookingResponse(CourtBookingBase):
    id: int
    user_id: int
    price_at_booking: Decimal
    status: str

    model_config = ConfigDict(from_attributes=True)

class MatchPostBase(BaseModel):
    sport_id: int
    match_time: datetime
    location: str
    skill_level: str
    contact_info: str

class MatchPostCreate(MatchPostBase):
    pass

class MatchPostResponse(MatchPostBase):
    id: int
    user_id: int
    status: str

    model_config = ConfigDict(from_attributes=True)

class BuybackRequestBase(BaseModel):
    brand_model: str
    sport_id: int | None = None
    condition_detail: str
    expected_price: Decimal
    images: list[str]

class BuybackRequestCreate(BuybackRequestBase):
    pass

class BuybackRequestResponse(BuybackRequestBase):
    id: int
    user_id: int
    offered_price: Decimal | None = None
    status: str

    model_config = ConfigDict(from_attributes=True)
