from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.submission import Submission
from app.schemas.submission import SubmissionResponse
from typing import Optional, List
from app.utils.file_uploads import save_optional_upload
from datetime import datetime
import os

router = APIRouter(prefix="/submissions", tags=["Submissions"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{assignment_id}", response_model=list[SubmissionResponse])
def get_submissions(assignment_id: int, db: Session = Depends(get_db)):
    return db.query(Submission).filter(Submission.assignment_id == assignment_id).all()

@router.get("/assignment/{assignment_id}", response_model=list[SubmissionResponse])
def get_submissions_by_assignment(assignment_id: int, db: Session = Depends(get_db)):
    return db.query(Submission).filter(Submission.assignment_id == assignment_id).all()

@router.post("/{assignment_id}", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    assignment_id: int,
    student_name: str = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    paths = []
    for file in files:
        path = save_optional_upload(file, "submissions")
        if path:
            paths.append(path)
    
    media_path = ",".join(paths)
    now_str = datetime.now().strftime("%I:%M %p, %b %d")

    new_sub = Submission(
        assignment_id=assignment_id,
        student_name=student_name,
        file_path=media_path,
        submitted_at=now_str
    )
    
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    
    return new_sub

@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission(submission_id: int, db: Session = Depends(get_db)):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Optional: Delete files from disk
    if sub.file_path:
        paths = sub.file_path.split(",")
        for p in paths:
             # Logic to remove file if desired, for now just DB delete
             pass

    db.delete(sub)
    db.commit()
    return None

@router.delete("/assignment/{assignment_id}/student/{student_name}", status_code=status.HTTP_204_NO_CONTENT)
def unsubmit_assignment(assignment_id: int, student_name: str, db: Session = Depends(get_db)):
    subs = db.query(Submission).filter(
        Submission.assignment_id == assignment_id,
        Submission.student_name == student_name
    ).all()
    for sub in subs:
        db.delete(sub)
    db.commit()
    return None

@router.put("/grade/{submission_id}", response_model=SubmissionResponse)
def grade_submission(submission_id: int, grade: float = Form(...), db: Session = Depends(get_db)):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    sub.grade = grade
    db.commit()
    db.refresh(sub)
    return sub
