from beanie import Document
from typing import Optional
from app.database import get_next_sequence


class Course(Document):
    int_id: int = 0
    code: Optional[str] = None
    name: Optional[str] = None
    batch: Optional[str] = None
    students: int = 0
    progress: float = 0.0
    color: Optional[str] = None
    description: Optional[str] = None
    enrollment_code: Optional[str] = None
    teacher_name: Optional[str] = None
    course_plan_path: Optional[str] = None

    class Settings:
        name = "courses"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("courses")