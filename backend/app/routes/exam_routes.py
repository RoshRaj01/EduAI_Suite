from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import SessionLocal
from app.models.exam import Exam, ExamQuestion, ExamChoice, ExamAttempt, ExamAnswer
from app.schemas.exam import ExamCreate, ExamResponse, ExamAttemptCreate, ExamAttemptResponse, ExamAttemptSubmit, ExamAttemptDetailResponse, ExamReviewResponse
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

@router.get("/stats")
def get_exam_stats(db: Session = Depends(get_db)):
    total_exams = db.query(Exam).count()
    
    # Submissions today
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    submissions_today = db.query(ExamAttempt).filter(
        ExamAttempt.status == "submitted",
        ExamAttempt.end_time >= today
    ).count()
    
    # Simple average completion (this is a heuristic)
    total_attempts = db.query(ExamAttempt).filter(ExamAttempt.status == "submitted").count()
    avg_completion = f"{min(100, (total_attempts / (total_exams * 10 or 1)) * 100):.1f}%" if total_exams > 0 else "0%"
    
    return {
        "total_exams": total_exams,
        "submissions_today": submissions_today,
        "avg_completion": avg_completion,
        "pending_ai_review": 0 # Placeholder for now
    }

@router.get("/", response_model=List[ExamResponse])
def get_all_exams(db: Session = Depends(get_db)):
    return db.query(Exam).all()

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
        db.flush() # Ensures the question ID is generated for the choices

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
    
    # Check for existing in-progress attempt to allow resuming
    existing_attempt = db.query(ExamAttempt).filter(
        ExamAttempt.exam_id == exam_id,
        ExamAttempt.student_id == current_user.id,
        ExamAttempt.status == "in_progress"
    ).first()
    
    if existing_attempt:
        return existing_attempt
    
    # Check completed attempts
    completed_attempts = db.query(ExamAttempt).filter(
        ExamAttempt.exam_id == exam_id, 
        ExamAttempt.student_id == current_user.id,
        ExamAttempt.status != "in_progress"
    ).count()
    
    if completed_attempts >= exam.attempts_allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Maximum attempts reached")

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
                if question:
                    total_score += (question.points or 0.0)

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
        text_parts = []
        for para in doc.paragraphs:
            text_parts.append(para.text)
        for table in doc.tables:
            for row in table.rows:
                row_text = "  ".join([cell.text.strip() for cell in row.cells])
                text_parts.append(row_text)
        text = "\n".join(text_parts)
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")

    # Advanced MCQ Extraction Logic
    has_explicit_q = bool(re.search(r'(?:^|\n)\s*(?:Q|Question)\s*\d+', text, re.IGNORECASE))
    if has_explicit_q:
        q_pattern = r'(?:^|\n)\s*(?:Q(?:uestion)?\s*\d+[\.\)\:\-]?)\s*'
    else:
        q_pattern = r'(?:^|\n)\s*(?:Q(?:uestion)?\s*\d+[\.\)\:\-]?|\d+[\.\)\:\-])\s*'

    q_blocks = re.split(q_pattern, text, flags=re.IGNORECASE)
    
    questions = []
    for block in q_blocks:
        if not block.strip(): continue
        
        # Extract correct answer if present in the block
        correct_answer = ""
        ans_match = re.search(r'(?:^|\n|\s)(?:Answer|Ans)[^\w]*([A-Ea-e])', block, re.IGNORECASE)
        if ans_match:
            correct_answer = ans_match.group(1).upper()
            block = block[:ans_match.start()] + block[ans_match.end():]
        
        # Try to find where options start
        label_pattern_str = r'(?:^|\n|\s)(?:\()?([A-Ea-e])(?:(?:\)|\.)\s+|(?:\)|\.)?\s*\n)'
        opt_start_match = re.search(label_pattern_str, block, re.IGNORECASE)
        
        options = []
        if opt_start_match:
            q_text = block[:opt_start_match.start()].strip()
            options_text = block[opt_start_match.start():]
            
            label_pattern = re.compile(label_pattern_str, re.IGNORECASE)
            labels = list(label_pattern.finditer(options_text))
            
            for i, match in enumerate(labels):
                label = match.group(1).upper()
                start_idx = match.end()
                if i + 1 < len(labels):
                    end_idx = labels[i+1].start()
                else:
                    end_idx = len(options_text)
                    
                opt_text = options_text[start_idx:end_idx].strip()
                options.append({"label": label, "text": opt_text})
        else:
            q_text = block.strip()
            
        if q_text and options:
            questions.append({
                "question_text": q_text.replace('\n', '\n').strip(),
                "choices": [
                    {"choice_text": o["text"].replace('\n', ' ').strip(), "is_correct": (o["label"] == correct_answer)}
                    for o in options
                ]
            })

    return questions

