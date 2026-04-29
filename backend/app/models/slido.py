from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import enum


class PresentationAssignment(Base):
    """Manages presentation assignments (similar to Google Classroom)"""
    __tablename__ = "presentation_assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), index=True)
    course_id = Column(Integer, ForeignKey(
        "courses.id", ondelete="CASCADE"), nullable=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=True)
    status = Column(String, default="active")  # active, closed, archived
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    submissions = relationship(
        "PresentationSubmission", back_populates="assignment", cascade="all, delete-orphan")
    sessions = relationship("SlidoSession", back_populates="assignment")


class PresentationSubmission(Base):
    """Tracks student submissions for presentation assignments"""
    __tablename__ = "presentation_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey(
        "presentation_assignments.id", ondelete="CASCADE"), index=True)
    student_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), index=True)
    file_url = Column(String)  # S3/MinIO pre-signed URL
    file_name = Column(String)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    is_late = Column(Boolean, default=False)
    grade = Column(Float, nullable=True)
    teacher_feedback = Column(Text, nullable=True)
    graded_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    assignment = relationship("PresentationAssignment",
                              back_populates="submissions")


class SlidoSession(Base):
    """Represents an active live presentation session"""
    __tablename__ = "slido_sessions"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), index=True)
    assignment_id = Column(Integer, ForeignKey(
        "presentation_assignments.id", ondelete="SET NULL"), nullable=True)
    submission_id = Column(Integer, ForeignKey(
        "presentation_submissions.id", ondelete="SET NULL"), nullable=True)
    pin = Column(String, unique=True, index=True)  # Session PIN for joining
    status = Column(String, default="active")  # active, paused, ended
    # presentation, poll, qna
    active_view = Column(String, default="presentation")
    current_slide = Column(Integer, default=1)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    assignment = relationship("PresentationAssignment",
                              back_populates="sessions")
    polls = relationship("SlidoPoll", back_populates="session",
                         cascade="all, delete-orphan")
    qna_questions = relationship(
        "SlidoQnA", back_populates="session", cascade="all, delete-orphan")


class SlidoPoll(Base):
    """Represents a live poll in a presentation session"""
    __tablename__ = "slido_polls"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey(
        "slido_sessions.id", ondelete="CASCADE"), index=True)
    teacher_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), index=True)
    question = Column(Text)
    # multiple_choice, rating, open_ended
    poll_type = Column(String, default="multiple_choice")
    is_active = Column(Boolean, default=True)
    total_responses = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    session = relationship("SlidoSession", back_populates="polls")
    responses = relationship(
        "PollResponse", back_populates="poll", cascade="all, delete-orphan")


class PollResponse(Base):
    """Represents a student's response to a poll"""
    __tablename__ = "poll_responses"

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey(
        "slido_polls.id", ondelete="CASCADE"), index=True)
    student_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), index=True)
    # For multiple choice, this is the selected option
    option_text = Column(String)
    response_text = Column(Text, nullable=True)  # For open-ended questions
    response_value = Column(Integer, nullable=True)  # For rating (1-5)
    responded_at = Column(DateTime, default=datetime.utcnow)

    poll = relationship("SlidoPoll", back_populates="responses")


class SlidoQnA(Base):
    """Represents a Q&A question in the session"""
    __tablename__ = "slido_qna"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey(
        "slido_sessions.id", ondelete="CASCADE"), index=True)
    student_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), index=True)
    question_text = Column(Text)
    is_anonymous = Column(Boolean, default=False)
    upvotes = Column(Integer, default=0)
    is_answered = Column(Boolean, default=False)
    teacher_answer = Column(Text, nullable=True)
    answered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    session = relationship("SlidoSession", back_populates="qna_questions")
    upvote_records = relationship(
        "QnAUpvote", back_populates="question", cascade="all, delete-orphan")


class QnAUpvote(Base):
    """Tracks which students have upvoted a Q&A question"""
    __tablename__ = "qna_upvotes"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey(
        "slido_qna.id", ondelete="CASCADE"), index=True)
    student_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("SlidoQnA", back_populates="upvote_records")
