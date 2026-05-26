from beanie import Document
from pydantic import Field
from typing import Optional, Dict, Any
from datetime import datetime
from app.database import get_next_sequence


class OMRJob(Document):
    int_id: int = 0
    title: Optional[str] = None
    answer_key: Optional[Dict[str, str]] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Settings:
        name = "omr_jobs"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("omr_jobs")


class OMRSubmission(Document):
    int_id: int = 0
    job_id: int = 0
    student_id: Optional[str] = None
    image_url: Optional[str] = None
    detected_answers: Optional[Dict[str, str]] = None
    score: float = 0.0
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Settings:
        name = "omr_submissions"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("omr_submissions")
