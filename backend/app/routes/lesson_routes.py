from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.user import User
from app.schemas.lesson import (
    LessonCreateRequest,
    LessonUpdateRequest,
    LessonPostRequest,
    LessonResponse,
    LessonListResponse,
    LessonGenerateRequest
)
from app.services.groq_service import GroqService
from app.utils.auth import get_password_hash
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lessons", tags=["Lessons"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def resolve_course_id(db: Session, requested_course_id: int) -> int:
    course = db.query(Course).filter(Course.id == requested_course_id).first()
    if course:
        return course.id

    fallback_course = db.query(Course).order_by(Course.id.asc()).first()
    if fallback_course:
        logger.warning(
            "Requested course_id %s not found; falling back to course_id %s",
            requested_course_id,
            fallback_course.id,
        )
        return fallback_course.id

    raise HTTPException(status_code=400, detail="No courses available to attach lesson")


def resolve_creator_id(db: Session) -> int:
    teacher = (
        db.query(User)
        .filter(User.role == "teacher")
        .order_by(User.id.asc())
        .first()
    )
    if teacher:
        return teacher.id

    existing_user = db.query(User).order_by(User.id.asc()).first()
    if existing_user:
        return existing_user.id

    placeholder = User(
        name="EduAI Teacher",
        email="lesson.teacher@eduai.local",
        hashed_password=get_password_hash("EduAI123"),
        role="teacher",
        department="Computer Science",
    )
    db.add(placeholder)
    db.flush()
    logger.warning("Created placeholder teacher user for lesson ownership")
    return placeholder.id


@router.post("/generate", response_model=dict)
def generate_lesson(request: LessonGenerateRequest, db: Session = Depends(get_db)):
    """Generate a lesson plan using Groq AI based on topic and optional syllabus context."""
    try:
        result = GroqService.generate_lesson_plan(
            topic=request.topic,
            syllabus_context=request.syllabus_context
        )
        return result
    except Exception as e:
        logger.error(f"Error generating lesson: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=LessonResponse)
def create_lesson(request: LessonCreateRequest, db: Session = Depends(get_db)):
    """Create a new lesson (draft)."""
    try:
        resolved_course_id = resolve_course_id(db, request.course_id)
        creator_id = resolve_creator_id(db)

        lesson = Lesson(
            course_id=resolved_course_id,
            title=request.title,
            topic=request.topic,
            syllabus_context=request.syllabus_context,
            lecture_flow=request.lecture_flow,
            examples=request.examples,
            activities=request.activities,
            quiz_questions=request.quiz_questions,
            created_by=creator_id,
            posted_at=None
        )
        db.add(lesson)
        db.commit()
        db.refresh(lesson)
        return lesson
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating lesson: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=list[LessonListResponse])
def get_lessons(
    course_id: int = Query(None),
    posted_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get lessons, optionally filtered by course and posted status."""
    try:
        query = db.query(Lesson)

        if course_id:
            query = query.filter(Lesson.course_id == course_id)

        if posted_only:
            query = query.filter(Lesson.posted_at.isnot(None))

        lessons = query.order_by(Lesson.created_at.desc()).all()
        return lessons
    except Exception as e:
        logger.error(f"Error fetching lessons: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    """Get a specific lesson by ID."""
    try:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        return lesson
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching lesson: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    lesson_id: int,
    request: LessonUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update an existing lesson."""
    try:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        # Only update posted_at if lesson hasn't been posted
        if lesson.posted_at:
            raise HTTPException(
                status_code=400, detail="Cannot update a posted lesson")

        # Update fields
        if request.title is not None:
            lesson.title = request.title
        if request.topic is not None:
            lesson.topic = request.topic
        if request.syllabus_context is not None:
            lesson.syllabus_context = request.syllabus_context
        if request.lecture_flow is not None:
            lesson.lecture_flow = request.lecture_flow
        if request.examples is not None:
            lesson.examples = request.examples
        if request.activities is not None:
            lesson.activities = request.activities
        if request.quiz_questions is not None:
            lesson.quiz_questions = request.quiz_questions

        lesson.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(lesson)
        return lesson
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating lesson: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{lesson_id}/post", response_model=LessonResponse)
def post_lesson(
    lesson_id: int,
    request: LessonPostRequest,
    db: Session = Depends(get_db)
):
    """Post a lesson to students (publish)."""
    try:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        if lesson.posted_at:
            raise HTTPException(
                status_code=400, detail="Lesson already posted")

        lesson.posted_at = datetime.utcnow()
        db.commit()
        db.refresh(lesson)
        logger.info(f"Lesson {lesson_id} posted to course {lesson.course_id}")
        return lesson
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error posting lesson: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{lesson_id}")
def delete_lesson(lesson_id: int, db: Session = Depends(get_db)):
    """Delete a lesson."""
    try:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        if lesson.posted_at:
            raise HTTPException(
                status_code=400, detail="Cannot delete a posted lesson")

        db.delete(lesson)
        db.commit()
        logger.info(f"Lesson {lesson_id} deleted")
        return {"message": "Lesson deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting lesson: {e}")
        raise HTTPException(status_code=500, detail=str(e))
