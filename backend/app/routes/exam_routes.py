from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import SessionLocal
from app.models.exam import Exam, ExamQuestion, ExamChoice, ExamAttempt, ExamAnswer
from app.schemas.exam import ExamCreate, ExamResponse, ExamAttemptCreate, ExamAttemptResponse, ExamAttemptSubmit
from app.utils.auth import get_current_user
from app.models.user import User
import PyPDF2
import docx
import io
import re
import random
from datetime import datetime

router = APIRouter(prefix="/exams", tags=["Exams"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ExamResponse)
def create_exam(exam_data: ExamCreate, db: Session = Depends(get_db)):
    new_exam = Exam(
        course_id=exam_data.course_id,
        title=exam_data.title,
        description=exam_data.description,
        time_limit=exam_data.time_limit,
        attempts_allowed=exam_data.attempts_allowed,
        randomize_questions=exam_data.randomize_questions,
        status=exam_data.status
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)

    for i, q_data in enumerate(exam_data.questions):
        new_question = ExamQuestion(
            exam_id=new_exam.id,
            question_text=q_data.question_text,
            question_type=q_data.question_type,
            points=q_data.points,
            order=q_data.order or i
        )
        db.add(new_question)
        db.commit()
        db.refresh(new_question)

        for choice_data in q_data.choices:
            new_choice = ExamChoice(
                question_id=new_question.id,
                choice_text=choice_data.choice_text,
                is_correct=choice_data.is_correct
            )
            db.add(new_choice)
    
    db.commit()
    db.refresh(new_exam)
    return new_exam

@router.get("/course/{course_id}", response_model=List[ExamResponse])
def get_course_exams(course_id: int, db: Session = Depends(get_db)):
    return db.query(Exam).filter(Exam.course_id == course_id).all()

@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.post("/{exam_id}/start", response_model=ExamAttemptResponse)
def start_exam_attempt(exam_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check attempts
    prev_attempts = db.query(ExamAttempt).filter(
        ExamAttempt.exam_id == exam_id, 
        ExamAttempt.student_id == current_user.id
    ).count()
    
    if prev_attempts >= exam.attempts_allowed:
        raise HTTPException(status_code= status.HTTP_403_FORBIDDEN, detail="Maximum attempts reached")

    new_attempt = ExamAttempt(
        exam_id=exam_id,
        student_id=current_user.id,
        status="in_progress"
    )
    db.add(new_attempt)
    db.commit()
    db.refresh(new_attempt)
    return new_attempt

@router.post("/attempts/{attempt_id}/submit", response_model=ExamAttemptResponse)
def submit_exam_attempt(attempt_id: int, submission: ExamAttemptSubmit, db: Session = Depends(get_db)):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.status != "in_progress":
        raise HTTPException(status_code=400, detail="Attempt already submitted or invalid")

    exam = attempt.exam
    total_score = 0.0
    
    for ans in submission.answers:
        new_answer = ExamAnswer(
            attempt_id=attempt_id,
            question_id=ans.question_id,
            selected_choice_id=ans.selected_choice_id
        )
        db.add(new_answer)
        
        # Grading
        if ans.selected_choice_id:
            choice = db.query(ExamChoice).filter(ExamChoice.id == ans.selected_choice_id).first()
            if choice and choice.is_correct:
                question = db.query(ExamQuestion).filter(ExamQuestion.id == ans.question_id).first()
                total_score += question.points

    attempt.score = total_score
    attempt.status = "submitted"
    attempt.end_time = datetime.utcnow()
    db.commit()
    db.refresh(attempt)
    return attempt

@router.post("/extract")
async def extract_exam_questions(file: UploadFile = File(...)):
    contents = await file.read()
    text = ""
    
    if file.filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(io.BytesIO(contents))
        for page in reader.pages:
            text += page.extract_text() + "\n"
    elif file.filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(contents))
        text = "\n".join([para.text for para in doc.paragraphs])
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")

    # Simple MCQ Extraction Logic
    # Looking for Question followed by options A, B, C, D and Answer
    questions = []
    # This is a very basic heuristic parser
    q_blocks = re.split(r'\n\s*\d+[\.\)]\s*', text)
    for block in q_blocks:
        if not block.strip(): continue
        
        lines = block.strip().split('\n')
        q_text = lines[0]
        options = []
        correct_answer = ""
        
        for line in lines[1:]:
            opt_match = re.match(r'^\s*([A-D])[\.\)]\s*(.*)', line, re.IGNORECASE)
            if opt_match:
                options.append({
                    "label": opt_match.group(1).upper(),
                    "text": opt_match.group(2).strip()
                })
            
            ans_match = re.search(r'Answer\s*[:\-]\s*([A-D])', line, re.IGNORECASE)
            if ans_match:
                correct_answer = ans_match.group(1).upper()

        if q_text and options:
            questions.append({
                "question_text": q_text,
                "choices": [
                    {"choice_text": o["text"], "is_correct": (o["label"] == correct_answer)}
                    for o in options
                ]
            })

    return questions
