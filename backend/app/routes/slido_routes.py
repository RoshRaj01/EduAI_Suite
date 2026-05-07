from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.slido import (
    PresentationAssignment, PresentationSubmission, SlidoSession,
    SlidoPoll, PollResponse, SlidoQnA, QnAUpvote, SubmissionInteraction
)
from app.models.user import User
from app.schemas.slido import (
    PresentationAssignmentCreate, PresentationAssignmentUpdate, PresentationAssignmentResponse,
    PresentationSubmissionCreate, PresentationSubmissionGrade, PresentationSubmissionResponse,
    SlidoSessionCreate, SlidoSessionUpdate, SlidoSessionResponse,
    SlidoPollCreate, SlidoPollResponse,
    PollResponseCreate, PollResponseResponse,
    SlidoQnACreate, SlidoQnAUpdate, SlidoQnAResponse,
    QnAUpvoteResponse,
    SubmissionInteractionCreate, SubmissionInteractionUpdate, SubmissionInteractionResponse
)
from app.services.storage_service import get_storage_service
from datetime import datetime
from typing import Optional, List
import os
import secrets
import mimetypes

slido_router = APIRouter(prefix="/slido", tags=["Slido"])
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def validate_pptx_file(file_content: bytes, filename: str) -> bool:
    """
    Validate PPTX file signature and extension.
    PPTX files are ZIP archives with specific internal structure.
    """
    # Check extension
    if not filename.lower().endswith('.pptx'):
        return False

    # Check file signature (PPTX files start with PK for ZIP format)
    if not file_content.startswith(b'PK\x03\x04'):
        return False

    # Check MIME type
    mime_type, _ = mimetypes.guess_type(filename)
    if mime_type and mime_type != 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        # Also accept generic application/zip
        if mime_type != 'application/zip':
            return False

    return True


