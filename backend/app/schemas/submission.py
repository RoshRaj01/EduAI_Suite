from pydantic import BaseModel
from typing import Optional

class SubmissionBase(BaseModel):
    student_name: str
    submitted_at: str

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionResponse(SubmissionBase):
    id: int
    assignment_id: int
    file_path: Optional[str] = None
    grade: Optional[float] = None

    class Config:
        from_attributes = True
