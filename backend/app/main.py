from app.routes import auth_routes, course_routes, announcement_routes, resource_routes, student_routes, assignment_routes, submission_routes, appointment_routes, exam_routes, game_routes, websocket_routes
from fastapi import FastAPI
from app.database import Base, engine
from app.models.user import User
from app.models.game import ChainAnswerGame, ChainAnswerGamePlayer, ChainAnswerGameWord
from app.routes import auth_routes, course_routes, announcement_routes, resource_routes, student_routes, assignment_routes, submission_routes, appointment_routes, exam_routes, game_routes
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
import os

Base.metadata.create_all(bind=engine)

uploads_dir = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "uploads"))
os.makedirs(uploads_dir, exist_ok=True)

with engine.begin() as connection:
    inspector = inspect(connection)
    announcement_columns = {column["name"]
                            for column in inspector.get_columns("announcements")}
    if "attachment_path" not in announcement_columns:
        connection.execute(
            text("ALTER TABLE announcements ADD COLUMN attachment_path VARCHAR"))

    course_columns = {column["name"]
                      for column in inspector.get_columns("courses")}
    if "teacher_name" not in course_columns:
        connection.execute(
            text("ALTER TABLE courses ADD COLUMN teacher_name VARCHAR"))
    if "course_plan_path" not in course_columns:
        connection.execute(
            text("ALTER TABLE courses ADD COLUMN course_plan_path VARCHAR"))

    # Exam tables auto-migrations
    exam_columns = {column["name"]
                    for column in inspector.get_columns("exams")}
    if "attempts_allowed" not in exam_columns:
        connection.execute(
            text("ALTER TABLE exams ADD COLUMN attempts_allowed INTEGER DEFAULT 1"))
    if "status" not in exam_columns:
        connection.execute(
            text("ALTER TABLE exams ADD COLUMN status VARCHAR DEFAULT 'draft'"))

    question_columns = {column["name"]
                        for column in inspector.get_columns("exam_questions")}
    if "question_type" not in question_columns:
        connection.execute(text(
            "ALTER TABLE exam_questions ADD COLUMN question_type VARCHAR DEFAULT 'mcq'"))
    if "order" not in question_columns:
        connection.execute(
            text("ALTER TABLE exam_questions ADD COLUMN \"order\" INTEGER DEFAULT 0"))

    # Chain Answer Games auto-migration
    try:
        chain_answer_columns = {column["name"]
                                for column in inspector.get_columns("chain_answer_games")}
        if "subject" not in chain_answer_columns:
            connection.execute(
                text("ALTER TABLE chain_answer_games ADD COLUMN subject VARCHAR"))
        if "ollama_suggestions" not in chain_answer_columns:
            connection.execute(
                text("ALTER TABLE chain_answer_games ADD COLUMN ollama_suggestions VARCHAR"))
    except Exception as e:
        # Table might not exist yet, SQLAlchemy will create it
        print(f"Note: chain_answer_games migration skipped: {e}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Initialize Groq service on startup
from app.services.groq_service import GroqService
GroqService.initialize()


app.include_router(auth_routes.router)
app.include_router(course_routes.router)
app.include_router(announcement_routes.router)
app.include_router(resource_routes.router)
app.include_router(student_routes.router)
app.include_router(assignment_routes.router)
app.include_router(submission_routes.router)
app.include_router(appointment_routes.router)
app.include_router(exam_routes.router)
app.include_router(game_routes.router)
app.include_router(websocket_routes.ws_router)


@app.get("/")
def root():
    return {"message": "EduAI Backend Running"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "main_api"}


@app.post("/api/auth/login")
def login():
    return {"token": "mock-jwt-token"}


@app.post("/api/ai/evaluate")
def evaluate_answers():
    return {"ai_score": 85.5, "confidence": 0.9}


@app.get("/api/risk/classroom/{classroom_id}")
def get_risk_score(classroom_id: str):
    return {"students_at_risk": 3}
