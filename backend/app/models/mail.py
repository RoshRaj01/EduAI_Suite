from beanie import Document
from pydantic import Field
from typing import Optional, List, Any
from datetime import datetime
from app.database import get_next_sequence


class MailDraft(Document):
    int_id: int = 0
    subject: Optional[str] = None
    body: Optional[str] = None
    student_ids: Optional[List[Any]] = None
    conditions: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "mail_drafts"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("mail_drafts")


class MailHistory(Document):
    int_id: int = 0
    subject: Optional[str] = None
    body: Optional[str] = None
    sent_at: datetime = Field(default_factory=datetime.now)
    recipients: Optional[List[Any]] = None
    recipient_count: int = 0

    class Settings:
        name = "mail_history"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("mail_history")
