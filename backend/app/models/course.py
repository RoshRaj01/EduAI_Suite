from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String)
    name = Column(String)
    batch = Column(String)
    students = Column(Integer)
    progress = Column(Float)
    color = Column(String)
    description = Column(String)
    enrollment_code = Column(String, unique=True, index=True, nullable=True)