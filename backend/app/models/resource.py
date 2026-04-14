from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    name = Column(String)
    type = Column(String)
    size = Column(String)
    date = Column(String)