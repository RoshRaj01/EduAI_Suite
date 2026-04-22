from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ExamChoiceBase(BaseModel):
    choice_text: str
    is_correct: bool = False

class ExamChoiceResponse(ExamChoiceBase):
    id: int
    class Config:
        from_attributes = True

class ExamQuestionBase(BaseModel):
    question_text: str
    question_type: str = "mcq"
    points: float = 1.0
    order: int = 0

class ExamQuestionCreate(ExamQuestionBase):
    choices: List[ExamChoiceBase]

class ExamQuestionResponse(ExamQuestionBase):
    id: int
    choices: List[ExamChoiceResponse]
    class Config:
        from_attributes = True

class ExamBase(BaseModel):
    title: str
    description: Optional[str] = None
    time_limit: int = 60
    attempts_allowed: int = 1
    randomize_questions: bool = False
    status: str = "draft"

class ExamCreate(ExamBase):
    course_id: int
    questions: List[ExamQuestionCreate]

class CourseBrief(BaseModel):
    id: int
    name: str
    code: str
    class Config:
        from_attributes = True

class ExamResponse(ExamBase):
    id: int
    course_id: int
    created_at: datetime
    course: Optional[CourseBrief] = None
    questions: List[ExamQuestionResponse]
    class Config:
        from_attributes = True

class ExamAnswerCreate(BaseModel):
    question_id: int
    selected_choice_id: Optional[int] = None

class ExamAttemptCreate(BaseModel):
    exam_id: int

class ExamAttemptSubmit(BaseModel):
    answers: List[ExamAnswerCreate]

class ExamAttemptResponse(BaseModel):
    id: int
    exam_id: int
    student_id: int
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    score: Optional[float] = None
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    class Config:
        from_attributes = True

class ExamReviewResponse(BaseModel):
    exam_id: int
    title: str
    attempts: List[ExamAttemptResponse]

class ExamAnswerResponse(BaseModel):
    id: int
    question_id: int
    selected_choice_id: Optional[int] = None
    question: ExamQuestionResponse
    class Config:
        from_attributes = True

class ExamAttemptDetailResponse(ExamAttemptResponse):
    exam: ExamResponse
    answers: List[ExamAnswerResponse]
