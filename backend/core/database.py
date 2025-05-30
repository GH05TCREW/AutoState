from sqlalchemy import create_engine, Column, String, JSON, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

Base = declarative_base()

class FSMRecord(Base):
    __tablename__ = "fsm_records"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    scenarios = Column(JSON)
    fsm_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

engine = None
SessionLocal = None

def init_db():
    global engine, SessionLocal
    
    database_url = os.getenv("DATABASE_URL", "sqlite:///./autostate.db")
    engine = create_engine(database_url, connect_args={"check_same_thread": False} if "sqlite" in database_url else {})
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 