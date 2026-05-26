from fastapi import APIRouter, HTTPException, status
from app.models.quiz import Quiz, QuizQuestion, QuizOption, QuizSession
from pydantic import BaseModel
from typing import List, Optional
import random
import string

quiz_router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

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
async def get_quizzes():
    quizzes = await Quiz.find_all().to_list()
    return [
        {
            "id": q.int_id,
            "title": q.title,
            "description": q.description,
            "is_draft": q.is_draft,
            "question_count": len(q.questions),
            "created_at": q.created_at
        }
        for q in quizzes
    ]

@quiz_router.post("/")
async def create_quiz(quiz_data: QuizCreate):
    new_quiz = Quiz(
        title=quiz_data.title,
        description=quiz_data.description,
        is_draft=quiz_data.is_draft
    )
    await new_quiz.assign_id()
    
    question_id_counter = 1
    option_id_counter = 1
    
    for i, q in enumerate(quiz_data.questions):
        question = QuizQuestion(
            int_id=question_id_counter,
            question_text=q.question_text,
            question_type=q.question_type,
            time_limit=q.time_limit,
            points=q.points,
            image_url=q.image_url,
            order=i
        )
        question_id_counter += 1
        
        for opt in q.options:
            option = QuizOption(
                int_id=option_id_counter,
                option_text=opt.option_text,
                is_correct=opt.is_correct,
                color=opt.color
            )
            option_id_counter += 1
            question.options.append(option)
            
        new_quiz.questions.append(question)
    
    await new_quiz.insert()
    return {"id": new_quiz.int_id, "title": new_quiz.title, "is_draft": new_quiz.is_draft}

@quiz_router.put("/{quiz_id}")
async def update_quiz(quiz_id: int, quiz_data: QuizCreate):
    quiz = await Quiz.find_one(Quiz.int_id == quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    quiz.title = quiz_data.title
    quiz.description = quiz_data.description
    quiz.is_draft = quiz_data.is_draft
    
    quiz.questions = []
    question_id_counter = 1
    option_id_counter = 1
    
    for i, q in enumerate(quiz_data.questions):
        question = QuizQuestion(
            int_id=question_id_counter,
            question_text=q.question_text,
            question_type=q.question_type,
            time_limit=q.time_limit,
            points=q.points,
            image_url=q.image_url,
            order=i
        )
        question_id_counter += 1
        
        for opt in q.options:
            option = QuizOption(
                int_id=option_id_counter,
                option_text=opt.option_text,
                is_correct=opt.is_correct,
                color=opt.color
            )
            option_id_counter += 1
            question.options.append(option)
            
        quiz.questions.append(question)
            
    await quiz.save()
    return {"id": quiz.int_id, "title": quiz.title, "is_draft": quiz.is_draft}

@quiz_router.get("/{quiz_id}")
async def get_quiz(quiz_id: int):
    quiz = await Quiz.find_one(Quiz.int_id == quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    result = {
        "id": quiz.int_id,
        "title": quiz.title,
        "description": quiz.description,
        "is_draft": quiz.is_draft,
        "questions": []
    }
    
    for q in quiz.questions:
        question_data = {
            "id": q.int_id,
            "text": q.question_text,
            "type": q.question_type,
            "time_limit": q.time_limit,
            "points": q.points,
            "image_url": q.image_url,
            "options": [{"id": o.int_id, "text": o.option_text, "is_correct": o.is_correct, "color": o.color} for o in q.options]
        }
        result["questions"].append(question_data)
        
    return result

@quiz_router.post("/{quiz_id}/session")
async def create_session(quiz_id: int):
    quiz = await Quiz.find_one(Quiz.int_id == quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Generate unique 6-digit PIN
    pin = "".join(random.choices(string.digits, k=6))
    while await QuizSession.find_one(QuizSession.pin == pin):
        pin = "".join(random.choices(string.digits, k=6))
        
    session = QuizSession(
        quiz_id=quiz_id,
        pin=pin,
        status="lobby"
    )
    await session.assign_id()
    await session.insert()
    
    res = session.model_dump()
    res["id"] = session.int_id
    return res

@quiz_router.get("/sessions")
async def get_all_sessions():
    sessions = await QuizSession.find_all().sort("-int_id").to_list()
    
    result = []
    for session in sessions:
        quiz = await Quiz.find_one(Quiz.int_id == session.quiz_id)
        result.append({
            "id": session.int_id,
            "quiz_title": quiz.title if quiz else "Unknown Quiz",
            "status": session.status,
            "pin": session.pin,
            "current_question": session.current_question_index
        })
    return result

@quiz_router.get("/sessions/{pin}")
async def get_session(pin: str):
    session = await QuizSession.find_one(QuizSession.pin == pin)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    quiz = await Quiz.find_one(Quiz.int_id == session.quiz_id)
    
    return {
        "id": session.int_id,
        "quiz_title": quiz.title if quiz else "Unknown Quiz",
        "status": session.status,
        "pin": session.pin,
        "current_question": session.current_question_index
    }


@quiz_router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(quiz_id: int):
    quiz = await Quiz.find_one(Quiz.int_id == quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    await QuizSession.find(QuizSession.quiz_id == quiz_id).delete()
    await quiz.delete()
    return None

@quiz_router.delete("/sessions/{pin}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(pin: str):
    session = await QuizSession.find_one(QuizSession.pin == pin)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    await session.delete()
    return None
