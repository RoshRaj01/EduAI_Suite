from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from app.models.submission import Submission
from app.schemas.submission import SubmissionResponse
from typing import Optional, List
from app.utils.file_uploads import save_optional_upload
from datetime import datetime
import os

submission_router = APIRouter(prefix="/submissions", tags=["Submissions"])

@submission_router.get("/{assignment_id}", response_model=list[SubmissionResponse])
async def get_submissions(assignment_id: int):
    submissions = await Submission.find(Submission.assignment_id == assignment_id).to_list()
    return [
        SubmissionResponse(**{**s.model_dump(), "id": s.int_id}) for s in submissions
    ]

@submission_router.get("/assignment/{assignment_id}", response_model=list[SubmissionResponse])
async def get_submissions_by_assignment(assignment_id: int):
    submissions = await Submission.find(Submission.assignment_id == assignment_id).to_list()
    return [
        SubmissionResponse(**{**s.model_dump(), "id": s.int_id}) for s in submissions
    ]

@submission_router.post("/{assignment_id}", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    assignment_id: int,
    student_name: str = Form(...),
    files: List[UploadFile] = File(...)
):
    paths = []
    for file in files:
        path = save_optional_upload(file, "submissions")
        if path:
            paths.append(path)
    
    media_path = ",".join(paths)
    now_str = datetime.now().strftime("%I:%M %p, %b %d")

    new_sub = Submission(
        assignment_id=assignment_id,
        student_name=student_name,
        file_path=media_path,
        submitted_at=now_str
    )
    
    await new_sub.assign_id()
    await new_sub.insert()
    
    return SubmissionResponse(**{**new_sub.model_dump(), "id": new_sub.int_id})

@submission_router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_submission(submission_id: int):
    sub = await Submission.find_one(Submission.int_id == submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Optional: Delete files from disk
    if sub.file_path:
        paths = sub.file_path.split(",")
        for p in paths:
             # Logic to remove file if desired, for now just DB delete
             pass

    await sub.delete()
    return None

@submission_router.delete("/assignment/{assignment_id}/student/{student_name}", status_code=status.HTTP_204_NO_CONTENT)
async def unsubmit_assignment(assignment_id: int, student_name: str):
    subs = await Submission.find(
        Submission.assignment_id == assignment_id,
        Submission.student_name == student_name
    ).to_list()
    
    for sub in subs:
        await sub.delete()
    return None

@submission_router.put("/grade/{submission_id}", response_model=SubmissionResponse)
async def grade_submission(submission_id: int, grade: float = Form(...)):
    sub = await Submission.find_one(Submission.int_id == submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    sub.grade = grade
    await sub.save()
    return SubmissionResponse(**{**sub.model_dump(), "id": sub.int_id})
