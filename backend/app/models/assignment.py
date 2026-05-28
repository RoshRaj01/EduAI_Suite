from beanie import Document
from typing import Optional
from app.database import get_next_sequence


class Assignment(Document):
    int_id: int = 0
    course_id: int = 0
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    max_points: int = 100
    media_path: Optional[str] = None

    class Settings:
        name = "assignments"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("assignments")
