from beanie import Document
from pydantic import Field
from typing import Optional, Any
from datetime import datetime
from app.database import get_next_sequence


class ActionHistory(Document):
    int_id: int = 0
    feature: Optional[str] = None
    action: Optional[str] = None
    reaction: Optional[str] = None
    result: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    user_id: Optional[str] = None
    metadata_json: Optional[dict] = None

    class Settings:
        name = "action_history"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("action_history")
