from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from app.database import Base

class MailDraft(Base):
    __tablename__ = "mail_drafts"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String)
    body = Column(String)
    student_ids = Column(JSON) # To save selected student IDs
    conditions = Column(JSON) # To save query conditions used
    created_at = Column(DateTime, default=datetime.now)

class MailHistory(Base):
    __tablename__ = "mail_history"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String)
    body = Column(String)
    sent_at = Column(DateTime, default=datetime.now)
    recipients = Column(JSON) # List of student dicts or IDs
    recipient_count = Column(Integer, default=0)
