from fastapi import APIRouter, HTTPException
from app.models.trello import TrelloBoard, TrelloColumn, TrelloCard
from app.models.student import Student
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

trello_router = APIRouter(prefix="/trello", tags=["Trello"])

# Schemas
class CardSchema(BaseModel):
    id: str
    columnId: str
    boardId: str
    title: str
    description: str = ""
    dueDate: Optional[str] = None
    labels: List[dict] = []
    checklist: List[dict] = []
    sequence: int = 0
    createdAt: str = ""

class ColumnSchema(BaseModel):
    id: str
    boardId: str
    title: str
    sequence: int = 0

class BoardSchema(BaseModel):
    id: str
    name: str
    background: str
    creatorEmail: str
    starred: bool = False
    members: List[str] = []
    joinRequests: List[str] = []
    createdAt: str

class TrelloSyncSchema(BaseModel):
    boards: List[BoardSchema]
    columns: List[ColumnSchema]
    cards: List[CardSchema]
    email: str

@trello_router.post("/sync")
async def sync_trello(data: TrelloSyncSchema):
    """Synchronize local Trello state with the backend."""
    
    # 1. Update/Create Boards
    for b in data.boards:
        db_board = await TrelloBoard.find_one(TrelloBoard.id == b.id)
        if not db_board:
            db_board = TrelloBoard(
                id=b.id,
                name=b.name,
                background=b.background,
                creator_email=b.creatorEmail,
                starred=b.starred,
                members=b.members,
                join_requests=b.joinRequests
            )
            try:
                db_board.created_at = datetime.fromisoformat(b.createdAt.replace('Z', '+00:00'))
            except:
                db_board.created_at = datetime.utcnow()
            await db_board.insert()
        else:
            db_board.name = b.name
            db_board.background = b.background
            db_board.creator_email = b.creatorEmail
            db_board.starred = b.starred
            db_board.members = b.members
            db_board.join_requests = b.joinRequests
            try:
                db_board.created_at = datetime.fromisoformat(b.createdAt.replace('Z', '+00:00'))
            except:
                pass
            await db_board.save()

    # 2. Update/Create Columns
    board_ids = [b.id for b in data.boards]
    if board_ids:
        await TrelloColumn.find({"board_id": {"$in": board_ids}}).delete()
        await TrelloCard.find({"board_id": {"$in": board_ids}}).delete()

    cols_to_insert = []
    for col in data.columns:
        db_col = TrelloColumn(
            id=col.id,
            board_id=col.boardId,
            title=col.title,
            sequence=col.sequence
        )
        cols_to_insert.append(db_col)
        
    if cols_to_insert:
        await TrelloColumn.insert_many(cols_to_insert)

    cards_to_insert = []
    for card in data.cards:
        db_card = TrelloCard(
            id=card.id,
            column_id=card.columnId,
            board_id=card.boardId,
            title=card.title,
            description=card.description,
            due_date=card.dueDate,
            sequence=card.sequence,
            labels=card.labels,
            checklist=card.checklist,
            created_at=datetime.fromisoformat(card.createdAt.replace('Z', '+00:00')) if card.createdAt else datetime.utcnow()
        )
        cards_to_insert.append(db_card)
        
    if cards_to_insert:
        await TrelloCard.insert_many(cards_to_insert)

@trello_router.get("/sync")
async def pull_trello(email: str):
    """Fetch the latest Trello state from the backend without modifying it."""
    all_boards = await TrelloBoard.find_all().to_list()
    accessible_boards = [
        b for b in all_boards
        if b.creator_email == email or (b.members and email in b.members)
    ]
    
    accessible_ids = [b.id for b in accessible_boards]
    
    all_columns = await TrelloColumn.find({"board_id": {"$in": accessible_ids}}).to_list() if accessible_ids else []
    all_cards = await TrelloCard.find({"board_id": {"$in": accessible_ids}}).to_list() if accessible_ids else []

    return {
        "boards": [
            {
                "id": b.id,
                "name": b.name,
                "background": b.background,
                "creatorEmail": b.creator_email,
                "starred": b.starred,
                "members": b.members,
                "joinRequests": b.join_requests,
                "createdAt": b.created_at.isoformat() if b.created_at else ""
            } for b in accessible_boards
        ],
        "columns": [
            {
                "id": c.id,
                "boardId": c.board_id,
                "title": c.title,
                "sequence": c.sequence
            } for c in all_columns
        ],
        "cards": [
            {
                "id": c.id,
                "columnId": c.column_id,
                "boardId": c.board_id,
                "title": c.title,
                "description": c.description,
                "dueDate": c.due_date,
                "labels": c.labels,
                "checklist": c.checklist,
                "sequence": c.sequence,
                "createdAt": c.created_at.isoformat() if c.created_at else ""
            } for c in all_cards
        ]
    }


