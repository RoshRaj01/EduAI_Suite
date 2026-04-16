from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.announcement import Announcement
from app.models.course import Course
from app.schemas.announcement import AnnouncementResponse
from app.utils.file_uploads import save_optional_upload
from typing import Optional

router = APIRouter(prefix="/announcements", tags=["Announcements"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{course_id}", response_model=list[AnnouncementResponse])
def get_announcements(course_id: int, db: Session = Depends(get_db)):
    return db.query(Announcement).filter(Announcement.course_id == course_id).all()

@router.post("/{course_id}", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    course_id: int,
    title: str = Form(...),
    body: str = Form(...),
    time: str = Form("Just now"),
    pinned: bool = Form(False),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    new_announcement = Announcement(
        course_id=course_id,
        title=title,
        body=body,
        time=time,
        pinned=pinned,
        attachment_path=save_optional_upload(file, "announcements"),
    )
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    return new_announcement

@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(announcement_id: int, db: Session = Depends(get_db)):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    db.delete(announcement)
    db.commit()
    return None
