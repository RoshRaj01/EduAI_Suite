from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.quiz import Quiz, QuizQuestion, QuizOption, QuizSession
from pydantic import BaseModel
from typing import List, Optional
import random
import string

quiz_router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

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
    is_draft: Optional[bool] = False
    questions: List[QuestionSchema]

@quiz_router.get("/")
def get_quizzes(db: Session = Depends(get_db)):
    quizzes = db.query(Quiz).all()
    return [
        {
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "is_draft": q.is_draft,
            "question_count": len(q.questions),
            "created_at": q.created_at
        }
        for q in quizzes
    ]

@quiz_router.post("/")
def create_quiz(quiz_data: QuizCreate, db: Session = Depends(get_db)):
    new_quiz = Quiz(
        title=quiz_data.title,
        description=quiz_data.description,
        is_draft=quiz_data.is_draft
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
    return {"id": new_quiz.id, "title": new_quiz.title, "is_draft": new_quiz.is_draft}

@quiz_router.put("/{quiz_id}")
def update_quiz(quiz_id: int, quiz_data: QuizCreate, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    quiz.title = quiz_data.title
    quiz.description = quiz_data.description
    quiz.is_draft = quiz_data.is_draft
    
    # Delete old questions and options (cascaded)
    for q in quiz.questions:
        db.delete(q)
    
    # Add new questions
    for i, q in enumerate(quiz_data.questions):
        question = QuizQuestion(
            quiz_id=quiz.id,
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
    db.refresh(quiz)
    return {"id": quiz.id, "title": quiz.title, "is_draft": quiz.is_draft}

@quiz_router.get("/{quiz_id}")
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Include questions and options
    result = {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "is_draft": quiz.is_draft,
        "questions": []
    }
    
    for q in quiz.questions:
        question_data = {
            "id": q.id,
            "text": q.question_text,
            "type": q.question_type,
            "time_limit": q.time_limit,
            "points": q.points,
            "image_url": q.image_url,
            "options": [{"id": o.id, "text": o.option_text, "is_correct": o.is_correct, "color": o.color} for o in q.options]
        }
        result["questions"].append(question_data)
        
    return result

@quiz_router.post("/{quiz_id}/session")
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

@quiz_router.get("/sessions")
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

@quiz_router.get("/sessions/{pin}")
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


@quiz_router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Explicitly delete sessions to ensure all players/answers are cleaned up first
    # This prevents FOREIGN KEY constraint errors in some SQLite environments
    for session in quiz.sessions:
        db.delete(session)
    
    db.delete(quiz)
    db.commit()
    return None

@quiz_router.delete("/sessions/{pin}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(pin: str, db: Session = Depends(get_db)):
    session = db.query(QuizSession).filter(QuizSession.pin == pin).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    return None
