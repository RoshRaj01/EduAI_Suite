from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from app.database import get_next_sequence


class SubmissionInteraction(Document):
    """Stores an interaction block authored by a student for a specific slide."""
    int_id: int = 0
    submission_id: int = 0
    slide_number: int = 0
    interaction_type: Optional[str] = None
    config: Optional[dict] = None
    order_index: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "submission_interactions"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("submission_interactions")


class PresentationSubmission(Document):
    """Tracks student submissions for presentation assignments."""
    int_id: int = 0
    assignment_id: int = 0
    student_id: int = 0
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    status: str = "draft"
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    is_late: bool = False
    grade: Optional[float] = None
    teacher_feedback: Optional[str] = None
    graded_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "presentation_submissions"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("presentation_submissions")


class PresentationAssignment(Document):
    """Manages presentation assignments."""
    int_id: int = 0
    teacher_id: int = 0
    course_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "presentation_assignments"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("presentation_assignments")


class QnAUpvote(Document):
    """Tracks which students have upvoted a Q&A question."""
    int_id: int = 0
    question_id: int = 0
    student_id: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "qna_upvotes"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("qna_upvotes")


class SlidoQnA(Document):
    """Represents a Q&A question in the session."""
    int_id: int = 0
    session_id: int = 0
    student_id: int = 0
    question_text: Optional[str] = None
    is_anonymous: bool = False
    upvotes: int = 0
    is_answered: bool = False
    teacher_answer: Optional[str] = None
    answered_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "slido_qna"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("slido_qna")


class PollResponse(Document):
    """Represents a student's response to a poll."""
    int_id: int = 0
    poll_id: int = 0
    student_id: int = 0
    option_text: Optional[str] = None
    response_text: Optional[str] = None
    response_value: Optional[int] = None
    responded_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "poll_responses"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("poll_responses")


class SlidoPoll(Document):
    """Represents a live poll in a presentation session."""
    int_id: int = 0
    session_id: int = 0
    teacher_id: int = 0
    question: Optional[str] = None
    poll_type: str = "multiple_choice"
    is_active: bool = True
    total_responses: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "slido_polls"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("slido_polls")


class SlidoSession(Document):
    """Represents an active live presentation session."""
    int_id: int = 0
    teacher_id: int = 0
    assignment_id: Optional[int] = None
    submission_id: Optional[int] = None
    pin: Optional[str] = None
    status: str = "active"
    active_view: str = "presentation"
    current_slide: int = 1
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "slido_sessions"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("slido_sessions")
