from beanie import Document
from typing import Optional
from app.database import get_next_sequence


class Resource(Document):
    int_id: int = 0
    course_id: int = 0
    name: Optional[str] = None
    type: Optional[str] = None
    size: Optional[str] = None
    date: Optional[str] = None

    class Settings:
        name = "resources"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("resources")