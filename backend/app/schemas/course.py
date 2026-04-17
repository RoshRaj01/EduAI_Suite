from pydantic import BaseModel
from typing import Optional

class CourseBase(BaseModel):
    code: str
    name: str
    batch: str
    students: int
    progress: float
    color: str
    description: str
    teacher_name: Optional[str] = None

class CourseCreate(CourseBase):
    enrollment_code: Optional[str] = None

class CourseUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    batch: Optional[str] = None
    students: Optional[int] = None
    progress: Optional[float] = None
    color: Optional[str] = None
    description: Optional[str] = None
    enrollment_code: Optional[str] = None

class CourseResponse(CourseBase):
    id: int
    enrollment_code: Optional[str] = None
    course_plan_path: Optional[str] = None

    class Config:
        from_attributes = True