from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.quiz import Quiz, QuizQuestion, QuizOption, QuizSession
from pydantic import BaseModel
from typing import List, Optional
import random
import string

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Schemas
class OptionSchema(BaseModel):
    option_text: str
    is_correct: bool
    color: Optional[str] = None

class QuestionSchema(BaseModel):
    question_text: str
    question_type: str = "mcq"
    time_limit: int = 20
    points: int = 1000
    image_url: Optional[str] = None
    options: List[OptionSchema]

class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    questions: List[QuestionSchema]

@router.get("/")
def get_quizzes(db: Session = Depends(get_db)):
    return db.query(Quiz).all()

@router.post("/")
def create_quiz(quiz_data: QuizCreate, db: Session = Depends(get_db)):
    new_quiz = Quiz(
        title=quiz_data.title,
        description=quiz_data.description
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)
    
    for i, q in enumerate(quiz_data.questions):
        question = QuizQuestion(
            quiz_id=new_quiz.id,
            question_text=q.question_text,
            question_type=q.question_type,
            time_limit=q.time_limit,
            points=q.points,
            image_url=q.image_url,
            order=i
        )
        db.add(question)
        db.commit()
        db.refresh(question)
        
        for opt in q.options:
            option = QuizOption(
                question_id=question.id,
                option_text=opt.option_text,
                is_correct=opt.is_correct,
                color=opt.color
            )
            db.add(option)
    
    db.commit()
    db.refresh(new_quiz)
    return {"id": new_quiz.id, "title": new_quiz.title}

@router.get("/{quiz_id}")
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Include questions and options
    result = {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "questions": []
    }
    
    for q in quiz.questions:
        question_data = {
            "id": q.id,
            "text": q.question_text,
            "type": q.question_type,
            "time_limit": q.time_limit,
            "points": q.points,
            "options": [{"id": o.id, "text": o.option_text, "is_correct": o.is_correct} for o in q.options]
        }
        result["questions"].append(question_data)
        
    return result

@router.post("/{quiz_id}/session")
def create_session(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Generate unique 6-digit PIN
    pin = "".join(random.choices(string.digits, k=6))
    while db.query(QuizSession).filter(QuizSession.pin == pin).first():
        pin = "".join(random.choices(string.digits, k=6))
        
    session = QuizSession(
        quiz_id=quiz_id,
        pin=pin,
        status="lobby"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session

@router.get("/sessions")
def get_all_sessions(db: Session = Depends(get_db)):
    sessions = db.query(QuizSession).order_by(QuizSession.id.desc()).all()
    return [
        {
            "id": session.id,
            "quiz_title": session.quiz.title if session.quiz else "Unknown Quiz",
            "status": session.status,
            "pin": session.pin,
            "current_question": session.current_question_index
        }
        for session in sessions
    ]

@router.get("/sessions/{pin}")
def get_session(pin: str, db: Session = Depends(get_db)):
    session = db.query(QuizSession).filter(QuizSession.pin == pin).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "id": session.id,
        "quiz_title": session.quiz.title,
        "status": session.status,
        "pin": session.pin,
        "current_question": session.current_question_index
    }


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db.delete(quiz)
    db.commit()
    return None

@router.delete("/sessions/{pin}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(pin: str, db: Session = Depends(get_db)):
    session = db.query(QuizSession).filter(QuizSession.pin == pin).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    return None
