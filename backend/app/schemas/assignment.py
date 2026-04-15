from pydantic import BaseModel
from typing import Optional

class AssignmentBase(BaseModel):
    title: str
    description: str
    due_date: str
    max_points: int

class AssignmentCreate(AssignmentBase):
    media_path: Optional[str] = None

class AssignmentResponse(AssignmentBase):
    id: int
    course_id: int
    media_path: Optional[str] = None

    class Config:
        from_attributes = True
