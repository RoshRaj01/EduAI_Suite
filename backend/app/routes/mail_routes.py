from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.database import SessionLocal
from app.models.student import Student
from app.utils.email_utils import send_email
from pydantic import BaseModel
from typing import List, Optional, Any

router = APIRouter(prefix="/mail", tags=["Mailing"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class MailRequest(BaseModel):
    student_ids: List[int]
    subject: str
    body: str

class Condition(BaseModel):
    field: str
    operator: str
    value: Any

class FilterRequest(BaseModel):
    conditions: List[Condition]

@router.post("/filter")
def filter_students(req: FilterRequest, db: Session = Depends(get_db)):
    query = db.query(Student)
    
    for cond in req.conditions:
        field = getattr(Student, cond.field, None)
        if field is None:
            continue
            
        op = cond.operator
        val = cond.value
        
        if op == "==":
            query = query.filter(field == val)
        elif op == "!=":
            query = query.filter(field != val)
        elif op == ">":
            query = query.filter(field > val)
        elif op == "<":
            query = query.filter(field < val)
        elif op == ">=":
            query = query.filter(field >= val)
        elif op == "<=":
            query = query.filter(field <= val)
        elif op == "contains":
            query = query.filter(field.ilike(f"%{val}%"))
            
    return query.all()

@router.post("/send")
def send_bulk_mail(req: MailRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    students = db.query(Student).filter(Student.id.in_(req.student_ids)).all()
    
    if not students:
        raise HTTPException(status_code=404, detail="No students found for the given IDs")

    sent_count = 0
    for student in students:
        # Personalize body
        personalized_body = req.body.replace("{{name}}", student.name) \
                                    .replace("{{reg_num}}", student.registration_number) \
                                    .replace("{{attendance}}", f"{student.attendance}%") \
                                    .replace("{{marks}}", f"{student.avg_score}%")
        
        # Add to background tasks to avoid blocking
        background_tasks.add_task(send_email, student.email, req.subject, personalized_body)
        sent_count += 1
        
    return {"message": f"Queued {sent_count} emails for sending"}
