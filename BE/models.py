from sqlalchemy import Column, Integer, String, Float
from database import Base

class ProductModel(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), index=True, nullable=False)
    description = Column(String(255), nullable=True)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=0)