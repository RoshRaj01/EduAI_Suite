from pydantic import BaseModel
from typing import Optional

class StudentBase(BaseModel):
    name: str
    registration_number: str
    student_class: str
    department: str

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    id: int
    course_id: int
    attendance: int
    avg_score: int

    class Config:
        from_attributes = True
