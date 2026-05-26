from beanie import Document
from typing import Optional
from datetime import datetime
from app.database import get_next_sequence


class Lesson(Document):
    int_id: int = 0
    course_id: int = 0
    title: Optional[str] = None
    topic: str = ""
    syllabus_context: Optional[str] = None
    lecture_flow: Optional[str] = None
    examples: Optional[str] = None
    activities: Optional[str] = None
    quiz_questions: Optional[str] = None
    created_by: int = 0
    posted_at: Optional[datetime] = None
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "lessons"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("lessons")
