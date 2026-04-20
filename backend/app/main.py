from fastapi import FastAPI
from app.database import Base, engine
from app.models.user import User
from app.routes import auth_routes, course_routes, announcement_routes, resource_routes, student_routes, assignment_routes, submission_routes, appointment_routes, exam_routes
from app.models.exam import Exam # Ensure models are loaded for DDL
from app.models.game import ChainAnswerGame, ChainAnswerGamePlayer, ChainAnswerGameWord
from app.routes import auth_routes, course_routes, announcement_routes, resource_routes, student_routes, assignment_routes, submission_routes, appointment_routes, game_routes, websocket_routes
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
import os

Base.metadata.create_all(bind=engine)

uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(uploads_dir, exist_ok=True)

with engine.begin() as connection:
    inspector = inspect(connection)
    announcement_columns = {column["name"] for column in inspector.get_columns("announcements")}
    if "attachment_path" not in announcement_columns:
        connection.execute(text("ALTER TABLE announcements ADD COLUMN attachment_path VARCHAR"))

    course_columns = {column["name"] for column in inspector.get_columns("courses")}
    if "teacher_name" not in course_columns:
        connection.execute(text("ALTER TABLE courses ADD COLUMN teacher_name VARCHAR"))
    if "course_plan_path" not in course_columns:
        connection.execute(text("ALTER TABLE courses ADD COLUMN course_plan_path VARCHAR"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

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
