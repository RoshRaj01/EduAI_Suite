from pydantic import BaseModel

class AnnouncementBase(BaseModel):
    title: str
    body: str
    time: str
    pinned: bool = False

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: int
    course_id: int

    class Config:
        from_attributes = True
