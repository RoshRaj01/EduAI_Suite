from pydantic import BaseModel

class CourseBase(BaseModel):
    code: str
    name: str
    batch: str
    students: int
    next_class: str
    progress: float
    color: str
    description: str

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: int

    class Config:
        from_attributes = True