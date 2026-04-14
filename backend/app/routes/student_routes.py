from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.student import Student

router = APIRouter(prefix="/students", tags=["Students"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{course_id}")
def get_students(course_id: int, db: Session = Depends(get_db)):
    return db.query(Student).filter(Student.course_id == course_id).all()