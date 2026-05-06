from pydantic import BaseModel
from typing import Optional, Literal


class AppointmentBase(BaseModel):
    student_name: str
    student_email: Optional[str] = None
    teacher_name: str
    teacher_department: Optional[str] = None
    meeting_mode: str
    time_slot: str
    agenda: str
    details: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentStatusUpdate(BaseModel):
    status: Literal["approved", "rejected"]
    reviewed_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    id: int
    status: str
    rejection_reason: Optional[str] = None
    requested_at: str
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True
