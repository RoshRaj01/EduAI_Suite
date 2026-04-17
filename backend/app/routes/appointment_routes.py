from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentResponse, AppointmentStatusUpdate

router = APIRouter(prefix="/appointments", tags=["Appointments"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _base_query(db: Session):
    return db.query(Appointment)


@router.get("/", response_model=list[AppointmentResponse])
def get_appointments(
    teacher_name: str | None = None,
    student_name: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    query = _base_query(db)
    if teacher_name:
        query = query.filter(Appointment.teacher_name == teacher_name)
    if student_name:
        query = query.filter(Appointment.student_name == student_name)
    if status:
        query = query.filter(Appointment.status == status)
    return query.order_by(Appointment.id.desc()).all()


@router.get("/teacher/{teacher_name}", response_model=list[AppointmentResponse])
def get_teacher_appointments(teacher_name: str, db: Session = Depends(get_db)):
    return _base_query(db).filter(Appointment.teacher_name == teacher_name).order_by(Appointment.id.desc()).all()


@router.get("/student/{student_name}", response_model=list[AppointmentResponse])
def get_student_appointments(student_name: str, db: Session = Depends(get_db)):
    return _base_query(db).filter(Appointment.student_name == student_name).order_by(Appointment.id.desc()).all()


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db)):
    appointment = Appointment(
        student_name=payload.student_name,
        student_email=payload.student_email,
        teacher_name=payload.teacher_name,
        teacher_department=payload.teacher_department,
        meeting_mode=payload.meeting_mode,
        time_slot=payload.time_slot,
        topic=payload.topic,
        status="pending",
        requested_at=datetime.utcnow().isoformat(timespec="minutes"),
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    payload: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = payload.status
    appointment.reviewed_by = payload.reviewed_by
    appointment.reviewed_at = datetime.utcnow().isoformat(timespec="minutes")
    appointment.notes = payload.notes
    db.commit()
    db.refresh(appointment)
    return appointment
