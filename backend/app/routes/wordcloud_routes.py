from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.game import WordCloudSession
import random
import string
from pydantic import BaseModel
from typing import Optional

wordcloud_router = APIRouter(prefix="/wordcloud", tags=["Word Cloud"])

class WordCloudCreateRequest(BaseModel):
    prompt: str

@wordcloud_router.post("/create")
def create_wordcloud_session(request: WordCloudCreateRequest, db: Session = Depends(get_db)):
    # Generate 6-digit random pin
    pin = ''.join(random.choices(string.digits, k=6))
    
    # Ensure pin is unique
    while db.query(WordCloudSession).filter(WordCloudSession.pin == pin).first() is not None:
        pin = ''.join(random.choices(string.digits, k=6))
        
    session = WordCloudSession(
        pin=pin,
        prompt=request.prompt,
        status="active"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {"pin": pin, "prompt": session.prompt, "session_id": session.id}

@wordcloud_router.get("/{pin}")
def get_wordcloud_session(pin: str, db: Session = Depends(get_db)):
    session = db.query(WordCloudSession).filter(WordCloudSession.pin == pin).first()
    if not session:
        raise HTTPException(status_code=404, detail="Word Cloud session not found")
        
    return {"prompt": session.prompt, "status": session.status, "session_id": session.id}

@wordcloud_router.get("/")
def get_all_wordcloud_sessions(db: Session = Depends(get_db)):
    sessions = db.query(WordCloudSession).order_by(WordCloudSession.id.desc()).all()
    return [{"pin": s.pin, "prompt": s.prompt, "status": s.status, "session_id": s.id, "created_at": getattr(s, 'created_at', None)} for s in sessions]

@wordcloud_router.delete("/{pin}")
def delete_wordcloud_session(pin: str, db: Session = Depends(get_db)):
    session = db.query(WordCloudSession).filter(WordCloudSession.pin == pin).first()
    if not session:
        raise HTTPException(status_code=404, detail="Word Cloud session not found")
        
    db.delete(session)
    db.commit()
    return {"status": "success", "message": "Deleted successfully"}
