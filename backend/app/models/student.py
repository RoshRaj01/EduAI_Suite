from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    name = Column(String)
    registration_number = Column(String)
    email = Column(String)
    student_class = Column(String)
    department = Column(String)
    attendance = Column(Integer, default=0)
    avg_score = Column(Integer, default=0)