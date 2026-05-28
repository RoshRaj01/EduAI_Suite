from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.models.appointment import Appointment
from app.models.history import ActionHistory
from app.schemas.appointment import AppointmentCreate, AppointmentResponse, AppointmentStatusUpdate

appointment_router = APIRouter(prefix="/appointments", tags=["Appointments"])


@appointment_router.get("/", response_model=list[AppointmentResponse])
async def get_appointments(
    teacher_name: Optional[str] = None,
    student_name: Optional[str] = None,
    status_filter: Optional[str] = None
):
    query = Appointment.find_all()
    if teacher_name:
        query = query.find(Appointment.teacher_name == teacher_name)
    if student_name:
        query = query.find(Appointment.student_name == student_name)
    if status_filter:
        query = query.find(Appointment.status == status_filter)
        
    appointments = await query.sort("-int_id").to_list()
    return [AppointmentResponse(**{**a.model_dump(), "id": a.int_id}) for a in appointments]


@appointment_router.get("/teacher/{teacher_name}", response_model=list[AppointmentResponse])
async def get_teacher_appointments(teacher_name: str):
    appointments = await Appointment.find(Appointment.teacher_name == teacher_name).sort("-int_id").to_list()
    return [AppointmentResponse(**{**a.model_dump(), "id": a.int_id}) for a in appointments]


@appointment_router.get("/student/{student_name}", response_model=list[AppointmentResponse])
async def get_student_appointments(student_name: str):
    appointments = await Appointment.find(Appointment.student_name == student_name).sort("-int_id").to_list()
    return [AppointmentResponse(**{**a.model_dump(), "id": a.int_id}) for a in appointments]


@appointment_router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(payload: AppointmentCreate):
    appointment = Appointment(
        student_name=payload.student_name,
        student_email=payload.student_email,
        teacher_name=payload.teacher_name,
        teacher_department=payload.teacher_department,
        meeting_mode=payload.meeting_mode,
        time_slot=payload.time_slot,
        agenda=payload.agenda,
        details=payload.details,
        status="pending",
        requested_at=datetime.utcnow().isoformat(timespec="minutes"),
    )
    await appointment.assign_id()
    await appointment.insert()
    
    # Log to ActionHistory for notifications
    history = ActionHistory(
        feature="appointment",
        action="book_appointment",
        reaction="student_triggered",
        result="pending",
        timestamp=datetime.now(),
        metadata_json={
            "student_name": appointment.student_name,
            "teacher_name": appointment.teacher_name,
            "agenda": appointment.agenda,
            "time_slot": appointment.time_slot
        }
    )
    await history.assign_id()
    await history.insert()
    
    return AppointmentResponse(**{**appointment.model_dump(), "id": appointment.int_id})


@appointment_router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: int,
    payload: AppointmentStatusUpdate
):
    appointment = await Appointment.find_one(Appointment.int_id == appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = payload.status
    appointment.reviewed_by = payload.reviewed_by
    appointment.reviewed_at = datetime.utcnow().isoformat(timespec="minutes")
    appointment.rejection_reason = payload.rejection_reason
    appointment.notes = payload.notes
    
    # Log to ActionHistory for notifications
    history = ActionHistory(
        feature="appointment",
        action=f"{payload.status}_appointment",
        reaction="teacher_triggered",
        result=payload.status,
        timestamp=datetime.now(),
        metadata_json={
            "appointment_id": appointment.int_id,
            "student_name": appointment.student_name,
            "status": payload.status,
            "rejection_reason": payload.rejection_reason
        }
    )
    await history.assign_id()
    await history.insert()
    
    await appointment.save()
    return AppointmentResponse(**{**appointment.model_dump(), "id": appointment.int_id})
