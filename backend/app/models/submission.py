from beanie import Document
from typing import Optional
from app.database import get_next_sequence


class Submission(Document):
    int_id: int = 0
    assignment_id: int = 0
    student_name: Optional[str] = None
    file_path: Optional[str] = None
    grade: Optional[float] = None
    submitted_at: Optional[str] = None

    class Settings:
        name = "submissions"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("submissions")
