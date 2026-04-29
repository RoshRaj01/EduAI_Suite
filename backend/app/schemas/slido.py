from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ==================== PresentationAssignment Schemas ====================

class PresentationAssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    course_id: Optional[int] = None


class PresentationAssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None


class PresentationAssignmentResponse(BaseModel):
    id: int
    teacher_id: int
    course_id: Optional[int]
    title: str
    description: Optional[str]
    deadline: Optional[datetime]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== PresentationSubmission Schemas ====================

class PresentationSubmissionCreate(BaseModel):
    assignment_id: int
    file_name: str


class PresentationSubmissionGrade(BaseModel):
    grade: float
    teacher_feedback: Optional[str] = None


class PresentationSubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    file_name: str
    file_url: str
    submitted_at: datetime
    is_late: bool
    grade: Optional[float]
    teacher_feedback: Optional[str]
    graded_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== SlidoSession Schemas ====================

class SlidoSessionCreate(BaseModel):
    assignment_id: Optional[int] = None
    submission_id: Optional[int] = None


class SlidoSessionUpdate(BaseModel):
    status: Optional[str] = None
    active_view: Optional[str] = None
    current_slide: Optional[int] = None


class SlidoSessionResponse(BaseModel):
    id: int
    teacher_id: int
    assignment_id: Optional[int]
    submission_id: Optional[int]
    pin: str
    status: str
    active_view: str
    current_slide: int
    started_at: datetime
    ended_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== SlidoPoll Schemas ====================

class SlidoPollCreate(BaseModel):
    question: str
    poll_type: str = "multiple_choice"  # multiple_choice, rating, open_ended


class PollOptionInput(BaseModel):
    text: str


class SlidoPollResponse(BaseModel):
    id: int
    session_id: int
    teacher_id: int
    question: str
    poll_type: str
    is_active: bool
    total_responses: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== PollResponse Schemas ====================

class PollResponseCreate(BaseModel):
    poll_id: int
    option_text: Optional[str] = None
    response_text: Optional[str] = None
    response_value: Optional[int] = None


class PollResponseResponse(BaseModel):
    id: int
    poll_id: int
    student_id: int
    option_text: Optional[str]
    response_text: Optional[str]
    response_value: Optional[int]
    responded_at: datetime

    class Config:
        from_attributes = True


# ==================== SlidoQnA Schemas ====================

class SlidoQnACreate(BaseModel):
    question_text: str
    is_anonymous: bool = False


class SlidoQnAUpdate(BaseModel):
    is_answered: Optional[bool] = None
    teacher_answer: Optional[str] = None


class SlidoQnAResponse(BaseModel):
    id: int
    session_id: int
    student_id: int
    question_text: str
    is_anonymous: bool
    upvotes: int
    is_answered: bool
    teacher_answer: Optional[str]
    answered_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== QnAUpvote Schemas ====================

class QnAUpvoteResponse(BaseModel):
    id: int
    question_id: int
    student_id: int
    created_at: datetime

    class Config:
        from_attributes = True
