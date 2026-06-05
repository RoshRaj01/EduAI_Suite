from beanie import Document
from typing import Optional
from datetime import datetime
from app.database import get_next_sequence


class Report(Document):
    int_id: int = 0
    report_id: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    generated_at: datetime = datetime.utcnow()
    status: str = "ready"
    content: Optional[str] = None
    target_id: Optional[int] = None
    template_path: Optional[str] = None   # Path to uploaded PDF template
    docx_path: Optional[str] = None       # Path to generated DOCX output

    class Settings:
        name = "reports"

    async def assign_id(self):
        if self.int_id == 0:
            self.int_id = await get_next_sequence("reports")
