from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.announcement import Announcement

router = APIRouter(prefix="/announcements", tags=["Announcements"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{course_id}")
def get_announcements(course_id: int, db: Session = Depends(get_db)):
    return db.query(Announcement).filter(Announcement.course_id == course_id).all()