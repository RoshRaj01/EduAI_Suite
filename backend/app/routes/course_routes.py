from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import Optional
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.course import Course
from app.models.student import Student
from app.models.assignment import Assignment
from app.models.announcement import Announcement
from app.schemas.course import CourseCreate, CourseResponse, CourseUpdate
from app.utils.file_uploads import save_optional_upload

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
def create_course(
    code: str = Form(...),
    name: str = Form(...),
    batch: str = Form(...),
    color: str = Form(...),
    description: str = Form(...),
    enrollment_code: Optional[str] = Form(None),
    teacher_name: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    course_plan_path = save_optional_upload(file, "courses")
    new_course = Course(
        code=code,
        name=name,
        batch=batch,
        students=0,
        progress=0.0,
        color=color,
        description=description,
        enrollment_code=enrollment_code,
        teacher_name=teacher_name,
        course_plan_path=course_plan_path
    )
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