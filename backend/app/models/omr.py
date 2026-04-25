from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from app.database import Base
from datetime import datetime

class OMRJob(Base):
    __tablename__ = "omr_jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    answer_key = Column(JSON) # e.g. {"1": "A", "2": "B"}
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())

class OMRSubmission(Base):
    __tablename__ = "omr_submissions"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("omr_jobs.id"))
    student_id = Column(String, index=True) # E.g., student name or reg_no
    image_url = Column(String) # Path to uploaded image
    detected_answers = Column(JSON) # e.g. {"1": "A", "2": "C"}
    score = Column(Float, default=0)
    status = Column(String, default="pending") # pending, verified
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())
