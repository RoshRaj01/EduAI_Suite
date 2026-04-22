from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey(
        "courses.id"), nullable=False, index=True)
    title = Column(String, nullable=True)
    topic = Column(String, nullable=False)
    syllabus_context = Column(Text, nullable=True)
    lecture_flow = Column(Text, nullable=True)
    examples = Column(Text, nullable=True)
    activities = Column(Text, nullable=True)
    quiz_questions = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    posted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)
