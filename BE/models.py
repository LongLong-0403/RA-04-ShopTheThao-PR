from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Court(Base):
    __tablename__ = "courts"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    
    slots = relationship("CourtSlot", back_populates="court")
    bookings = relationship("CourtBooking", back_populates="court")

class CourtSlot(Base):
    __tablename__ = "court_slots"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    court_id = Column(Integer, ForeignKey("courts.id"), nullable=False)
    slot_name = Column(String(100), nullable=False)  
    price = Column(Float, nullable=False)            
    
    court = relationship("Court", back_populates="slots")
    bookings = relationship("CourtBooking", back_populates="slot")

class CourtBooking(Base):
    __tablename__ = "court_bookings"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_name = Column(String(255), nullable=False)
    court_id = Column(Integer, ForeignKey("courts.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("court_slots.id"), nullable=False)
    booking_date = Column(Date, nullable=False)
    price_at_booking = Column(Float, nullable=False)
    status = Column(String(50), default="CHỜ XÁC NHẬN")  

    court = relationship("Court", back_populates="bookings")
    slot = relationship("CourtSlot", back_populates="bookings")

class MatchPost(Base):
    __tablename__ = "match_posts"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sport = Column(String(100), nullable=False)
    time = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    level = Column(String(100), nullable=True)
    contact = Column(String(100), nullable=False)
    status = Column(String(50), default="Đang tìm")

class BuybackRequest(Base):
    __tablename__ = "buyback_requests"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    brand_model = Column(String(255), nullable=False)
    condition = Column(String(255), nullable=False)
    desired_price = Column(Float, nullable=False)
    image = Column(String(500), nullable=True)
    offered_price = Column(Float, nullable=True)
    status = Column(String(50), default="Chờ duyệt")