from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.assignment import Assignment
from app.models.course import Course
from app.models.announcement import Announcement
from app.schemas.assignment import AssignmentResponse, AssignmentCreate
from datetime import datetime
import os
import shutil
from typing import Optional

router = APIRouter(prefix="/assignments", tags=["Assignments"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Directory to save uploaded assignments media
UPLOAD_DIR = "uploads/assignments"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/{course_id}", response_model=list[AssignmentResponse])
def get_assignments(course_id: int, db: Session = Depends(get_db)):
    return db.query(Assignment).filter(Assignment.course_id == course_id).all()

@router.post("/{course_id}", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    course_id: int,
    title: str = Form(...),
    description: str = Form(""),
    due_date: str = Form(...),
    max_points: int = Form(100),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    media_path = None
    if file:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        media_path = file_path

    new_assignment = Assignment(
        course_id=course_id,
        title=title,
        description=description,
        due_date=due_date,
        max_points=max_points,
        media_path=media_path
    )
    
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    
    # Auto Announcement
    now_str = datetime.now().strftime("%I:%M %p, %b %d")
    an = Announcement(course_id=course_id, title=f"New Assignment: {title}", body=f"Assignment '{title}' has been scheduled for {due_date.replace('T', ' at ')}.", time=now_str, pinned=False)
    db.add(an)
    db.commit()
    
    return new_assignment

@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: int,
    title: str = Form(None),
    description: str = Form(None),
    due_date: str = Form(None),
    max_points: int = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if title is not None: assignment.title = title
    if description is not None: assignment.description = description
    if due_date is not None: assignment.due_date = due_date
    if max_points is not None: assignment.max_points = max_points
    if file:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        assignment.media_path = file_path
        
    now_str = datetime.now().strftime("%I:%M %p, %b %d")
    an = Announcement(course_id=assignment.course_id, title=f"Assignment Updated: {assignment.title}", body=f"Details or attachments for assignment '{assignment.title}' have been modified.", time=now_str, pinned=False)
    db.add(an)
    
    db.commit()
    db.refresh(assignment)
    return assignment

@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    now_str = datetime.now().strftime("%I:%M %p, %b %d")
    an = Announcement(course_id=assignment.course_id, title=f"Assignment Cancelled", body=f"Assignment '{assignment.title}' has been removed.", time=now_str, pinned=False)
    db.add(an)
    
    db.delete(assignment)
    db.commit()
    return None
