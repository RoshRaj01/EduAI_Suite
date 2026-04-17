from sqlalchemy import Column, Integer, String
from app.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String, index=True)
    student_email = Column(String, nullable=True)
    teacher_name = Column(String, index=True)
    teacher_department = Column(String, nullable=True)
    meeting_mode = Column(String)
    time_slot = Column(String)
    topic = Column(String)
    status = Column(String, default="pending", index=True)
    requested_at = Column(String)
    reviewed_at = Column(String, nullable=True)
    reviewed_by = Column(String, nullable=True)
    notes = Column(String, nullable=True)
