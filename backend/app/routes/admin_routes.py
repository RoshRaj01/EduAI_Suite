"""
Admin Approval Routes
Lets admins list pending users and approve/deny them.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserStatus
from app.schemas.user_schema import PendingUserResponse, ApprovalAction
from app.utils.auth import get_admin_user

admin_router = APIRouter(prefix="/admin", tags=["admin"])


@admin_router.get(
    "/pending-approvals",
    response_model=List[PendingUserResponse],
)
def list_pending_approvals(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Return all users whose status is PENDING."""
    pending = (
        db.query(User)
        .filter(User.status == UserStatus.PENDING)
        .order_by(User.id.desc())
        .all()
    )
    return pending


@admin_router.patch("/approve-user/{user_id}")
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Set a user's status to APPROVED."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.status == UserStatus.APPROVED:
        return {"message": "User is already approved", "user_id": user_id}

    user.status = UserStatus.APPROVED
    db.commit()
    return {"message": "User approved successfully", "user_id": user_id}


@admin_router.patch("/deny-user/{user_id}")
def deny_user(
    user_id: int,
    body: ApprovalAction = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Set a user's status to DENIED."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = UserStatus.DENIED
    db.commit()
    return {
        "message": "User denied",
        "user_id": user_id,
        "reason": body.reason if body else None,
    }
