from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.trello import TrelloBoard, TrelloColumn, TrelloCard
from app.models.user import User
from app.models.student import Student
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

trello_router = APIRouter(prefix="/trello", tags=["Trello"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
def sync_trello(data: TrelloSyncSchema, db: Session = Depends(get_db)):
    """Synchronize local Trello state with the backend."""
    # This is a simple implementation that overwrites or merges.
    # In a real app, we'd handle conflicts, but here we'll use 'last write wins' 
    # and ensure boards are accessible to the right people.
    
    # 1. Update/Create Boards
    for b in data.boards:
        db_board = db.query(TrelloBoard).filter(TrelloBoard.id == b.id).first()
        if not db_board:
            db_board = TrelloBoard(id=b.id)
            db.add(db_board)
        
        db_board.name = b.name
        db_board.background = b.background
        db_board.creator_email = b.creatorEmail
        db_board.starred = b.starred
        db_board.members = b.members
        db_board.join_requests = b.joinRequests
        # Convert string ISO date to datetime if needed, or store as is
        try:
            db_board.created_at = datetime.fromisoformat(b.createdAt.replace('Z', '+00:00'))
        except:
            pass

    # 2. Update/Create Columns
    # For simplicity, we'll clear and recreate columns/cards for synced boards
    board_ids = [b.id for b in data.boards]
    if board_ids:
        db.query(TrelloColumn).filter(TrelloColumn.board_id.in_(board_ids)).delete(synchronize_session=False)
        db.query(TrelloCard).filter(TrelloCard.board_id.in_(board_ids)).delete(synchronize_session=False)

    for col in data.columns:
        db_col = TrelloColumn(
            id=col.id,
            board_id=col.boardId,
            title=col.title,
            sequence=col.sequence
        )
        db.add(db_col)

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
        db.add(db_card)

    db.commit()

@trello_router.get("/sync")
def pull_trello(email: str, db: Session = Depends(get_db)):
    """Fetch the latest Trello state from the backend without modifying it."""
    all_boards = db.query(TrelloBoard).all()
    accessible_boards = [
        b for b in all_boards
        if b.creator_email == email or (b.members and email in b.members)
    ]
    
    accessible_ids = [b.id for b in accessible_boards]
    
    all_columns = db.query(TrelloColumn).filter(TrelloColumn.board_id.in_(accessible_ids)).all()
    all_cards = db.query(TrelloCard).filter(TrelloCard.board_id.in_(accessible_ids)).all()

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
def get_suggested_members(email: str, role: str, db: Session = Depends(get_db)):
    """Get suggested members for a board based on the user's role and context."""
    suggestions = []
    
    if role == "student":
        # Suggest teachers from courses this student is enrolled in
        student_records = db.query(Student).filter(Student.email == email).all()
        course_ids = [s.course_id for s in student_records]
        if course_ids:
            # We can find teachers of these courses. 
            # Currently courses have teacher_name, but not teacher_email? 
            # Let's check models again. 
            # In useAuthStore, teacher is teacher@eduai.com
            suggestions.append({"name": "Lead Teacher", "email": "teacher@eduai.com", "role": "teacher"})
            
            # Also find other students in the same courses
            peers = db.query(Student).filter(
                Student.course_id.in_(course_ids),
                Student.email != email
            ).limit(10).all()
            for p in peers:
                suggestions.append({"name": p.name, "email": p.email, "role": "student"})
    
    elif role == "teacher":
        # Always suggest the mock student first for easier testing
        suggestions.append({"name": "Test Student", "email": "student@eduai.com", "role": "student"})
        added_emails = {"student@eduai.com"}
        
        # Suggest all students in their courses
        # We can find courses where teacher_name matches or just all students for now
        # For simplicity in this mock-like environment, we'll return a few students
        students = db.query(Student).limit(20).all()
        for s in students:
            if s.email not in added_emails:
                suggestions.append({"name": s.name, "email": s.email, "role": "student"})
                added_emails.add(s.email)
                
    return suggestions

@trello_router.get("/board/{board_id}")
def get_board_by_id(board_id: str, db: Session = Depends(get_db)):
    """Look up a board by ID — enables cross-app board discovery."""
    board = db.query(TrelloBoard).filter(TrelloBoard.id == board_id).first()
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
def request_join_board(board_id: str, data: JoinRequestSchema, db: Session = Depends(get_db)):
    """Submit a join request to a board — works across apps."""
    board = db.query(TrelloBoard).filter(TrelloBoard.id == board_id).first()
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
    # Force SQLAlchemy to detect the change on JSON column
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(board, "join_requests")
    db.commit()
    
    return {"status": "requested", "message": "Join request submitted successfully"}

@trello_router.post("/board/{board_id}/approve")
def approve_join_request(board_id: str, data: JoinRequestSchema, db: Session = Depends(get_db)):
    """Approve a join request — moves user from joinRequests to members."""
    board = db.query(TrelloBoard).filter(TrelloBoard.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    join_requests = board.join_requests or []
    if data.email not in join_requests:
        raise HTTPException(status_code=400, detail="No pending request for this email")
    
    # Remove from requests
    join_requests = [email for email in join_requests if email != data.email]
    board.join_requests = join_requests
    
    # Add to members
    members = board.members or []
    if data.email not in members:
        members.append(data.email)
        board.members = members
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(board, "join_requests")
    flag_modified(board, "members")
    db.commit()
    
    return {"status": "approved", "members": board.members}

@trello_router.post("/board/{board_id}/reject")
def reject_join_request(board_id: str, data: JoinRequestSchema, db: Session = Depends(get_db)):
    """Reject a join request — removes user from joinRequests."""
    board = db.query(TrelloBoard).filter(TrelloBoard.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    join_requests = board.join_requests or []
    if data.email not in join_requests:
        raise HTTPException(status_code=400, detail="No pending request for this email")
    
    # Remove from requests
    join_requests = [email for email in join_requests if email != data.email]
    board.join_requests = join_requests
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(board, "join_requests")
    db.commit()
    
    return {"status": "rejected", "joinRequests": board.join_requests}

@trello_router.post("/board/{board_id}/add-member")
def add_member(board_id: str, data: JoinRequestSchema, db: Session = Depends(get_db)):
    """Add a member directly to a board (invitation)."""
    board = db.query(TrelloBoard).filter(TrelloBoard.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    members = board.members or []
    if data.email in members:
        return {"status": "already_member", "members": members}
        
    members.append(data.email)
    board.members = members
    
    # Also remove from join requests if present
    join_requests = board.join_requests or []
    if data.email in join_requests:
        join_requests = [e for e in join_requests if e != data.email]
        board.join_requests = join_requests
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(board, "join_requests")

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(board, "members")
    db.commit()
    
    return {"status": "added", "members": board.members}

@trello_router.post("/board/{board_id}/remove-member")
def remove_member(board_id: str, data: JoinRequestSchema, db: Session = Depends(get_db)):
    """Remove a member from a board."""
    board = db.query(TrelloBoard).filter(TrelloBoard.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    members = board.members or []
    if data.email not in members:
        return {"status": "not_member", "members": members}
        
    members = [e for e in members if e != data.email]
    board.members = members
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(board, "members")
    db.commit()
    
    return {"status": "removed", "members": board.members}

@trello_router.delete("/board/{board_id}")
def delete_board(board_id: str, db: Session = Depends(get_db)):
    """Delete a board and its associated columns and cards."""
    board = db.query(TrelloBoard).filter(TrelloBoard.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Delete columns and cards first (cascading normally, but explicit is fine)
    db.query(TrelloColumn).filter(TrelloColumn.board_id == board_id).delete(synchronize_session=False)
    db.query(TrelloCard).filter(TrelloCard.board_id == board_id).delete(synchronize_session=False)
    
    db.delete(board)
    db.commit()
    
    return {"status": "deleted", "board_id": board_id}
