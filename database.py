from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,declarative_base

SQL_AlCHEMY_URL  = "mysql+pymysql://root:@localhost:3306/ban_do_the_thao"

engine = create_engine(SQL_AlCHEMY_URL)

SessionLocal = sessionmaker(autoflush=False , autocommit= False , bind=engine)

Base = declarative_base()

def get_db ():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()