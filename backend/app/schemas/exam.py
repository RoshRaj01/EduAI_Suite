from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OptionBase(BaseModel):
    option_text: str
    is_correct: bool

class OptionResponse(OptionBase):
    id: int
    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    question_text: str
    points: int = 1

class QuestionCreate(QuestionBase):
    options: List[OptionBase]

class QuestionResponse(QuestionBase):
    id: int
    options: List[OptionResponse]
    class Config:
        from_attributes = True

class ExamBase(BaseModel):
    title: str
    description: Optional[str] = None
    time_limit: int = 60
    max_attempts: int = 1
    randomize_questions: bool = False

class ExamCreate(ExamBase):
    course_id: int
    questions: List[QuestionCreate]

class ExamResponse(ExamBase):
    id: int
    course_id: int
    created_at: datetime
    questions: List[QuestionResponse]
    class Config:
        from_attributes = True

class ExamSimpleResponse(ExamBase):
    id: int
    course_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class ExamAttemptCreate(BaseModel):
    exam_id: int

class ExamResponseCreate(BaseModel):
    question_id: int
    selected_option_id: int

class ExamAttemptSubmit(BaseModel):
    responses: List[ExamResponseCreate]

class ExamAttemptResponse(BaseModel):
    id: int
    exam_id: int
    student_id: int
    score: int
    started_at: datetime
    completed_at: Optional[datetime]
    status: str
    class Config:
        from_attributes = True
