from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.database import SessionLocal
from app.models.history import ActionHistory
from pydantic import BaseModel

router = APIRouter(prefix="/history", tags=["History"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ActionHistoryCreate(BaseModel):
    feature: str
    action: str
    reaction: Optional[str] = None
    result: Optional[str] = None
    user_id: Optional[str] = None
    metadata_json: Optional[dict] = None

class ActionHistoryResponse(ActionHistoryCreate):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=ActionHistoryResponse, status_code=status.HTTP_201_CREATED)
def create_history(payload: ActionHistoryCreate, db: Session = Depends(get_db)):
    history = ActionHistory(**payload.model_dump())
    db.add(history)
    db.commit()
    db.refresh(history)
    return history

@router.get("/", response_model=list[ActionHistoryResponse])
def get_history(
    feature: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ActionHistory)
    if feature:
        query = query.filter(ActionHistory.feature == feature)
    if user_id:
        query = query.filter(ActionHistory.user_id == user_id)
    return query.order_by(ActionHistory.timestamp.desc()).all()
