from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base
from datetime import datetime

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String, unique=True, index=True)
    name = Column(String)
    type = Column(String) 
    generated_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="ready") 
    content = Column(String, nullable=True)
    target_id = Column(Integer, nullable=True)
