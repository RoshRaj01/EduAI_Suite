from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.database import get_next_sequence


class ExamChoice(BaseModel):
    """Embedded sub-document for exam choices."""
    int_id: int = 0
    choice_text: Optional[str] = None
    is_correct: bool = False


class ExamAnswer(BaseModel):
    """Embedded sub-document for exam answers."""
    int_id: int = 0
    attempt_int_id: int = 0
    question_int_id: int = 0
    selected_choice_id: Optional[int] = None


class ExamQuestion(BaseModel):
    """Embedded sub-document for exam questions."""
    int_id: int = 0
    question_text: Optional[str] = None
    question_type: str = "mcq"
    points: float = 1.0
    order: int = 0
    choices: List[ExamChoice] = []
    answers: List[ExamAnswer] = []


class ExamAttempt(BaseModel):
    """Embedded sub-document for exam attempts."""
    int_id: int = 0
    student_id: int = 0
    score: Optional[float] = None
    status: str = "in_progress"
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    answers: List[ExamAnswer] = []


class Exam(Document):
    int_id: int = 0
    course_id: int = 0
    title: Optional[str] = None
    description: Optional[str] = None
    time_limit: int = 60
    attempts_allowed: int = 1
    randomize_questions: bool = False
    status: str = "draft"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    questions: List[ExamQuestion] = []
    attempts: List[ExamAttempt] = []

    class Settings:
        name = "exams"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("exams")
