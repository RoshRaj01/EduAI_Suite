from fastapi import APIRouter, status
from datetime import datetime
from typing import Optional

from app.models.history import ActionHistory
from pydantic import BaseModel

history_router = APIRouter(prefix="/history", tags=["History"])

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

@history_router.post("/", response_model=ActionHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_history(payload: ActionHistoryCreate):
    history = ActionHistory(**payload.model_dump())
    await history.assign_id()
    await history.insert()
    return ActionHistoryResponse(**history.model_dump(), id=history.int_id)

@history_router.get("/", response_model=list[ActionHistoryResponse])
async def get_history(
    feature: Optional[str] = None,
    user_id: Optional[str] = None
):
    query = ActionHistory.find_all()
    if feature:
        query = query.find(ActionHistory.feature == feature)
    if user_id:
        query = query.find(ActionHistory.user_id == user_id)
        
    histories = await query.sort("-timestamp").to_list()
    return [ActionHistoryResponse(**h.model_dump(), id=h.int_id) for h in histories]
