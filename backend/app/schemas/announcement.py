from pydantic import BaseModel
from typing import Optional

class AnnouncementBase(BaseModel):
    title: str
    body: str
    time: str
    pinned: bool = False
    attachment_path: Optional[str] = None

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: int
    course_id: int

    class Config:
        from_attributes = True
