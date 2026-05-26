from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.database import get_next_sequence


class QuizOption(BaseModel):
    """Embedded sub-document for quiz options."""
    int_id: int = 0
    option_text: Optional[str] = None
    is_correct: bool = False
    color: Optional[str] = None


class QuizQuestion(BaseModel):
    """Embedded sub-document for quiz questions."""
    int_id: int = 0
    question_text: Optional[str] = None
    question_type: str = "mcq"
    image_url: Optional[str] = None
    time_limit: int = 20
    points: int = 1000
    order: int = 0
    options: List[QuizOption] = []


class Quiz(Document):
    int_id: int = 0
    teacher_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    is_draft: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    questions: List[QuizQuestion] = []

    class Settings:
        name = "quizzes"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("quizzes")


class QuizAnswer(Document):
    """Separate collection — answers can grow unbounded."""
    int_id: int = 0
    player_id: int = 0
    question_id: int = 0
    option_id: Optional[int] = None
    text_answer: Optional[str] = None
    is_correct: bool = False
    points_earned: int = 0
    response_time_ms: int = 0

    class Settings:
        name = "quiz_answers"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("quiz_answers")


class QuizPlayer(Document):
    """Separate collection — players can grow unbounded."""
    int_id: int = 0
    session_id: int = 0
    student_id: Optional[str] = None
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    score: int = 0
    streak: int = 0
    last_response_time: Optional[datetime] = None

    class Settings:
        name = "quiz_players"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("quiz_players")


class QuizSession(Document):
    int_id: int = 0
    quiz_id: int = 0
    pin: Optional[str] = None
    status: str = "lobby"
    current_question_index: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None

    class Settings:
        name = "quiz_sessions"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("quiz_sessions")
