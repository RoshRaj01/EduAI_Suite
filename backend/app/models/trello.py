from beanie import Document
from pydantic import Field
from typing import Optional, List, Any
from datetime import datetime
from app.database import get_next_sequence


class TrelloBoard(Document):
    int_id: Optional[str] = None  # Trello uses string IDs
    name: Optional[str] = None
    background: Optional[str] = None
    creator_email: Optional[str] = None
    starred: bool = False
    members: List[str] = []
    join_requests: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "trello_boards"


class TrelloColumn(Document):
    int_id: Optional[str] = None  # String IDs
    board_id: Optional[str] = None
    title: Optional[str] = None
    sequence: int = 0

    class Settings:
        name = "trello_columns"


class TrelloCard(Document):
    int_id: Optional[str] = None  # String IDs
    column_id: Optional[str] = None
    board_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    sequence: int = 0
    labels: List[Any] = []
    checklist: List[Any] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "trello_cards"
