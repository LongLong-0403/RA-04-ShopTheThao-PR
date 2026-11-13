from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class MatchPostCreate(BaseModel):
    sport_id: int
    match_time: datetime
    location: str
    skill_level: str
    contact_info: str

class MatchPostUpdate(BaseModel):
    sport_id: Optional[int] = None
    match_time: Optional[datetime] = None
    location: Optional[str] = None
    skill_level: Optional[str] = None
    contact_info: Optional[str] = None
    status: Optional[str] = None  # 'OPEN', 'CLOSED', 'CANCELLED'