@router.post("/extract-answers")
async def extract_exam_answers(file: UploadFile = File(...)):
    contents = await file.read()
    text = ""
    
    if file.filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(io.BytesIO(contents))
        for page in reader.pages:
            text += page.extract_text() + "\n"
    elif file.filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(contents))
        text_parts = []
        for para in doc.paragraphs:
            text_parts.append(para.text)
        for table in doc.tables:
            for row in table.rows:
                row_text = "  ".join([cell.text.strip() for cell in row.cells])
                text_parts.append(row_text)
        text = "\n".join(text_parts)
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")

    answers = {}
    pattern = re.compile(r'(?:^|\n|\s)(?:Q|Question\s*)?(\d+)\s*[\.\-\:\)]?\s*(?:\()?([A-Ea-e])(?:\)|\.)?(?=\s|$|\n)', re.IGNORECASE)
    matches = pattern.findall(text)
    for q_num, ans in matches:
        answers[str(int(q_num))] = ans.upper()
    
    return answers

@router.delete("/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Cascade delete is usually handled by models, but we'll be explicit if needed
    # ExamAttempt and related answers will be orphaned or deleted based on FK config.
    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted successfully"}

@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam(exam_id: int, exam_data: ExamCreate, db: Session = Depends(get_db)):
    db_exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Update main fields
    db_exam.title = exam_data.title
    db_exam.description = exam_data.description
    db_exam.time_limit = exam_data.time_limit
    db_exam.attempts_allowed = exam_data.attempts_allowed
    db_exam.randomize_questions = exam_data.randomize_questions
    db_exam.status = exam_data.status
    db_exam.course_id = exam_data.course_id
    
    # Clear existing questions (cascade="all, delete-orphan" handles the record deletion)
    db_exam.questions = []

    # Re-add new ones
    for i, q_data in enumerate(exam_data.questions):
        new_question = ExamQuestion(
            exam_id=db_exam.id,
            question_text=q_data.question_text,
            question_type=q_data.question_type,
            points=q_data.points,
            order=q_data.order or i
        )
        db_exam.questions.append(new_question)
        db.flush()

        for choice_data in q_data.choices:
            new_choice = ExamChoice(
                question_id=new_question.id,
                choice_text=choice_data.choice_text,
                is_correct=choice_data.is_correct
            )
            db.add(new_choice)
    
    db.commit()
    db.refresh(db_exam)
    return db_exam

@router.get("/{exam_id}/attempts", response_model=List[ExamAttemptResponse])
def get_exam_attempts(exam_id: int, db: Session = Depends(get_db)):
    attempts = db.query(ExamAttempt).filter(ExamAttempt.exam_id == exam_id).all()
    
    # Manually populate student info for the response
    res = []
    for a in attempts:
        res.append({
            "id": a.id,
            "exam_id": a.exam_id,
            "student_id": a.student_id,
            "student_name": a.student.name if a.student else "Unknown",
            "student_email": a.student.email if a.student else "Unknown",
            "score": a.score,
            "status": a.status,
            "start_time": a.start_time,
            "end_time": a.end_time
        })
    return res

@router.get("/attempts/{attempt_id}", response_model=ExamAttemptDetailResponse)
def get_attempt_details(attempt_id: int, db: Session = Depends(get_db)):
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # We need to manually match the student info like in the list view if needed, 
    # but ExamAttemptDetailResponse inherits from ExamAttemptResponse which has these fields.
    # sqlalchemy objects can handle nested relationships if they are defined.
    
    # Ensuring student info is in the top level if needed by the schema
    attempt.student_name = attempt.student.name if attempt.student else "Unknown"
    attempt.student_email = attempt.student.email if attempt.student else "Unknown"
    
    return attempt
