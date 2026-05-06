from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from app.database import Base

class ActionHistory(Base):
    __tablename__ = "action_history"

    id = Column(Integer, primary_key=True, index=True)
    feature = Column(String, index=True)  # e.g., "mail", "appointment", "calendar"
    action = Column(String)               # e.g., "send_bulk_mail", "reject_appointment"
    reaction = Column(String, nullable=True) # e.g., "rejection reason provided"
    result = Column(String, nullable=True)   # e.g., "success", "failed"
    timestamp = Column(DateTime, default=datetime.now)
    user_id = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True) # Renamed to avoid confusion with SQLAlchemy metadata
