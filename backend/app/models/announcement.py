from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.database import Base

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String)
    body = Column(String)
    time = Column(String)
    pinned = Column(Boolean, default=False)