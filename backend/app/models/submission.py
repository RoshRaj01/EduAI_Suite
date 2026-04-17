from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database import Base

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"))
    student_name = Column(String)
    file_path = Column(String, nullable=True)
    submitted_at = Column(String)
    grade = Column(Float, nullable=True)
