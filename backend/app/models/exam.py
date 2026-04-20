from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    time_limit = Column(Integer, default=60) # in minutes
    max_attempts = Column(Integer, default=1)
    randomize_questions = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan")
    attempts = relationship("ExamAttempt", back_populates="exam", cascade="all, delete-orphan")

class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"))
    question_text = Column(String)
    points = Column(Integer, default=1)
    
    exam = relationship("Exam", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")

class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("exam_questions.id", ondelete="CASCADE"))
    option_text = Column(String)
    is_correct = Column(Boolean, default=False)

    question = relationship("ExamQuestion", back_populates="options")

class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    score = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String, default="ongoing") # ongoing, completed

    exam = relationship("Exam", back_populates="attempts")
    responses = relationship("ExamResponse", back_populates="attempt", cascade="all, delete-orphan")

class ExamResponse(Base):
    __tablename__ = "exam_responses"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("exam_attempts.id", ondelete="CASCADE"))
    question_id = Column(Integer, ForeignKey("exam_questions.id", ondelete="CASCADE"))
    selected_option_id = Column(Integer, ForeignKey("question_options.id", ondelete="CASCADE"))

    attempt = relationship("ExamAttempt", back_populates="responses")
