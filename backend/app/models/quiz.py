from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    cover_image = Column(String, nullable=True)
    is_draft = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    sessions = relationship("QuizSession", back_populates="quiz")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question_text = Column(Text)
    question_type = Column(String, default="mcq") # mcq, true_false, puzzle, open_ended
    image_url = Column(String, nullable=True)
    time_limit = Column(Integer, default=20) # seconds
    points = Column(Integer, default=1000)
    order = Column(Integer)
    
    quiz = relationship("Quiz", back_populates="questions")
    options = relationship("QuizOption", back_populates="question", cascade="all, delete-orphan")

class QuizOption(Base):
    __tablename__ = "quiz_options"
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("quiz_questions.id"))
    option_text = Column(String)
    is_correct = Column(Boolean, default=False)
    color = Column(String, nullable=True) # Kahoot colors
    
    question = relationship("QuizQuestion", back_populates="options")

class QuizSession(Base):
    __tablename__ = "quiz_sessions"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    pin = Column(String, unique=True, index=True)
    status = Column(String, default="lobby") # lobby, question, result, leaderboard, finished
    current_question_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    
    quiz = relationship("Quiz", back_populates="sessions")
    players = relationship("QuizPlayer", back_populates="session", cascade="all, delete-orphan")

class QuizPlayer(Base):
    __tablename__ = "quiz_players"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("quiz_sessions.id"))
    student_id = Column(String, nullable=True)
    nickname = Column(String)
    avatar = Column(String, nullable=True) # Emoji character
    score = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    last_response_time = Column(DateTime, nullable=True)
    
    session = relationship("QuizSession", back_populates="players")
    answers = relationship("QuizAnswer", back_populates="player", cascade="all, delete-orphan")

class QuizAnswer(Base):
    __tablename__ = "quiz_answers"
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("quiz_players.id"))
    question_id = Column(Integer, ForeignKey("quiz_questions.id"))
    option_id = Column(Integer, ForeignKey("quiz_options.id"), nullable=True)
    text_answer = Column(String, nullable=True)
    is_correct = Column(Boolean)
    points_earned = Column(Integer)
    response_time_ms = Column(Integer)
    
    player = relationship("QuizPlayer", back_populates="answers")
