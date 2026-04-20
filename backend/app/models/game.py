from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class ChainAnswerGame(Base):
    __tablename__ = "chain_answer_games"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, default="New Game")
    # standard, category, compound, ladder, geography
    chain_variation = Column(String, default="standard")
    category = Column(String, nullable=True)
    difficulty_level = Column(String, default="medium")  # easy, medium, hard
    language = Column(String, default="en")
    # setup, active, completed, paused
    status = Column(String, default="setup")
    starting_word = Column(String, default="Apple")
    time_per_turn = Column(Integer, default=30)  # seconds
    max_words = Column(Integer, nullable=True)
    penalty_on_invalid = Column(Boolean, default=False)
    # skip_turn, lose_points, elimination
    penalty_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    # Relationships
    players = relationship("ChainAnswerGamePlayer",
                           back_populates="game", cascade="all, delete-orphan")
    words = relationship("ChainAnswerGameWord",
                         back_populates="game", cascade="all, delete-orphan")


class ChainAnswerGamePlayer(Base):
    __tablename__ = "chain_answer_game_players"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("chain_answer_games.id"))
    student_id = Column(String)  # Can be student name or ID
    name = Column(String)
    join_order = Column(Integer)
    score = Column(Float, default=0)
    words_submitted = Column(Integer, default=0)
    words_valid = Column(Integer, default=0)
    status = Column(String, default="active")  # active, eliminated, skipped

    # Relationships
    game = relationship("ChainAnswerGame", back_populates="players")


class ChainAnswerGameWord(Base):
    __tablename__ = "chain_answer_game_words"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("chain_answer_games.id"))
    word = Column(String)
    submitted_by = Column(String)  # player ID or name
    submitted_at = Column(DateTime, default=datetime.utcnow)
    is_valid = Column(Boolean, default=True)
    position = Column(Integer)
    validation_reason = Column(Text, nullable=True)

    # Relationships
    game = relationship("ChainAnswerGame", back_populates="words")
