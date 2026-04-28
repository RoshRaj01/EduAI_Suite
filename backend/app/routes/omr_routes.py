from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.omr import OMRJob, OMRSubmission
from app.services.groq_service import GroqService
from app.services.omr_service import OMRService
from typing import List
import os
import json
import base64
from io import BytesIO
from PIL import Image
from PIL import Image
import hashlib
import random

def compress_image_to_base64(image_bytes: bytes, max_size=(1024, 1024), quality=70) -> str:
    try:
        img = Image.open(BytesIO(image_bytes))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        buffer = BytesIO()
        img.save(buffer, format="JPEG", quality=quality)
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
    except BaseException as e:
        print(f"Image compression error: {e}")
        return base64.b64encode(image_bytes).decode('utf-8')

router = APIRouter(prefix="/api/omr", tags=["OMR Evaluation"])

@router.post("/jobs")
async def create_omr_job(title: str = Form(...), answer_key: str = Form(None), file: UploadFile = File(None), db: Session = Depends(get_db)):
    if not answer_key and not file:
        raise HTTPException(status_code=400, detail="Must provide either answer_key JSON or an image file")

    key_json = {}
    if file:
        content = await file.read()
        try:
            base64_image = compress_image_to_base64(content)
            
            # 1. Try OpenCV OMR first (as requested by user)
            # Save temporary file for OpenCV
            temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "omr"))
            os.makedirs(temp_dir, exist_ok=True)
            temp_path = os.path.join(temp_dir, f"temp_key_{hashlib.md5(content).hexdigest()}.jpg")
            with open(temp_path, "wb") as f:
                f.write(content)
            
            key_json = OMRService.process_omr_sheet(temp_path, num_questions=50)
            
            # 2. If OpenCV fails to find enough questions, use Groq Vision as a smart backup
            if not key_json or len(key_json) < 5:
                key_json = GroqService.evaluate_omr_image(base64_image, 50)
            
            if not key_json:
                # If both CV and AI fail, return an empty key so the user knows it failed
                key_json = {str(i): "-" for i in range(1, 11)}
            
            # Cleanup temp file
            if os.path.exists(temp_path): os.remove(temp_path)
        except Exception as e:
            print(f"Error processing key image: {e}")
            raise HTTPException(status_code=500, detail="Failed to parse answer key image")
    else:
        try:
            key_json = json.loads(answer_key)
        except:
            raise HTTPException(status_code=400, detail="Invalid answer key JSON")
    
    job = OMRJob(title=title, answer_key=key_json)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.get("/jobs")
def get_omr_jobs(db: Session = Depends(get_db)):
    return db.query(OMRJob).order_by(OMRJob.id.desc()).all()

@router.get("/jobs/{job_id}")
def get_omr_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(OMRJob).filter(OMRJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.delete("/jobs/{job_id}")
def delete_omr_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(OMRJob).filter(OMRJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Also delete associated submissions
    db.query(OMRSubmission).filter(OMRSubmission.job_id == job_id).delete()
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}

@router.put("/jobs/{job_id}")
async def update_omr_job(
    job_id: int, 
    title: str = Form(...), 
    answer_key: str = Form(None), 
    file: UploadFile = File(None), 
    db: Session = Depends(get_db)
):
    job = db.query(OMRJob).filter(OMRJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.title = title
    
    if file:
        content = await file.read()
        try:
            base64_image = compress_image_to_base64(content)
            # Re-extract key from image
            temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "omr"))
            os.makedirs(temp_dir, exist_ok=True)
            temp_path = os.path.join(temp_dir, f"temp_upd_{hashlib.md5(content).hexdigest()}.jpg")
            with open(temp_path, "wb") as f:
                f.write(content)
                
            key_json = OMRService.process_omr_sheet(temp_path, num_questions=50)
            if not key_json or len(key_json) < 5:
                key_json = GroqService.evaluate_omr_image(base64_image, 50)
            
            if key_json:
                job.answer_key = key_json
            
            if os.path.exists(temp_path): os.remove(temp_path)
        except Exception as e:
            print(f"Error updating with image: {e}")
    elif answer_key:
        try:
            job.answer_key = json.loads(answer_key)
        except:
            raise HTTPException(status_code=400, detail="Invalid answer key JSON")
        
    db.commit()
    db.refresh(job)
    return job

@router.get("/jobs/{job_id}/submissions")
def get_omr_submissions(job_id: int, db: Session = Depends(get_db)):
    return db.query(OMRSubmission).filter(OMRSubmission.job_id == job_id).all()

@router.post("/jobs/{job_id}/upload")
async def upload_omr_sheet(job_id: int, student_id: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    job = db.query(OMRJob).filter(OMRJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "omr"))
    os.makedirs(uploads_dir, exist_ok=True)
    
    file_path = os.path.join(uploads_dir, file.filename)
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    image_url = f"/uploads/omr/{file.filename}"
    
    # Process image with OMR Service (OpenCV) and AI Backup
    try:
        base64_image = compress_image_to_base64(content)
        
        # 1. OpenCV OMR
        detected_answers = OMRService.process_omr_sheet(file_path, num_questions=len(job.answer_key))
        
        # 2. AI Backup if CV results are suspicious or empty
        if not detected_answers or len(detected_answers) < len(job.answer_key) * 0.5:
            ai_answers = GroqService.evaluate_omr_image(base64_image, len(job.answer_key))
            if ai_answers:
                detected_answers = ai_answers
        
        if not detected_answers:
            # If all else fails, return placeholders
            detected_answers = {k: "-" for k in job.answer_key.keys()}
            
    except Exception as e:
        print(f"Vision AI error: {e}")
        detected_answers = {k: "-" for k in job.answer_key.keys()}

    # Calculate score
    score = 0
    total = len(job.answer_key)
    for q_no, correct_ans in job.answer_key.items():
        if detected_answers.get(str(q_no)) == correct_ans:
            score += 1
            
    final_score = (score / total) * 100 if total > 0 else 0

    submission = OMRSubmission(
        job_id=job_id,
        student_id=student_id,
        image_url=image_url,
        detected_answers=detected_answers,
        score=final_score,
        status="pending"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    return submission

@router.put("/submissions/{sub_id}")
def update_submission(sub_id: int, score: float = Form(...), detected_answers: str = Form(...), db: Session = Depends(get_db)):
    sub = db.query(OMRSubmission).filter(OMRSubmission.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    sub.score = score
    try:
        sub.detected_answers = json.loads(detected_answers)
    except:
        pass
    sub.status = "verified"
    db.commit()
    db.refresh(sub)
    return sub
