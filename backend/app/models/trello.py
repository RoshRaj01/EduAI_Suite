from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class TrelloBoard(Base):
    __tablename__ = "trello_boards"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    background = Column(String)
    creator_email = Column(String, index=True)
    starred = Column(Boolean, default=False)
    members = Column(JSON, default=[]) # List of emails
    join_requests = Column(JSON, default=[]) # List of emails
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TrelloColumn(Base):
    __tablename__ = "trello_columns"

    id = Column(String, primary_key=True, index=True)
    board_id = Column(String, ForeignKey("trello_boards.id", ondelete="CASCADE"))
    title = Column(String)
    sequence = Column(Integer, default=0)

class TrelloCard(Base):
    __tablename__ = "trello_cards"

    id = Column(String, primary_key=True, index=True)
    column_id = Column(String, ForeignKey("trello_columns.id", ondelete="CASCADE"))
    board_id = Column(String, ForeignKey("trello_boards.id", ondelete="CASCADE"))
    title = Column(String)
    description = Column(Text, nullable=True)
    due_date = Column(String, nullable=True)
    sequence = Column(Integer, default=0)
    labels = Column(JSON, default=[])
    checklist = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
