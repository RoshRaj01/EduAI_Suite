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

report_router = APIRouter(prefix="/reports", tags=["Reports"])

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

@report_router.get("", response_model=List[ReportResponse])
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

            # Get grades and performance data
            submissions = db.query(Submission).filter(Submission.student_name == student.name).all()
            attempts = db.query(ExamAttempt).filter(ExamAttempt.student_id == student.id).all()
            
            sub_details = []
            for s in submissions:
                assignment = db.query(Assignment).filter(Assignment.id == s.assignment_id).first()
                title = assignment.title if assignment else "Unknown Assignment"
                sub_details.append(f"- {title}: {s.grade}%")

            exam_details = []
            for a in attempts:
                exam = db.query(Exam).filter(Exam.id == a.exam_id).first()
                title = exam.title if exam else "Unknown Exam"
                exam_details.append(f"- {title}: {a.score}%")

            sub_scores = [s.grade for s in submissions if s.grade is not None]
            exam_scores = [a.score for a in attempts if a.score is not None]
            
            avg_sub = sum(sub_scores)/len(sub_scores) if sub_scores else 0
            avg_exam = sum(exam_scores)/len(exam_scores) if exam_scores else 0
            
            prompt = f"""
            Generate a COMPREHENSIVE and PROFESSIONAL academic report for the following student:
            
            STUDENT NAME: {student.name}
            REGISTRATION NUMBER: {student.registration_number}
            DEPARTMENT: {student.department}
            ATTENDANCE: {student.attendance}%
            
            PERFORMANCE SUMMARY:
            - Average Assignment Score: {avg_sub:.1f}%
            - Average Exam Score: {avg_exam:.1f}%
            
            DETAILED ASSIGNMENTS:
            {chr(10).join(sub_details) if sub_details else "No assignments recorded."}
            
            DETAILED EXAMS:
            {chr(10).join(exam_details) if exam_details else "No exams recorded."}
            
            REPORT STRUCTURE:
            1. Introduction: Briefly mention the student's background and general standing.
            2. Academic Performance: Detailed analysis of assignment and exam performance.
            3. Attendance & Engagement: Discuss the student's commitment based on their {student.attendance}% attendance.
            4. Strengths: Identify specific areas where the student is excelling.
            5. Areas for Improvement: Provide constructive feedback on where to focus.
            6. Conclusion & Recommendations: Final word for the parents/student.
            
            Tone: Professional, encouraging, and detailed. Do not use placeholders.
            """
            
            message = GroqService._client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=1500,
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
            
            # Fetch class stats
            students = db.query(Student).filter(Student.course_id == course.id).all()
            total_students = len(students)
            avg_attendance = sum([s.attendance for s in students])/total_students if total_students > 0 else 0
            
            prompt = f"""
            Generate a DETAILED Class-Level Analytical Report for the following course:
            
            COURSE: {course.name}
            TOTAL STUDENTS: {total_students}
            AVERAGE ATTENDANCE: {avg_attendance:.1f}%
            
            REPORT STRUCTURE:
            1. Executive Summary: Overall performance of the batch.
            2. Engagement Analysis: How the attendance and participation looks across the class.
            3. Subjective Analysis: Common areas where the class is excelling and where common misconceptions lie.
            4. Future Roadmap: Recommended teaching strategies for the next month.
            
            Tone: Analytical, administrative, and strategic.
            """
            
            message = GroqService._client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=1500,
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

@report_router.post("/generate")
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

@report_router.post("/{report_id}/send")
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
