from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database import Base

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String, index=True)
    description = Column(String)
    due_date = Column(String)
    max_points = Column(Integer, default=100)
    media_path = Column(String, nullable=True)
