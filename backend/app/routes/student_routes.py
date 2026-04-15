from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.student import Student
from app.models.course import Course
from app.schemas.student import StudentCreate, StudentResponse
import csv
import io

router = APIRouter(prefix="/students", tags=["Students"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{course_id}", response_model=list[StudentResponse])
def get_students(course_id: int, db: Session = Depends(get_db)):
    return db.query(Student).filter(Student.course_id == course_id).all()

@router.post("/{course_id}", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def manual_enroll(course_id: int, student: StudentCreate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    new_student = Student(**student.model_dump(), course_id=course_id)
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student

@router.post("/bulk_upload/{course_id}", status_code=status.HTTP_201_CREATED)
async def bulk_enroll(course_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    contents = await file.read()
    decoded = contents.decode("utf-8")
    reader = csv.reader(io.StringIO(decoded))
    
    next(reader, None)  # Skip header row
    
    students_to_add = []
    for row in reader:
        # Expected format: registration_number, name, class, department
        if len(row) >= 4:
            reg_num, name, student_class, dept = row[0], row[1], row[2], row[3]
            students_to_add.append(
                Student(
                    course_id=course_id,
                    registration_number=reg_num,
                    name=name,
                    student_class=student_class,
                    department=dept,
                    attendance=0,
                    avg_score=0
                )
            )
            
    db.bulk_save_objects(students_to_add)
    db.commit()
    return {"message": f"Successfully enrolled {len(students_to_add)} students"}

@router.post("/enroll/code", status_code=status.HTTP_201_CREATED)
def enroll_via_code(enrollment_code: str, student: StudentCreate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.enrollment_code == enrollment_code).first()
    if not course:
        raise HTTPException(status_code=404, detail="Invalid enrollment code")
        
    new_student = Student(**student.model_dump(), course_id=course.id)
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student