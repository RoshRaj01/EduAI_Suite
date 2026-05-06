from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.database import SessionLocal
from app.models.student import Student
from app.models.course import Course
from app.models.mail import MailDraft, MailHistory
from app.utils.email_utils import send_email
from pydantic import BaseModel
from typing import List, Optional, Any
import pandas as pd
import io

router = APIRouter(prefix="/mail", tags=["Mailing"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class Condition(BaseModel):
    field: str
    operator: str
    value: Any

class FilterRequest(BaseModel):
    conditions: List[Condition]

class DraftCreate(BaseModel):
    subject: str
    body: str
    student_ids: Optional[List[int]] = None
    conditions: Optional[List[dict]] = None

class SendMailRequest(BaseModel):
    student_ids: List[int]
    subject: Optional[str] = None
    body: Optional[str] = None
    draft_ids: Optional[List[int]] = None

@router.post("/upload_students")
async def upload_students(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Only CSV and XLSX files are supported")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
        
    # Normalize headers
    df.columns = df.columns.str.strip().str.lower()
    
    def get_val(row, possible_names, default=""):
        for name in possible_names:
            if name in row.index:
                val = row[name]
                return default if pd.isna(val) else val
        return default

    db.query(Student).delete()
    
    for _, row in df.iterrows():
        course_name = str(get_val(row, ['course', 'program', 'degree', 'course_id'], 'Default Course'))
        if not course_name or course_name.lower() == 'nan':
            course_name = 'Default Course'
            
        course = db.query(Course).filter(Course.name == course_name).first()
        if not course:
            course = Course(name=course_name, code=course_name[:6].upper(), batch="2026", students=0, progress=0)
            db.add(course)
            db.commit()
            db.refresh(course)
            
        try:
            att_val = int(float(get_val(row, ['att', 'attendance', 'attendance (%)', 'attendance%'], 0)))
        except ValueError:
            att_val = 0
            
        try:
            marks_val = int(float(get_val(row, ['marks', 'score', 'average marks', 'avg_score', 'total marks'], 0)))
        except ValueError:
            marks_val = 0

        student = Student(
            registration_number=str(get_val(row, ['reg', 'registration number', 'reg no', 'register number', 'roll no', 'reg_no', 'registration_number'])),
            name=str(get_val(row, ['name', 'student name', 'full name', 'student_name'])),
            email=str(get_val(row, ['email', 'email address', 'email id', 'email_address'])),
            course_id=course.id,
            department=str(get_val(row, ['dept', 'department'])),
            attendance=att_val,
            avg_score=marks_val,
            student_class="2026"
        )
        db.add(student)
        
    db.commit()
    return {"message": "Students uploaded successfully"}

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

@router.get("/drafts")
def get_drafts(db: Session = Depends(get_db)):
    return db.query(MailDraft).order_by(MailDraft.id.desc()).all()

@router.post("/drafts")
def create_draft(req: DraftCreate, db: Session = Depends(get_db)):
    draft = MailDraft(subject=req.subject, body=req.body, student_ids=req.student_ids, conditions=req.conditions)
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft

@router.put("/drafts/{draft_id}")
def update_draft(draft_id: int, req: DraftCreate, db: Session = Depends(get_db)):
    draft = db.query(MailDraft).filter(MailDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    draft.subject = req.subject
    draft.body = req.body
    draft.student_ids = req.student_ids
    draft.conditions = req.conditions
    db.commit()
    db.refresh(draft)
    return draft

@router.delete("/drafts/{draft_id}")
def delete_draft(draft_id: int, db: Session = Depends(get_db)):
    draft = db.query(MailDraft).filter(MailDraft.id == draft_id).first()
    if draft:
        db.delete(draft)
        db.commit()
    return {"message": "Deleted"}

@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(MailHistory).order_by(MailHistory.sent_at.desc()).all()

@router.post("/send")
def send_bulk_mail(req: SendMailRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    students = db.query(Student).filter(Student.id.in_(req.student_ids)).all()
    
    if not students:
        raise HTTPException(status_code=404, detail="No students found for the given IDs")

    mails_to_send = []
    
    if req.draft_ids and len(req.draft_ids) > 0:
        drafts = db.query(MailDraft).filter(MailDraft.id.in_(req.draft_ids)).all()
        for draft in drafts:
            mails_to_send.append({"subject": draft.subject, "body": draft.body})
    elif req.subject and req.body:
        mails_to_send.append({"subject": req.subject, "body": req.body})
    else:
        raise HTTPException(status_code=400, detail="Provide draft_ids or subject/body")

    sent_count = 0
    recipients_data = [{"id": s.id, "name": s.name, "email": s.email} for s in students]

    for mail_item in mails_to_send:
        history = MailHistory(
            subject=mail_item["subject"],
            body=mail_item["body"],
            recipients=recipients_data,
            recipient_count=len(students)
        )
        db.add(history)
        
        for student in students:
            personalized_body = mail_item["body"].replace("{{name}}", student.name) \
                                        .replace("{{reg_num}}", student.registration_number) \
                                        .replace("{{attendance}}", f"{student.attendance}%") \
                                        .replace("{{marks}}", f"{student.avg_score}%")
            
            background_tasks.add_task(send_email, student.email, mail_item["subject"], personalized_body)
            sent_count += 1
            
    db.commit()
    return {"message": f"Queued {sent_count} emails for sending"}
