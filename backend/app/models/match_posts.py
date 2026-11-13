from sqlalchemy import Column, Integer, String, DateTime, Text
from app.db.session import Base

class MatchPost(Base):
    __tablename__ = "match_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)  
    sport_id = Column(Integer, nullable=False, index=True)  
    match_time = Column(DateTime, nullable=False)           
    location = Column(String(255), nullable=False)          
    skill_level = Column(String(50), nullable=False)        
    contact_info = Column(String(255), nullable=False)    
    status = Column(String(50), default="OPEN", nullable=False)