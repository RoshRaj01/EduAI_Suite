from fastapi import APIRouter, HTTPException
from app.models.game import WordCloudSession
import random
import string
from pydantic import BaseModel

wordcloud_router = APIRouter(prefix="/wordcloud", tags=["Word Cloud"])

class WordCloudCreateRequest(BaseModel):
    prompt: str

@wordcloud_router.post("/create")
async def create_wordcloud_session(request: WordCloudCreateRequest):
    # Generate 6-digit random pin
    pin = ''.join(random.choices(string.digits, k=6))
    
    # Ensure pin is unique
    while await WordCloudSession.find_one(WordCloudSession.pin == pin) is not None:
        pin = ''.join(random.choices(string.digits, k=6))
        
    session = WordCloudSession(
        pin=pin,
        prompt=request.prompt,
        status="active"
    )
    await session.assign_id()
    await session.insert()
    
    return {"pin": pin, "prompt": session.prompt, "session_id": session.int_id}

@wordcloud_router.get("/{pin}")
async def get_wordcloud_session(pin: str):
    session = await WordCloudSession.find_one(WordCloudSession.pin == pin)
    if not session:
        raise HTTPException(status_code=404, detail="Word Cloud session not found")
        
    return {"prompt": session.prompt, "status": session.status, "session_id": session.int_id}

@wordcloud_router.get("/")
async def get_all_wordcloud_sessions():
    sessions = await WordCloudSession.find_all().sort("-int_id").to_list()
    return [{"pin": s.pin, "prompt": s.prompt, "status": s.status, "session_id": s.int_id, "created_at": getattr(s, 'created_at', None)} for s in sessions]

@wordcloud_router.delete("/{pin}")
async def delete_wordcloud_session(pin: str):
    session = await WordCloudSession.find_one(WordCloudSession.pin == pin)
    if not session:
        raise HTTPException(status_code=404, detail="Word Cloud session not found")
        
    await session.delete()
    return {"status": "success", "message": "Deleted successfully"}
