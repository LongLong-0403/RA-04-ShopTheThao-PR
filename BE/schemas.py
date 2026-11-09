from pydantic import BaseModel
from datetime import date
from typing import Optional, List

class CourtBase(BaseModel):
    name: str
    description: Optional[str] = None

class CourtCreate(CourtBase):
    pass

class CourtResponse(CourtBase):
    id: int

    class Config:
        from_attributes = True

class CourtSlotBase(BaseModel):
    court_id: int
    slot_name: str
    price: float

class CourtSlotCreate(CourtSlotBase):
    pass

class CourtSlotResponse(CourtSlotBase):
    id: int

    class Config:
        from_attributes = True

class CourtBookingBase(BaseModel):
    customer_name: str
    court_id: int
    slot_id: int
    booking_date: date
    price_at_booking: float
    status: Optional[str] = "CHỜ XÁC NHẬN"  

class CourtBookingCreate(CourtBookingBase):
    pass

class CourtBookingResponse(CourtBookingBase):
    id: int

    class Config:
        from_attributes = True

class MatchPostBase(BaseModel):
    sport: str
    time: str
    location: str
    level: Optional[str] = None
    contact: str
    status: Optional[str] = "Đang tìm"

class MatchPostCreate(MatchPostBase):
    pass

class MatchPostResponse(MatchPostBase):
    id: int

    class Config:
        from_attributes = True

class BuybackRequestBase(BaseModel):
    brand_model: str
    condition: str
    desired_price: float
    image: Optional[str] = None
    offered_price: Optional[float] = None
    status: Optional[str] = "Chờ duyệt"

class BuybackRequestCreate(BuybackRequestBase):
    pass

class BuybackRequestResponse(BuybackRequestBase):
    id: int

    class Config:
        from_attributes = True