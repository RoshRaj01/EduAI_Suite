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
import random
import string
import PyPDF2
import docx
import io
import re

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

def generate_unique_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@router.post("/extract_details")
async def extract_course_details(file: UploadFile = File(...)):
    contents = await file.read()
    text = ""
    
    if file.filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(io.BytesIO(contents))
        raw_text = ""
        for page in reader.pages:
            raw_text += page.extract_text() + "\n"
        # Normalize text: collapse multiple spaces and newlines to avoid PDF-specific layout issues
        text = raw_text  # normalize newlines

    elif file.filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(contents))
        # Extract text from paragraphs
        paragraphs_text = "\n".join([para.text for para in doc.paragraphs])
        # Extract text from tables (many course plans use tables for metadata)
        tables_text = ""
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    tables_text += "\n" + cell.text
        text = paragraphs_text + "\n" + tables_text
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF or DOCX.")

    # Parsing logic based on the provided sample image structure
    # Expected fields: Course Code, Course Name, Course Instructor(s) Name, Programme(s)
    
    # regex matches for labels in the document
    details = {
        "code": "",
        "name": "",
        "teacher_name": "",
        "programmes": ""
    }   
    
    # Simple regex based on the image format
    # Use re.IGNORECASE and allow for various separators (colon, spaces, etc.)
    
    # Course Code: SCI202-4L
    # Be greedy with characters typically used in codes
    code_match = re.search(r"Course\s*Code\s*[:\-]?\s*([A-Z0-9\-]+)", text, re.IGNORECASE)
    if code_match: details["code"] = code_match.group(1).strip()
    
    # Course Name: Hypothesis Testing
    name_match = re.search(r"Course Name[:\s]+([^:]+?)(?= Course Code| Course Type| Method| Hours| Credits|$)", text, re.IGNORECASE)
    if not name_match:
        name_match = re.search(r"Course Name[:\s]+([^\n\r]+)", text, re.IGNORECASE)
    if name_match: details["name"] = name_match.group(1).strip()
    

    # 🔹 Instructor (handles multiple formats)
    instructor_match = re.search(
        r"(?:Course\s+Instructor\(s\)\s+Name|Instructor)[:\s#]+(.+)",
        text,
        re.IGNORECASE
    )

    if instructor_match:
        details["teacher_name"] = instructor_match.group(1).strip()


    # 🔹 Programmes → Description (ROBUST FIX)

    lines = raw_text.split("\n")

    desc_lines = []
    capture = False

    for line in lines:
        l = line.strip().lower()

        # START condition
        if "offered programme" in l:
            capture = True
            continue

        # STOP condition
        if any(x in l for x in [
            "course learning outcome",
            "outcome reference",
            "course credit",
            "unit",
            "syllabus"
        ]):
            break

        if capture:
            if line.strip():
                desc_lines.append(line.strip())

    details["description"] = " ".join(desc_lines).strip()

    return details


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
    # If no enrollment_code is provided by the system/user, generate a unique 6-char key
    final_code = enrollment_code if enrollment_code else generate_unique_code()
    
    new_course = Course(
        code=code,
        name=name,
        batch=batch,
        students=0,
        progress=0.0,
        color=color,
        description=description,
        enrollment_code=final_code,
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