from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app.models.student import Student
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.exam import Exam, ExamAttempt
from app.models.game import ChainAnswerGame, ChainAnswerGamePlayer, ChainAnswerGameWord
from app.models.course import Course
from app.services.groq_service import GroqService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/engagement", tags=["Engagement"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _compute_engagement_level(score: float) -> str:
    """Return engagement level label based on composite score (0-100)."""
    if score >= 75:
        return "excellent"
    elif score >= 55:
        return "good"
    elif score >= 35:
        return "needs_attention"
    else:
        return "at_risk"


def _generate_ai_summary(student_name: str, engagement_data: dict) -> str:
    """Generate an AI-powered engagement summary using Groq, with heuristic fallback."""

    attendance = engagement_data.get("attendance", 0)
    eng_score = engagement_data.get("engagement_score", 0)
    eng_level = engagement_data.get("engagement_level", "unknown")
    assign = engagement_data.get("assignments", {})
    exams = engagement_data.get("exams", {})
    games = engagement_data.get("games", {})

    context_prompt = (
        f"You are an AI teaching assistant. Write a concise 2-3 sentence engagement summary for a student.\n"
        f"Student: {student_name}\n"
        f"Engagement Score: {eng_score}/100 (Level: {eng_level})\n"
        f"Attendance: {attendance}%\n"
        f"Assignments: {assign.get('submitted', 0)}/{assign.get('total', 0)} completed"
        f", avg grade: {assign.get('avg_grade', 'N/A')}\n"
        f"Exams: {exams.get('total_attempts', 0)} attempts, avg score: {exams.get('avg_score', 'N/A')}\n"
        f"Games: {games.get('sessions_played', 0)} sessions, total score: {games.get('total_score', 0)}\n"
        f"\nWrite a short, professional summary highlighting strengths, areas for improvement, "
        f"and one actionable suggestion. Address the teacher, not the student. "
        f"Be specific with numbers. Do NOT use bullet points."
    )

    # Try Groq first
    if GroqService._available and GroqService._client:
        try:
            from app.services.groq_service import DEFAULT_MODEL, AVAILABLE_MODELS
            try:
                message = GroqService._client.chat.completions.create(
                    messages=[{"role": "user", "content": context_prompt}],
                    model=DEFAULT_MODEL,
                    temperature=0.6,
                    max_tokens=200,
                )
                summary = message.choices[0].message.content.strip()
                if summary:
                    return summary
            except Exception:
                for alt_model in AVAILABLE_MODELS[1:]:
                    try:
                        message = GroqService._client.chat.completions.create(
                            messages=[{"role": "user", "content": context_prompt}],
                            model=alt_model,
                            temperature=0.6,
                            max_tokens=200,
                        )
                        summary = message.choices[0].message.content.strip()
                        if summary:
                            return summary
                    except Exception:
                        continue
        except Exception as e:
            logger.warning(f"Groq AI summary failed, using heuristic: {e}")

    # ── Heuristic fallback ────────────────────────────────────
    parts = []

    # Engagement overview
    if eng_level == "excellent":
        parts.append(f"{student_name} is performing exceptionally well with an engagement score of {eng_score}/100.")
    elif eng_level == "good":
        parts.append(f"{student_name} shows solid engagement at {eng_score}/100, with room for growth.")
    elif eng_level == "needs_attention":
        parts.append(f"{student_name}'s engagement score of {eng_score}/100 indicates they may need additional support.")
    else:
        parts.append(f"{student_name} is at risk with an engagement score of only {eng_score}/100 and requires immediate attention.")

    # Attendance insight
    if attendance >= 80:
        parts.append(f"Attendance is strong at {attendance}%.")
    elif attendance >= 50:
        parts.append(f"Attendance of {attendance}% is below expectations — consider a check-in.")
    else:
        parts.append(f"Critically low attendance at {attendance}% — this is the top priority to address.")

    # Assignment insight
    total_a = assign.get("total", 0)
    submitted_a = assign.get("submitted", 0)
    if total_a > 0:
        rate = assign.get("completion_rate", 0)
        if rate >= 80:
            parts.append(f"Assignment completion is excellent ({submitted_a}/{total_a}).")
        elif rate >= 50:
            parts.append(f"Has submitted {submitted_a} of {total_a} assignments — encourage timely submissions.")
        else:
            parts.append(f"Only {submitted_a} of {total_a} assignments submitted — follow up on missing work.")

    # Games insight
    sessions = games.get("sessions_played", 0)
    if sessions > 0:
        parts.append(f"Participated in {sessions} EduGame session(s) with a total score of {games.get('total_score', 0)}.")

    return " ".join(parts)


