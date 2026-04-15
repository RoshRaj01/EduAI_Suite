from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.course import Course
from app.models.student import Student
from app.models.assignment import Assignment
from app.models.announcement import Announcement
from app.schemas.course import CourseCreate, CourseResponse, CourseUpdate

router = APIRouter(prefix="/courses", tags=["Courses"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()

@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    new_course = Course(**course.model_dump())
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

@router.put("/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, course_update: CourseUpdate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    update_data = course_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(course, key, value)
    
    db.commit()
    db.refresh(course)
    return course

@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Manually delete all child records to avoid FK constraint errors
    db.query(Announcement).filter(Announcement.course_id == course_id).delete(synchronize_session="fetch")
    db.query(Assignment).filter(Assignment.course_id == course_id).delete(synchronize_session="fetch")
    db.query(Student).filter(Student.course_id == course_id).delete(synchronize_session="fetch")
    
    db.delete(course)
    db.commit()
    return None