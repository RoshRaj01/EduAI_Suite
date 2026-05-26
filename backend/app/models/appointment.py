from beanie import Document
from typing import Optional
from app.database import get_next_sequence


class Appointment(Document):
    int_id: int = 0
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    teacher_name: Optional[str] = None
    teacher_department: Optional[str] = None
    meeting_mode: Optional[str] = None
    time_slot: Optional[str] = None
    agenda: Optional[str] = None
    details: Optional[str] = None
    rejection_reason: Optional[str] = None
    status: str = "pending"
    requested_at: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    notes: Optional[str] = None

    class Settings:
        name = "appointments"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("appointments")
