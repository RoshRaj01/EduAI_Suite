from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.exam import Exam, ExamQuestion, QuestionOption, ExamAttempt, ExamResponse
from app.schemas.exam import ExamCreate, ExamResponse as ExamSchema, ExamSimpleResponse, ExamAttemptCreate, ExamAttemptSubmit, ExamAttemptResponse
from app.utils.exam_parser import extract_text_from_file, parse_mcqs_from_text
from app.utils.auth import get_current_user
from app.models.user import User
from datetime import datetime

router = APIRouter(prefix="/exams", tags=["Exams"])

@router.post("/", response_model=ExamSchema)
def create_exam(exam_data: ExamCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # In a real app, check if current_user is a teacher of the course
    new_exam = Exam(
        course_id=exam_data.course_id,
        title=exam_data.title,
        description=exam_data.description,
        time_limit=exam_data.time_limit,
        max_attempts=exam_data.max_attempts,
        randomize_questions=exam_data.randomize_questions
    )
    db.add(new_exam)
    db.flush() # Get exam ID

    for q in exam_data.questions:
        new_q = ExamQuestion(exam_id=new_exam.id, question_text=q.question_text, points=q.points)
        db.add(new_q)
        db.flush() # Get question ID
        for opt in q.options:
            db.add(QuestionOption(question_id=new_q.id, option_text=opt.option_text, is_correct=opt.is_correct))
    
    db.commit()
    db.refresh(new_exam)
    return new_exam

@router.get("/course/{course_id}", response_model=List[ExamSimpleResponse])
def get_course_exams(course_id: int, db: Session = Depends(get_db)):
    return db.query(Exam).filter(Exam.course_id == course_id).all()

@router.get("/{exam_id}", response_model=ExamSchema)
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.post("/extract-questions")
async def extract_questions(file: UploadFile = File(...)):
    contents = await file.read()
    text = extract_text_from_file(contents, file.filename)
    questions = parse_mcqs_from_text(text)
    return {"questions": questions}

@router.post("/attempts", response_model=ExamAttemptResponse)
def start_exam_attempt(attempt_data: ExamAttemptCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if student has already reached max attempts
    exam = db.query(Exam).filter(Exam.id == attempt_data.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    attempts_count = db.query(ExamAttempt).filter(
        ExamAttempt.exam_id == exam.id, 
        ExamAttempt.student_id == current_user.id
    ).count()
    
    if attempts_count >= exam.max_attempts:
        raise HTTPException(status_code=400, detail="Maximum attempts reached")
    
    new_attempt = ExamAttempt(
        exam_id=exam.id,
        student_id=current_user.id,
        status="ongoing",
        started_at=datetime.utcnow()
    )
    db.add(new_attempt)
    db.commit()
    db.refresh(new_attempt)
    return new_attempt

@router.post("/attempts/{attempt_id}/submit", response_model=ExamAttemptResponse)
def submit_exam_attempt(attempt_id: int, submission: ExamAttemptSubmit, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id, ExamAttempt.student_id == current_user.id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.status == "completed":
        raise HTTPException(status_code=400, detail="Attempt already submitted")

    # Evaluate score
    total_score = 0
    for resp in submission.responses:
        # Save response
        db_resp = ExamResponse(
            attempt_id=attempt.id,
            question_id=resp.question_id,
            selected_option_id=resp.selected_option_id
        )
        db.add(db_resp)
        
        # Check if correct
        option = db.query(QuestionOption).filter(QuestionOption.id == resp.selected_option_id).first()
        if option and option.is_correct:
            question = db.query(ExamQuestion).filter(ExamQuestion.id == resp.question_id).first()
            total_score += question.points if question else 0

    attempt.score = total_score
    attempt.status = "completed"
    attempt.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(attempt)
    return attempt