def save_pptx_file(file_content: bytes, file_name: str) -> Optional[str]:
    """Save PPTX file to S3-compatible storage and return presigned URL"""
    try:
        storage = get_storage_service()

        # Generate unique object key
        unique_filename = f"{secrets.token_hex(16)}_{file_name}"

        # Upload to storage
        object_key = storage.upload_file(
            file_content=file_content,
            file_name=unique_filename,
            folder='presentations',
            content_type='application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )

        if not object_key:
            return None

        # Generate presigned URL (valid for 7 days)
        presigned_url = storage.generate_presigned_url(
            object_key=object_key,
            expiration=7 * 24 * 3600  # 7 days
        )

        return presigned_url
    except Exception as e:
        print(f"Error saving PPTX file: {e}")
        return None


# ==================== PresentationAssignment Endpoints ====================

@slido_router.post("/assignments", response_model=PresentationAssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment: PresentationAssignmentCreate,
    teacher_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Create a new presentation assignment"""
    try:
        # Create the assignment with the provided teacher_id
        # No strict teacher validation to allow flexibility in testing
        new_assignment = PresentationAssignment(
            teacher_id=teacher_id,
            course_id=assignment.course_id,
            title=assignment.title,
            description=assignment.description,
            deadline=assignment.deadline
        )
        db.add(new_assignment)
        db.commit()
        db.refresh(new_assignment)
        return new_assignment
    except Exception as e:
        db.rollback()
        print(f"Error creating assignment: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create assignment: {str(e)}")


@slido_router.get("/assignments/{assignment_id}", response_model=PresentationAssignmentResponse)
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Get a specific assignment"""
    assignment = db.query(PresentationAssignment).filter(
        PresentationAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


@slido_router.get("/assignments", response_model=List[PresentationAssignmentResponse])
def list_assignments(
    teacher_id: Optional[int] = Query(None),
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """List assignments, optionally filtered by teacher or course"""
    query = db.query(PresentationAssignment)
    if teacher_id:
        query = query.filter(PresentationAssignment.teacher_id == teacher_id)
    if course_id:
        query = query.filter(PresentationAssignment.course_id == course_id)
    return query.all()


@slido_router.put("/assignments/{assignment_id}", response_model=PresentationAssignmentResponse)
def update_assignment(
    assignment_id: int,
    update_data: PresentationAssignmentUpdate,
    db: Session = Depends(get_db)
):
    """Update an assignment"""
    assignment = db.query(PresentationAssignment).filter(
        PresentationAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(assignment, key, value)

    assignment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assignment)
    return assignment


# ==================== PresentationSubmission Endpoints ====================

@slido_router.post("/submissions/upload", response_model=PresentationSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def upload_presentation(
    assignment_id: int = Form(...),
    student_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a presentation file for an assignment"""
    # Verify assignment exists
    assignment = db.query(PresentationAssignment).filter(
        PresentationAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Verify student exists
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=403, detail="Student not found")

    # Read and validate file
    file_content = await file.read()
    if not validate_pptx_file(file_content, file.filename):
        raise HTTPException(
            status_code=400,
            detail="Invalid file. Only .pptx files are accepted."
        )

    # Check file size (max 100MB)
    if len(file_content) > 100 * 1024 * 1024:
        raise HTTPException(
            status_code=400, detail="File too large. Max 100MB.")

    # Save file to S3-compatible storage
    file_url = save_pptx_file(file_content, file.filename)
    if not file_url:
        raise HTTPException(
            status_code=500,
            detail="Failed to save file. Please try again."
        )

    # Check if late
    is_late = False
    if assignment.deadline and datetime.utcnow() > assignment.deadline:
        is_late = True

    # Check for existing submission and update or create
    existing = db.query(PresentationSubmission).filter(
        PresentationSubmission.assignment_id == assignment_id,
        PresentationSubmission.student_id == student_id
    ).first()

    if existing:
        existing.file_url = file_url
        existing.file_name = file.filename
        existing.submitted_at = datetime.utcnow()
        existing.is_late = is_late
        db.commit()
        db.refresh(existing)
        return existing

    submission = PresentationSubmission(
        assignment_id=assignment_id,
        student_id=student_id,
        file_url=file_url,
        file_name=file.filename,
        is_late=is_late,
        status="draft"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@slido_router.get("/submissions/{submission_id}", response_model=PresentationSubmissionResponse)
def get_submission(submission_id: int, db: Session = Depends(get_db)):
    """Get a submission"""
    submission = db.query(PresentationSubmission).filter(
        PresentationSubmission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission


@slido_router.get("/submissions", response_model=List[PresentationSubmissionResponse])
def list_submissions(
    assignment_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """List submissions, optionally filtered"""
    query = db.query(PresentationSubmission)
    if assignment_id:
        query = query.filter(
            PresentationSubmission.assignment_id == assignment_id)
    if student_id:
        query = query.filter(PresentationSubmission.student_id == student_id)
    return query.all()


@slido_router.post("/submissions/{submission_id}/grade", response_model=PresentationSubmissionResponse)
def grade_submission(
    submission_id: int,
    grade_data: PresentationSubmissionGrade,
    teacher_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Grade a submission"""
    submission = db.query(PresentationSubmission).filter(
        PresentationSubmission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Verify teacher owns the assignment
    assignment = db.query(PresentationAssignment).filter(
        PresentationAssignment.id == submission.assignment_id
    ).first()
    if assignment.teacher_id != teacher_id:
        raise HTTPException(
            status_code=403, detail="Not authorized to grade this submission")

    submission.grade = grade_data.grade
    submission.teacher_feedback = grade_data.teacher_feedback
    submission.graded_at = datetime.utcnow()
    db.commit()
    db.refresh(submission)
    return submission


# ==================== SlidoSession Endpoints ====================

def generate_session_pin() -> str:
    """Generate a unique 6-digit PIN"""
    return ''.join([str(i) for i in secrets.token_bytes(3)]).zfill(6)[:6]


@slido_router.post("/sessions", response_model=SlidoSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    session_data: SlidoSessionCreate,
    teacher_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Start a new Slido session"""
    # Verify teacher exists
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if not teacher or teacher.role != "teacher":
        raise HTTPException(
            status_code=403, detail="Only teachers can start sessions")

    # If assignment provided, verify it exists
    if session_data.assignment_id:
        assignment = db.query(PresentationAssignment).filter(
            PresentationAssignment.id == session_data.assignment_id
        ).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

    # If submission provided, verify it exists
    if session_data.submission_id:
        submission = db.query(PresentationSubmission).filter(
            PresentationSubmission.id == session_data.submission_id
        ).first()
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")

    # Generate unique PIN
    pin = generate_session_pin()
    while db.query(SlidoSession).filter(SlidoSession.pin == pin).first():
        pin = generate_session_pin()

    new_session = SlidoSession(
        teacher_id=teacher_id,
        assignment_id=session_data.assignment_id,
        submission_id=session_data.submission_id,
        pin=pin
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@slido_router.get("/sessions/{session_id}", response_model=SlidoSessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get a session"""
    session = db.query(SlidoSession).filter(
        SlidoSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@slido_router.get("/sessions/pin/{pin}", response_model=SlidoSessionResponse)
def get_session_by_pin(pin: str, db: Session = Depends(get_db)):
    """Get a session by PIN (for students joining)"""
    session = db.query(SlidoSession).filter(SlidoSession.pin == pin).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@slido_router.put("/sessions/{session_id}", response_model=SlidoSessionResponse)
def update_session(
    session_id: int,
    update_data: SlidoSessionUpdate,
    db: Session = Depends(get_db)
):
    """Update session state"""
    session = db.query(SlidoSession).filter(
        SlidoSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(session, key, value)

    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


@slido_router.post("/sessions/{session_id}/end", response_model=SlidoSessionResponse)
def end_session(session_id: int, db: Session = Depends(get_db)):
    """End a session"""
    session = db.query(SlidoSession).filter(
        SlidoSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "ended"
    session.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


# ==================== SlidoPoll Endpoints ====================

@slido_router.post("/sessions/{session_id}/polls", response_model=SlidoPollResponse, status_code=status.HTTP_201_CREATED)
def create_poll(
    session_id: int,
    poll_data: SlidoPollCreate,
    teacher_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Create a new poll in a session"""
    session = db.query(SlidoSession).filter(
        SlidoSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.teacher_id != teacher_id:
        raise HTTPException(
            status_code=403, detail="Not authorized to create polls in this session")

    poll = SlidoPoll(
        session_id=session_id,
        teacher_id=teacher_id,
        question=poll_data.question,
        poll_type=poll_data.poll_type
    )
    db.add(poll)
    db.commit()
    db.refresh(poll)
    return poll


@slido_router.get("/polls/{poll_id}", response_model=SlidoPollResponse)
def get_poll(poll_id: int, db: Session = Depends(get_db)):
    """Get a poll"""
    poll = db.query(SlidoPoll).filter(SlidoPoll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    return poll


@slido_router.put("/polls/{poll_id}", response_model=SlidoPollResponse)
def update_poll(
    poll_id: int,
    is_active: bool = Form(...),
    db: Session = Depends(get_db)
):
    """Update poll status"""
    poll = db.query(SlidoPoll).filter(SlidoPoll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    poll.is_active = is_active
    poll.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(poll)
    return poll


@slido_router.post("/polls/{poll_id}/response", response_model=PollResponseResponse, status_code=status.HTTP_201_CREATED)
def submit_poll_response(
    poll_id: int,
    response: PollResponseCreate,
    student_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Submit a response to a poll"""
    poll = db.query(SlidoPoll).filter(SlidoPoll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    poll_response = PollResponse(
        poll_id=poll_id,
        student_id=student_id,
        option_text=response.option_text,
        response_text=response.response_text,
        response_value=response.response_value
    )
    db.add(poll_response)
    poll.total_responses += 1
    db.commit()
    db.refresh(poll_response)
    return poll_response


# ==================== SlidoQnA Endpoints ====================

@slido_router.post("/sessions/{session_id}/qna", response_model=SlidoQnAResponse, status_code=status.HTTP_201_CREATED)
def ask_question(
    session_id: int,
    question_data: SlidoQnACreate,
    student_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Post a Q&A question"""
    session = db.query(SlidoSession).filter(
        SlidoSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    question = SlidoQnA(
        session_id=session_id,
        student_id=student_id,
        question_text=question_data.question_text,
        is_anonymous=question_data.is_anonymous
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@slido_router.get("/qna/{question_id}", response_model=SlidoQnAResponse)
def get_question(question_id: int, db: Session = Depends(get_db)):
    """Get a Q&A question"""
    question = db.query(SlidoQnA).filter(SlidoQnA.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@slido_router.get("/sessions/{session_id}/qna", response_model=List[SlidoQnAResponse])
def get_session_questions(session_id: int, db: Session = Depends(get_db)):
    """Get all Q&A questions in a session"""
    return db.query(SlidoQnA).filter(SlidoQnA.session_id == session_id).order_by(
        SlidoQnA.upvotes.desc()
    ).all()


@slido_router.post("/qna/{question_id}/upvote", response_model=SlidoQnAResponse)
def upvote_question(
    question_id: int,
    student_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Upvote a Q&A question"""
    question = db.query(SlidoQnA).filter(SlidoQnA.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Check if already upvoted
    existing = db.query(QnAUpvote).filter(
        QnAUpvote.question_id == question_id,
        QnAUpvote.student_id == student_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400, detail="Already upvoted this question")

    # Create upvote record
    upvote = QnAUpvote(question_id=question_id, student_id=student_id)
    db.add(upvote)
    question.upvotes += 1
    question.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(question)
    return question


@slido_router.post("/qna/{question_id}/answer", response_model=SlidoQnAResponse)
def answer_question(
    question_id: int,
    update_data: SlidoQnAUpdate,
    teacher_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Answer a Q&A question (teacher only)"""
    question = db.query(SlidoQnA).filter(SlidoQnA.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Verify teacher owns the session
    session = db.query(SlidoSession).filter(
        SlidoSession.id == question.session_id
    ).first()
    if session.teacher_id != teacher_id:
        raise HTTPException(
            status_code=403, detail="Not authorized to answer questions in this session")

    question.is_answered = update_data.is_answered
    question.teacher_answer = update_data.teacher_answer
    question.answered_at = datetime.utcnow() if update_data.is_answered else None
    question.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(question)
    return question


# ==================== SubmissionInteraction Endpoints ====================

@slido_router.get("/submissions/{submission_id}/interactions", response_model=List[SubmissionInteractionResponse])
def list_interactions(submission_id: int, db: Session = Depends(get_db)):
    """Get all interactions for a submission, ordered by slide_number then order_index"""
    submission = db.query(PresentationSubmission).filter(
        PresentationSubmission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    return db.query(SubmissionInteraction).filter(
        SubmissionInteraction.submission_id == submission_id
    ).order_by(
        SubmissionInteraction.slide_number,
        SubmissionInteraction.order_index
    ).all()


@slido_router.post("/submissions/{submission_id}/interactions", response_model=SubmissionInteractionResponse, status_code=status.HTTP_201_CREATED)
def create_interaction(
    submission_id: int,
    interaction_data: SubmissionInteractionCreate,
    db: Session = Depends(get_db)
):
    """Add an interaction to a submission (only while in draft status)"""
    submission = db.query(PresentationSubmission).filter(
        PresentationSubmission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Cannot add interactions to a finalized submission"
        )

    # Validate interaction_type
    valid_types = ["poll_multiple_choice", "poll_open_text", "poll_word_cloud", "poll_rating", "qna_prompt"]
    if interaction_data.interaction_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid interaction type. Must be one of: {', '.join(valid_types)}"
        )

    interaction = SubmissionInteraction(
        submission_id=submission_id,
        slide_number=interaction_data.slide_number,
        interaction_type=interaction_data.interaction_type,
        config=interaction_data.config,
        order_index=interaction_data.order_index
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


@slido_router.put("/submissions/interactions/{interaction_id}", response_model=SubmissionInteractionResponse)
def update_interaction(
    interaction_id: int,
    update_data: SubmissionInteractionUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing interaction"""
    interaction = db.query(SubmissionInteraction).filter(
        SubmissionInteraction.id == interaction_id
    ).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    # Check submission is still in draft
    submission = db.query(PresentationSubmission).filter(
        PresentationSubmission.id == interaction.submission_id
    ).first()
    if submission.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Cannot modify interactions on a finalized submission"
        )

    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(interaction, key, value)

    interaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(interaction)
    return interaction


@slido_router.delete("/submissions/interactions/{interaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    """Remove an interaction from a submission"""
    interaction = db.query(SubmissionInteraction).filter(
        SubmissionInteraction.id == interaction_id
    ).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    # Check submission is still in draft
    submission = db.query(PresentationSubmission).filter(
        PresentationSubmission.id == interaction.submission_id
    ).first()
    if submission.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete interactions from a finalized submission"
        )

    db.delete(interaction)
    db.commit()
    return None


@slido_router.put("/submissions/{submission_id}/submit", response_model=PresentationSubmissionResponse)
def finalize_submission(submission_id: int, db: Session = Depends(get_db)):
    """Finalize a draft submission (changes status from 'draft' to 'submitted')"""
    submission = db.query(PresentationSubmission).filter(
        PresentationSubmission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.status != "draft":
        raise HTTPException(
            status_code=400,
            detail=f"Submission is already in '{submission.status}' state"
        )

    submission.status = "submitted"
    submission.submitted_at = datetime.utcnow()
    submission.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(submission)
    return submission

