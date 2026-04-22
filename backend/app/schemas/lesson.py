from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LessonGenerateRequest(BaseModel):
    topic: str
    syllabus_context: Optional[str] = None
    course_id: int


class LessonCreateRequest(BaseModel):
    course_id: int
    title: Optional[str] = None
    topic: str
    syllabus_context: Optional[str] = None
    lecture_flow: Optional[str] = None
    examples: Optional[str] = None
    activities: Optional[str] = None
    quiz_questions: Optional[str] = None


class LessonUpdateRequest(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None
    syllabus_context: Optional[str] = None
    lecture_flow: Optional[str] = None
    examples: Optional[str] = None
    activities: Optional[str] = None
    quiz_questions: Optional[str] = None


class LessonPostRequest(BaseModel):
    pass  # Just posting the lesson, no additional data needed


class LessonResponse(BaseModel):
    id: int
    course_id: int
    title: Optional[str]
    topic: str
    syllabus_context: Optional[str]
    lecture_flow: Optional[str]
    examples: Optional[str]
    activities: Optional[str]
    quiz_questions: Optional[str]
    created_by: int
    posted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LessonListResponse(BaseModel):
    id: int
    course_id: int
    title: Optional[str]
    topic: str
    posted_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
