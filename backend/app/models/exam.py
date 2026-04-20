from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String)
    description = Column(Text, nullable=True)
    time_limit = Column(Integer, default=60)  # in minutes
    attempts_allowed = Column(Integer, default=1)
    randomize_questions = Column(Boolean, default=False)
    status = Column(String, default="draft")  # draft, published, archived
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan")
    attempts = relationship("ExamAttempt", back_populates="exam", cascade="all, delete-orphan")

class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    question_text = Column(Text)
    question_type = Column(String, default="mcq")  # mcq
    points = Column(Float, default=1.0)
    order = Column(Integer, default=0)

    # Relationships
    exam = relationship("Exam", back_populates="questions")
    choices = relationship("ExamChoice", back_populates="question", cascade="all, delete-orphan")

class ExamChoice(Base):
    __tablename__ = "exam_choices"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("exam_questions.id"))
    choice_text = Column(Text)
    is_correct = Column(Boolean, default=False)

    # Relationships
    question = relationship("ExamQuestion", back_populates="choices")

class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Float, nullable=True)
    status = Column(String, default="in_progress")  # in_progress, submitted, time_up
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)

    # Relationships
    exam = relationship("Exam", back_populates="attempts")
    answers = relationship("ExamAnswer", back_populates="attempt", cascade="all, delete-orphan")

class ExamAnswer(Base):
    __tablename__ = "exam_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("exam_attempts.id"))
    question_id = Column(Integer, ForeignKey("exam_questions.id"))
    selected_choice_id = Column(Integer, ForeignKey("exam_choices.id"), nullable=True)

    # Relationships
    attempt = relationship("ExamAttempt", back_populates="answers")
