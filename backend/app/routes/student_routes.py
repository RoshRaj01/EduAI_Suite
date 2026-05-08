# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.student import Student
from app.models.course import Course
from app.schemas.student import StudentCreate, StudentResponse
import csv
import io
import random

student_router = APIRouter(prefix="/students", tags=["Students"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@student_router.get("/", response_model=list[StudentResponse])
def get_all_students(db: Session = Depends(get_db)):
    return db.query(Student).all()


@student_router.get("/{course_id}", response_model=list[StudentResponse])
def get_students(course_id: int, db: Session = Depends(get_db)):
    return db.query(Student).filter(Student.course_id == course_id).all()


@student_router.post("/{course_id}", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def manual_enroll(course_id: int, student: StudentCreate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    import random
    new_student = Student(
        **student.model_dump(), 
        course_id=course_id,
        attendance=random.randint(60, 98),
        avg_score=random.randint(55, 95)
    )
    course.students = (course.students or 0) + 1
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student


@student_router.post("/bulk_upload/{course_id}", status_code=status.HTTP_201_CREATED)
async def bulk_enroll(course_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    import re
    import pandas as pd
    import io

    contents = await file.read()
    filename = file.filename.lower()
    
    text_content = ""
    try:
        if filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(contents))
            text_content = df.to_csv(index=False)
        elif filename.endswith(".csv") or filename.endswith(".txt"):
            text_content = contents.decode("utf-8", errors="ignore")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    students_to_add = []
    
    for line in text_content.split('\n'):
        line = line.strip()
        if not line:
            continue
            
        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', line)
        if not email_match:
            continue
        email = email_match.group(0)
        
        # Regex for Reg/Roll Number
        reg_match = re.search(r'(?i)(?:reg(?:ister)?|roll|id)?[\s#:\.-]*\b([A-Z0-9]*\d[A-Z0-9]*)\b', line)
        reg_num = reg_match.group(1).replace('"', '').strip() if reg_match else "UNKNOWN"
        
        # Regex for Department
        dept_match = re.search(r'(?i)(?:dept|department)[\s:\.-]*([a-zA-Z\s]+)(?:,|;|$)', line)
        dept = dept_match.group(1).replace('"', '').strip() if dept_match else "General"
        
        # Regex for Class
        class_match = re.search(r'(?i)(?:class|batch|section)[\s:\.-]*([a-zA-Z0-9\s-]+)(?:,|;|$)', line)
        student_class = class_match.group(1).replace('"', '').strip() if class_match else "General"
        
        # Regex for Name
        name_match = re.search(r'(?i)(?:name|student)[\s:\.-]*([a-zA-Z\s]+)(?:,|;|$)', line)
        if name_match:
            name = name_match.group(1).replace('"', '').strip()
        else:
            prefix = line.split(email)[0]
            name_candidates = re.findall(r'\b[A-Z][a-z]+\b', prefix)
            if len(name_candidates) >= 2:
                name = " ".join(name_candidates[-2:])
            elif len(name_candidates) == 1:
                name = name_candidates[0]
            else:
                words = re.findall(r'[a-zA-Z]+', prefix)
                name = " ".join(words[:2]) if words else "Student"

        # Tabular fallback: if line is comma-separated, try extracting fixed indices
        csv_match = re.match(r'^([^,]+),([^,]+),([^,]+@[^,]+),([^,]+),([^,]+)$', line)
        if csv_match:
            reg_num = csv_match.group(1).replace('"', '').strip()
            name = csv_match.group(2).replace('"', '').strip()
            student_class = csv_match.group(4).replace('"', '').strip()
            dept = csv_match.group(5).replace('"', '').strip()

        students_to_add.append(
            Student(
                course_id=course_id,
                registration_number=reg_num[:20],
                name=name[:50],
                email=email[:50],
                student_class=student_class[:50],
                department=dept[:50],
                attendance=random.randint(60, 98),
                avg_score=random.randint(55, 95)
            )
        )

    if not students_to_add:
        raise HTTPException(status_code=400, detail="Could not extract student details using regex.")

    db.bulk_save_objects(students_to_add)
    course.students = (course.students or 0) + len(students_to_add)
    db.commit()
    return {"message": f"Successfully enrolled {len(students_to_add)} students"}


@student_router.post("/enroll/code", status_code=status.HTTP_201_CREATED)
def enroll_via_code(enrollment_code: str, student: StudentCreate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(
        Course.enrollment_code == enrollment_code).first()
    if not course:
        raise HTTPException(status_code=404, detail="Invalid enrollment code")

    import random
    new_student = Student(
        **student.model_dump(), 
        course_id=course.id,
        attendance=random.randint(60, 98),
        avg_score=random.randint(55, 95)
    )
    course.students = (course.students or 0) + 1
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student


@student_router.get("/{course_id}/active", response_model=list[StudentResponse])
def get_active_students(course_id: int, db: Session = Depends(get_db)):
    """Get all active students enrolled in a course (for games/activities)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Return students with decent attendance/engagement (active status)
    students = db.query(Student).filter(
        Student.course_id == course_id,
        Student.attendance > 0  # Filter for active students
    ).all()
    return students


@student_router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    course = db.query(Course).filter(Course.id == student.course_id).first()
    if course and course.students and course.students > 0:
        course.students -= 1

    db.delete(student)
    db.commit()
    return None
