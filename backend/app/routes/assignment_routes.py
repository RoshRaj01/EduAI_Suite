from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from app.models.assignment import Assignment
from app.models.course import Course
from app.models.announcement import Announcement
from app.schemas.assignment import AssignmentResponse
from datetime import datetime
from typing import Optional
from app.utils.file_uploads import save_optional_upload

assignment_router = APIRouter(prefix="/assignments", tags=["Assignments"])

@assignment_router.get("/{course_id}", response_model=list[AssignmentResponse])
async def get_assignments(course_id: int):
    assignments = await Assignment.find(Assignment.course_id == course_id).to_list()
    return [
        AssignmentResponse(**{**a.model_dump(), "id": a.int_id}) for a in assignments
    ]

@assignment_router.post("/{course_id}", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    course_id: int,
    title: str = Form(...),
    description: str = Form(""),
    due_date: str = Form(...),
    max_points: int = Form(100),
    file: Optional[UploadFile] = File(None)
):
    course = await Course.find_one(Course.int_id == course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    media_path = save_optional_upload(file, "assignments")

    new_assignment = Assignment(
        course_id=course_id,
        title=title,
        description=description,
        due_date=due_date,
        max_points=max_points,
        media_path=media_path
    )
    await new_assignment.assign_id()
    await new_assignment.insert()

    # Auto Announcement
    now_str = datetime.now().strftime("%I:%M %p, %b %d")
    an = Announcement(
        course_id=course_id, 
        title=f"New Assignment: {title}",
        body=f"Assignment '{title}' has been scheduled for {due_date.replace('T', ' at ')}.", 
        time=now_str, 
        pinned=False
    )
    await an.assign_id()
    await an.insert()

    return AssignmentResponse(**{**new_assignment.model_dump(), "id": new_assignment.int_id})

@assignment_router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    max_points: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    assignment = await Assignment.find_one(Assignment.int_id == assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if title is not None:
        assignment.title = title
    if description is not None:
        assignment.description = description
    if due_date is not None:
        assignment.due_date = due_date
    if max_points is not None:
        assignment.max_points = max_points
    if file:
        assignment.media_path = save_optional_upload(file, "assignments")

    now_str = datetime.now().strftime("%I:%M %p, %b %d")
    an = Announcement(
        course_id=assignment.course_id, 
        title=f"Assignment Updated: {assignment.title}",
        body=f"Details or attachments for assignment '{assignment.title}' have been modified.", 
        time=now_str, 
        pinned=False
    )
    await an.assign_id()
    await an.insert()

    await assignment.save()
    return AssignmentResponse(**{**assignment.model_dump(), "id": assignment.int_id})

@assignment_router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(assignment_id: int):
    assignment = await Assignment.find_one(Assignment.int_id == assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    now_str = datetime.now().strftime("%I:%M %p, %b %d")
    an = Announcement(
        course_id=assignment.course_id, 
        title=f"Assignment Cancelled",
        body=f"Assignment '{assignment.title}' has been removed.", 
        time=now_str, 
        pinned=False
    )
    await an.assign_id()
    await an.insert()

    await assignment.delete()
    return None
