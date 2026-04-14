from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.resource import Resource

router = APIRouter(prefix="/resources", tags=["Resources"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{course_id}")
def get_resources(course_id: int, db: Session = Depends(get_db)):
    return db.query(Resource).filter(Resource.course_id == course_id).all()