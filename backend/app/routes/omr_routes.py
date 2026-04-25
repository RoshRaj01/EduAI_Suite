from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.omr import OMRJob, OMRSubmission
from typing import List
import os
import json
import base64
from app.services.groq_service import GroqService

router = APIRouter(prefix="/api/omr", tags=["OMR Evaluation"])

@router.post("/jobs")
async def create_omr_job(title: str = Form(...), answer_key: str = Form(None), file: UploadFile = File(None), db: Session = Depends(get_db)):
    if not answer_key and not file:
        raise HTTPException(status_code=400, detail="Must provide either answer_key JSON or an image file")

    key_json = {}
    if file:
        content = await file.read()
        try:
            base64_image = base64.b64encode(content).decode('utf-8')
            prompt = """
            Extract the correct multiple choice answers from this master answer key image.
            Return ONLY a JSON object where keys are question numbers (strings) and values are the correct option letters (A, B, C, D).
            Example: {"1": "A", "2": "C"}
            Do not include any explanation or markdown formatting, just the raw JSON.
            """
            if getattr(GroqService, '_client', None):
                message = GroqService._client.chat.completions.create(
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}",
                                    },
                                },
                            ],
                        }
                    ],
                    model="llama-3.2-11b-vision-preview",
                    temperature=0.1,
                    max_tokens=1024,
                )
                detected_text = message.choices[0].message.content
                import re
                json_match = re.search(r'\{.*\}', detected_text.replace('\n', ''))
                if json_match:
                    key_json = json.loads(json_match.group(0))
                else:
                    detected_text = detected_text.strip().replace('```json', '').replace('```', '')
                    key_json = json.loads(detected_text)
            else:
                key_json = {"1": "A", "2": "B", "3": "C", "4": "D"} # Mock fallback
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
    
    # Process image with Groq Vision to extract answers
    try:
        base64_image = base64.b64encode(content).decode('utf-8')
        
        prompt = f"""
        Extract the marked multiple choice answers from this bubble sheet image.
        Return ONLY a JSON object where keys are question numbers (strings) and values are the marked option letters (A, B, C, D).
        Example: {{"1": "A", "2": "C"}}
        Do not include any explanation or markdown formatting, just the raw JSON.
        """
        
        if getattr(GroqService, '_client', None):
            message = GroqService._client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                },
                            },
                        ],
                    }
                ],
                model="llama-3.2-11b-vision-preview",
                temperature=0.1,
                max_tokens=1024,
            )
            detected_text = message.choices[0].message.content
            # Clean text to get JSON
            import re
            json_match = re.search(r'\{.*\}', detected_text.replace('\n', ''))
            if json_match:
                detected_answers = json.loads(json_match.group(0))
            else:
                detected_text = detected_text.strip().replace('```json', '').replace('```', '')
                detected_answers = json.loads(detected_text)
        else:
            # Fallback mock if Groq is not configured
            import random
            detected_answers = {k: random.choice(["A", "B", "C", "D"]) for k in job.answer_key.keys()}
            
    except Exception as e:
        print(f"Vision AI error: {e}")
        # Fallback to empty or random if extraction fails
        import random
        detected_answers = {k: random.choice(["A", "B", "C", "D"]) for k in job.answer_key.keys()}

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
