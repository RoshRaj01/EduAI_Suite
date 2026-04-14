from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    name = Column(String)
    roll = Column(String)
    attendance = Column(Integer)
    avg_score = Column(Integer)