@trello_router.get("/suggested-members")
async def get_suggested_members(email: str, role: str):
    """Get suggested members for a board based on the user's role and context."""
    suggestions = []
    
    if role == "student":
        student_records = await Student.find(Student.email == email).to_list()
        course_ids = [s.course_id for s in student_records]
        if course_ids:
            suggestions.append({"name": "Lead Teacher", "email": "teacher@eduai.com", "role": "teacher"})
            
            peers = await Student.find(
                {"course_id": {"$in": course_ids}, "email": {"$ne": email}}
            ).limit(10).to_list()
            
            for p in peers:
                suggestions.append({"name": p.name, "email": p.email, "role": "student"})
    
    elif role == "teacher":
        suggestions.append({"name": "Test Student", "email": "student@eduai.com", "role": "student"})
        added_emails = {"student@eduai.com"}
        
        students = await Student.find_all().limit(20).to_list()
        for s in students:
            if s.email not in added_emails:
                suggestions.append({"name": s.name, "email": s.email, "role": "student"})
                added_emails.add(s.email)
                
    return suggestions

@trello_router.get("/board/{board_id}")
async def get_board_by_id(board_id: str):
    """Look up a board by ID — enables cross-app board discovery."""
    board = await TrelloBoard.find_one(TrelloBoard.id == board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return {
        "id": board.id,
        "name": board.name,
        "creatorEmail": board.creator_email,
        "members": board.members or [],
        "joinRequests": board.join_requests or [],
    }

class JoinRequestSchema(BaseModel):
    email: str

@trello_router.post("/board/{board_id}/join")
async def request_join_board(board_id: str, data: JoinRequestSchema):
    """Submit a join request to a board — works across apps."""
    board = await TrelloBoard.find_one(TrelloBoard.id == board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    if board.creator_email == data.email:
        raise HTTPException(status_code=400, detail="You are the creator of this board")
    
    members = board.members or []
    if data.email in members:
        raise HTTPException(status_code=400, detail="Already a member")
    
    join_requests = board.join_requests or []
    if data.email in join_requests:
        raise HTTPException(status_code=400, detail="Join request already pending")
    
    join_requests.append(data.email)
    board.join_requests = join_requests
    await board.save()
    
    return {"status": "requested", "message": "Join request submitted successfully"}

@trello_router.post("/board/{board_id}/approve")
async def approve_join_request(board_id: str, data: JoinRequestSchema):
    """Approve a join request — moves user from joinRequests to members."""
    board = await TrelloBoard.find_one(TrelloBoard.id == board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    join_requests = board.join_requests or []
    if data.email not in join_requests:
        raise HTTPException(status_code=400, detail="No pending request for this email")
    
    join_requests = [email for email in join_requests if email != data.email]
    board.join_requests = join_requests
    
    members = board.members or []
    if data.email not in members:
        members.append(data.email)
        board.members = members
    
    await board.save()
    
    return {"status": "approved", "members": board.members}

@trello_router.post("/board/{board_id}/reject")
async def reject_join_request(board_id: str, data: JoinRequestSchema):
    """Reject a join request — removes user from joinRequests."""
    board = await TrelloBoard.find_one(TrelloBoard.id == board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    join_requests = board.join_requests or []
    if data.email not in join_requests:
        raise HTTPException(status_code=400, detail="No pending request for this email")
    
    join_requests = [email for email in join_requests if email != data.email]
    board.join_requests = join_requests
    
    await board.save()
    
    return {"status": "rejected", "joinRequests": board.join_requests}

@trello_router.post("/board/{board_id}/add-member")
async def add_member(board_id: str, data: JoinRequestSchema):
    """Add a member directly to a board (invitation)."""
    board = await TrelloBoard.find_one(TrelloBoard.id == board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    members = board.members or []
    if data.email in members:
        return {"status": "already_member", "members": members}
        
    members.append(data.email)
    board.members = members
    
    join_requests = board.join_requests or []
    if data.email in join_requests:
        join_requests = [e for e in join_requests if e != data.email]
        board.join_requests = join_requests

    await board.save()
    
    return {"status": "added", "members": board.members}

@trello_router.post("/board/{board_id}/remove-member")
async def remove_member(board_id: str, data: JoinRequestSchema):
    """Remove a member from a board."""
    board = await TrelloBoard.find_one(TrelloBoard.id == board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    members = board.members or []
    if data.email not in members:
        return {"status": "not_member", "members": members}
        
    members = [e for e in members if e != data.email]
    board.members = members
    
    await board.save()
    
    return {"status": "removed", "members": board.members}

@trello_router.delete("/board/{board_id}")
async def delete_board(board_id: str):
    """Delete a board and its associated columns and cards."""
    board = await TrelloBoard.find_one(TrelloBoard.id == board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    await TrelloColumn.find(TrelloColumn.board_id == board_id).delete()
    await TrelloCard.find(TrelloCard.board_id == board_id).delete()
    
    await board.delete()
    
    return {"status": "deleted", "board_id": board_id}