def _get_student_engagement(student, db: Session, assignments: list):
    """Compute engagement data for a single student within a course."""

    student_id_str = str(student.id)

    # ── Assignment / Submission data ──────────────────────────
    total_assignments = len(assignments)
    submissions = []
    submitted_count = 0
    total_grade = 0.0
    graded_count = 0

    for a in assignments:
        sub = db.query(Submission).filter(
            Submission.assignment_id == a.id,
            Submission.student_name == student.name
        ).first()
        if sub:
            submitted_count += 1
            submissions.append({
                "assignment_id": a.id,
                "assignment_title": a.title,
                "due_date": a.due_date,
                "status": "submitted",
                "grade": sub.grade,
                "submitted_at": sub.submitted_at,
                "max_points": a.max_points,
            })
            if sub.grade is not None:
                total_grade += sub.grade
                graded_count += 1
        else:
            submissions.append({
                "assignment_id": a.id,
                "assignment_title": a.title,
                "due_date": a.due_date,
                "status": "missing",
                "grade": None,
                "submitted_at": None,
                "max_points": a.max_points,
            })

    assignment_completion = (submitted_count / total_assignments * 100) if total_assignments > 0 else 0
    avg_grade = (total_grade / graded_count) if graded_count > 0 else None

    # ── Exam data ─────────────────────────────────────────────
    # Exams use users table for student_id. Try matching by name.
    exam_attempts_raw = []
    try:
        # Try direct student_id match first (if student was also a user)
        exam_attempts_raw = db.query(ExamAttempt).filter(
            ExamAttempt.student_id == student.id,
            ExamAttempt.status == "submitted"
        ).all()
    except Exception:
        pass

    exams_data = []
    total_exam_score = 0.0
    for attempt in exam_attempts_raw:
        exam = db.query(Exam).filter(Exam.id == attempt.exam_id).first()
        exam_title = exam.title if exam else "Unknown Exam"
        exams_data.append({
            "exam_id": attempt.exam_id,
            "exam_title": exam_title,
            "score": attempt.score,
            "status": attempt.status,
            "start_time": attempt.start_time.isoformat() if attempt.start_time else None,
            "end_time": attempt.end_time.isoformat() if attempt.end_time else None,
        })
        if attempt.score is not None:
            total_exam_score += attempt.score

    avg_exam_score = (total_exam_score / len(exam_attempts_raw)) if exam_attempts_raw else None

    # ── Game data ─────────────────────────────────────────────
    game_players = db.query(ChainAnswerGamePlayer).filter(
        ChainAnswerGamePlayer.student_id == student_id_str
    ).all()

    games_data = []
    total_game_score = 0.0
    total_words_submitted = 0
    total_words_valid = 0

    for gp in game_players:
        game = db.query(ChainAnswerGame).filter(
            ChainAnswerGame.id == gp.game_id
        ).first()
        game_name = game.name if game else "Unknown Game"
        game_status = game.status if game else "unknown"
        games_data.append({
            "game_id": gp.game_id,
            "game_name": game_name,
            "game_status": game_status,
            "score": gp.score,
            "words_submitted": gp.words_submitted,
            "words_valid": gp.words_valid,
            "player_status": gp.status,
        })
        total_game_score += (gp.score or 0)
        total_words_submitted += (gp.words_submitted or 0)
        total_words_valid += (gp.words_valid or 0)

    # ── Engagement Score ──────────────────────────────────────
    # Weighted composite: attendance 25%, assignment 35%, exams 25%, games 15%
    attendance_pct = min(student.attendance or 0, 100)
    assignment_score_pct = assignment_completion
    exam_pct = min(avg_exam_score or 0, 100) if avg_exam_score is not None else attendance_pct  # fallback
    game_pct = min(total_game_score, 100) if game_players else attendance_pct  # fallback

    engagement_score = round(
        attendance_pct * 0.25 +
        assignment_score_pct * 0.35 +
        exam_pct * 0.25 +
        game_pct * 0.15,
        1
    )

    engagement_level = _compute_engagement_level(engagement_score)

    # ── Activity Timeline ─────────────────────────────────────
    timeline = []

    for sub_data in submissions:
        if sub_data["status"] == "submitted" and sub_data["submitted_at"]:
            timeline.append({
                "type": "assignment_submission",
                "title": f"Submitted: {sub_data['assignment_title']}",
                "detail": f"Grade: {sub_data['grade']}" if sub_data['grade'] is not None else "Pending grading",
                "timestamp": sub_data["submitted_at"],
                "icon": "file-check"
            })

    for exam_d in exams_data:
        timeline.append({
            "type": "exam_attempt",
            "title": f"Exam: {exam_d['exam_title']}",
            "detail": f"Score: {exam_d['score']}",
            "timestamp": exam_d["end_time"] or exam_d["start_time"],
            "icon": "clipboard-list"
        })

    for game_d in games_data:
        timeline.append({
            "type": "game_session",
            "title": f"Game: {game_d['game_name']}",
            "detail": f"Score: {game_d['score']} | Words: {game_d['words_valid']}/{game_d['words_submitted']}",
            "timestamp": None,
            "icon": "gamepad-2"
        })

    # Sort timeline by timestamp (most recent first), put None-timestamps at end
    timeline.sort(key=lambda x: x["timestamp"] or "", reverse=True)

    result = {
        "student_id": student.id,
        "name": student.name,
        "email": student.email,
        "registration_number": student.registration_number,
        "department": student.department,
        "student_class": student.student_class,
        "attendance": student.attendance or 0,
        "engagement_score": engagement_score,
        "engagement_level": engagement_level,

        "assignments": {
            "total": total_assignments,
            "submitted": submitted_count,
            "completion_rate": round(assignment_completion, 1),
            "avg_grade": round(avg_grade, 1) if avg_grade is not None else None,
            "details": submissions,
        },

        "exams": {
            "total_attempts": len(exam_attempts_raw),
            "avg_score": round(avg_exam_score, 1) if avg_exam_score is not None else None,
            "details": exams_data,
        },

        "games": {
            "sessions_played": len(game_players),
            "total_score": total_game_score,
            "total_words_submitted": total_words_submitted,
            "total_words_valid": total_words_valid,
            "details": games_data,
        },

        "timeline": timeline[:20],  # Cap at 20 most recent
    }

    # Generate AI insight summary
    result["ai_summary"] = _generate_ai_summary(student.name, result)

    return result


