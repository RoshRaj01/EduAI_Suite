from dotenv import load_dotenv
from app.services.groq_service import GroqService
from app.routes import auth_routes, course_routes, announcement_routes, resource_routes, student_routes, assignment_routes, submission_routes, appointment_routes, exam_routes, game_routes, websocket_routes, lesson_routes, engagement_routes, analytics_routes, calendar_routes, mail_routes, quiz_routes, omr_routes, wordcloud_routes, report_routes, slido_routes, history_routes, dashboard_routes
from fastapi import FastAPI
from app.database import Base, engine
from app.models.user import User
from app.models.game import ChainAnswerGame, ChainAnswerGamePlayer, ChainAnswerGameWord
from app.models.quiz import Quiz, QuizQuestion, QuizOption, QuizSession, QuizPlayer, QuizAnswer
from app.models.lesson import Lesson
from app.models.omr import OMRJob, OMRSubmission
from app.models.report import Report
from app.models.slido import PresentationAssignment, PresentationSubmission, SlidoSession, SlidoPoll, PollResponse, SlidoQnA, QnAUpvote, SubmissionInteraction
from app.models.mail import MailDraft, MailHistory
from app.routes.calendar_routes import CalendarEvent
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
import os

# Load environment variables FIRST
load_dotenv()

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

    try:
        report_columns = {column["name"]
                          for column in inspector.get_columns("reports")}
        if "target_id" not in report_columns:
            connection.execute(
                text("ALTER TABLE reports ADD COLUMN target_id INTEGER"))
    except Exception as e:
        print(f"Note: reports migration skipped: {e}")

    # Presentation Submissions auto-migration: add status column
    try:
        submission_columns = {column["name"]
                              for column in inspector.get_columns("presentation_submissions")}
        if "status" not in submission_columns:
            connection.execute(
                text("ALTER TABLE presentation_submissions ADD COLUMN status VARCHAR DEFAULT 'submitted'"))
    except Exception as e:
        print(f"Note: presentation_submissions migration skipped: {e}")

    try:
        draft_columns = {column["name"] for column in inspector.get_columns("mail_drafts")}
        if "student_ids" not in draft_columns:
            connection.execute(text("ALTER TABLE mail_drafts ADD COLUMN student_ids JSON"))
        if "conditions" not in draft_columns:
            connection.execute(text("ALTER TABLE mail_drafts ADD COLUMN conditions JSON"))
    except Exception as e:
        print(f"Note: mail_drafts migration skipped: {e}")

    try:
        appointment_columns = {column["name"] for column in inspector.get_columns("appointments")}
        if "agenda" not in appointment_columns:
            connection.execute(text("ALTER TABLE appointments ADD COLUMN agenda VARCHAR"))
            # Transfer existing data from topic to agenda
            connection.execute(text("UPDATE appointments SET agenda = topic WHERE agenda IS NULL"))
        if "details" not in appointment_columns:
            connection.execute(text("ALTER TABLE appointments ADD COLUMN details VARCHAR"))
            connection.execute(text("UPDATE appointments SET details = '' WHERE details IS NULL"))
        if "rejection_reason" not in appointment_columns:
            connection.execute(text("ALTER TABLE appointments ADD COLUMN rejection_reason VARCHAR"))
    except Exception as e:
        print(f"Note: appointments migration skipped: {e}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Mount local_uploads for offline storage mode (when MinIO is unavailable)
local_uploads_dir = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "local_uploads"))
os.makedirs(local_uploads_dir, exist_ok=True)
app.mount("/local_uploads", StaticFiles(directory=local_uploads_dir), name="local_uploads")

# Initialize Groq service on startup
GroqService.initialize()


app.include_router(auth_routes.auth_router)
app.include_router(course_routes.course_router)
app.include_router(announcement_routes.announcement_router)
app.include_router(resource_routes.resource_router)
app.include_router(student_routes.student_router)
app.include_router(assignment_routes.assignment_router)
app.include_router(submission_routes.submission_router)
app.include_router(appointment_routes.appointment_router)
app.include_router(exam_routes.exam_router)
app.include_router(game_routes.game_router)
app.include_router(lesson_routes.lesson_router)
app.include_router(engagement_routes.engagement_router)
app.include_router(analytics_routes.analytics_router)
app.include_router(calendar_routes.calendar_router)
app.include_router(mail_routes.mail_router)
app.include_router(quiz_routes.quiz_router)
app.include_router(omr_routes.omr_router)
app.include_router(wordcloud_routes.wordcloud_router)
app.include_router(report_routes.report_router)
app.include_router(slido_routes.slido_router)
app.include_router(history_routes.history_router)
app.include_router(dashboard_routes.dashboard_router)
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
