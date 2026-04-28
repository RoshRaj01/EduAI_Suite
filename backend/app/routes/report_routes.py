from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.report import Report
from app.models.student import Student
from app.models.course import Course
from app.models.submission import Submission
from app.models.exam import ExamAttempt, Exam
from app.models.assignment import Assignment
from app.services.groq_service import GroqService
from app.utils.email_utils import send_email
from pydantic import BaseModel
from typing import Optional, List
import uuid
import datetime

router = APIRouter(prefix="/reports", tags=["Reports"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class GenerateReportRequest(BaseModel):
    type: str # 'Class Report', 'Student Report', 'Analytics Export'
    target_id: Optional[int] = None # course_id or student_id depending on type

class SendReportRequest(BaseModel):
    email: str

class ReportResponse(BaseModel):
    id: str
    name: str
    type: str
    date: str
    status: str
    content: Optional[str]

@router.get("", response_model=List[ReportResponse])
def get_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.generated_at.desc()).all()
    result = []
    for r in reports:
        result.append({
            "id": r.report_id,
            "name": r.name,
            "type": r.type,
            "date": r.generated_at.strftime("%b %d, %Y"),
            "status": r.status,
            "content": r.content
        })
    return result

def generate_report_background(report_db_id: int, type: str, target_id: int, db: Session):
    report = db.query(Report).filter(Report.id == report_db_id).first()
    if not report:
        return
    
    try:
        if type == 'Student Report':
            student = db.query(Student).filter(Student.id == target_id).first()
            if not student:
                report.status = "failed"
                report.content = "Student not found"
                db.commit()
                return

            # Get grades
            submissions = db.query(Submission).filter(Submission.student_name == student.name).all()
            attempts = db.query(ExamAttempt).filter(ExamAttempt.student_id == student.id).all()
            
            sub_scores = [s.grade for s in submissions if s.grade is not None]
            exam_scores = [a.score for a in attempts if a.score is not None]
            
            avg_sub = sum(sub_scores)/len(sub_scores) if sub_scores else 0
            avg_exam = sum(exam_scores)/len(exam_scores) if exam_scores else 0
            
            prompt = f"Write a professional, encouraging parent-ready academic report for student '{student.name}'. Their average assignment score is {avg_sub:.1f}% and average exam score is {avg_exam:.1f}%. Highlight strengths and suggest areas for improvement."
            
            message = GroqService._client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=500,
            )
            report.content = message.choices[0].message.content
            report.status = "ready"
            db.commit()

        elif type == 'Class Report':
            course = db.query(Course).filter(Course.id == target_id).first()
            if not course:
                report.status = "failed"
                report.content = "Course not found"
                db.commit()
                return
            
            prompt = f"Write an analytical report for the class '{course.name}'. Mention that the class is generally performing well but there are specific areas where students struggle."
            
            message = GroqService._client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=500,
            )
            report.content = message.choices[0].message.content
            report.status = "ready"
            db.commit()
            
        else:
            report.status = "ready"
            report.content = "Analytics export data generated."
            db.commit()
            
    except Exception as e:
        report.status = "failed"
        report.content = str(e)
        db.commit()

@router.post("/generate")
def generate_report(req: GenerateReportRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    prefix = "RC" if req.type == 'Class Report' else "RS" if req.type == 'Student Report' else "RX"
    report_id = f"{prefix}-{str(uuid.uuid4())[:6].upper()}"
    
    name = f"Generated {req.type}"
    if req.type == 'Student Report':
        student = db.query(Student).filter(Student.id == req.target_id).first()
        if student:
            name = f"Parent-Ready Report: {student.name}"
    elif req.type == 'Class Report':
        course = db.query(Course).filter(Course.id == req.target_id).first()
        if course:
            name = f"Class Report - {course.name}"
            
    new_report = Report(
        report_id=report_id,
        name=name,
        type=req.type,
        status="generating",
        target_id=req.target_id
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    background_tasks.add_task(generate_report_background, new_report.id, req.type, req.target_id, db)
    
    return {"message": "Report generation started", "report_id": report_id}

@router.post("/{report_id}/send")
def send_report(report_id: str, req: SendReportRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if report.status != 'ready':
        raise HTTPException(status_code=400, detail="Report is not ready yet")
        
    student_name = "Student"
    if report.type == 'Student Report' and report.target_id:
        student = db.query(Student).filter(Student.id == report.target_id).first()
        if student:
            student_name = student.name

    subject = f"Academic Report for {student_name}" if report.type == 'Student Report' else f"{report.name}"
    body = f"Hello,\n\nPlease find the attached report:\n\n{report.content}\n\nBest Regards,\nTeacherBuddy"
    
    background_tasks.add_task(send_email, req.email, subject, body)
    return {"message": f"Report sent successfully to {req.email}"}