@router.get("/{course_id}/summary")
def get_course_engagement_summary(course_id: int, db: Session = Depends(get_db)):
    """Get engagement summary for all students in a course."""

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    students = db.query(Student).filter(Student.course_id == course_id).all()
    assignments = db.query(Assignment).filter(Assignment.course_id == course_id).all()

    if not students:
        return {
            "course_id": course_id,
            "course_name": course.name,
            "total_students": 0,
            "class_avg_engagement": 0,
            "class_avg_attendance": 0,
            "class_avg_assignment_completion": 0,
            "at_risk_count": 0,
            "students": [],
        }

    all_engagement = []
    for s in students:
        eng = _get_student_engagement(s, db, assignments)
        all_engagement.append(eng)

    # Class-level aggregations
    total = len(all_engagement)
    avg_engagement = round(sum(e["engagement_score"] for e in all_engagement) / total, 1)
    avg_attendance = round(sum(e["attendance"] for e in all_engagement) / total, 1)
    avg_assignment = round(sum(e["assignments"]["completion_rate"] for e in all_engagement) / total, 1)
    at_risk = sum(1 for e in all_engagement if e["engagement_level"] == "at_risk")
    needs_attention = sum(1 for e in all_engagement if e["engagement_level"] == "needs_attention")

    # Sort by engagement score descending
    all_engagement.sort(key=lambda x: x["engagement_score"], reverse=True)

    return {
        "course_id": course_id,
        "course_name": course.name,
        "total_students": total,
        "class_avg_engagement": avg_engagement,
        "class_avg_attendance": avg_attendance,
        "class_avg_assignment_completion": avg_assignment,
        "at_risk_count": at_risk,
        "needs_attention_count": needs_attention,
        "students": all_engagement,
    }


@router.get("/student/{student_id}")
def get_student_engagement(student_id: int, db: Session = Depends(get_db)):
    """Get detailed engagement profile for a single student."""

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    assignments = db.query(Assignment).filter(
        Assignment.course_id == student.course_id
    ).all()

    return _get_student_engagement(student, db, assignments)
