"""
Admin Approval Routes
Lets admins list pending users and approve/deny them.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import User, UserStatus
from app.schemas.user_schema import PendingUserResponse, ApprovalAction
from app.utils.auth import get_admin_user

admin_router = APIRouter(prefix="/admin", tags=["admin"])


@admin_router.get(
    "/pending-approvals",
    response_model=List[PendingUserResponse],
)
async def list_pending_approvals(
    _admin: User = Depends(get_admin_user),
):
    """Return all users whose status is PENDING."""
    pending = await User.find(User.status == UserStatus.PENDING).sort("-int_id").to_list()
    res = []
    for p in pending:
        d = p.model_dump()
        d["id"] = p.int_id
        res.append(d)
    return res


@admin_router.patch("/approve-user/{user_id}")
async def approve_user(
    user_id: int,
    _admin: User = Depends(get_admin_user),
):
    """Set a user's status to APPROVED."""
    user = await User.find_one(User.int_id == user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.status == UserStatus.APPROVED:
        return {"message": "User is already approved", "user_id": user_id}

    user.status = UserStatus.APPROVED
    await user.save()
    return {"message": "User approved successfully", "user_id": user_id}


from pydantic import BaseModel, EmailStr

class WhitelistStudentRequest(BaseModel):
    email: EmailStr


@admin_router.patch("/deny-user/{user_id}")
async def deny_user(
    user_id: int,
    body: ApprovalAction = None,
    _admin: User = Depends(get_admin_user),
):
    """Set a user's status to DENIED."""
    user = await User.find_one(User.int_id == user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = UserStatus.DENIED
    await user.save()
    return {
        "message": "User denied",
        "user_id": user_id,
        "reason": body.reason if body else None,
    }


@admin_router.post("/whitelist-email")
async def whitelist_email(
    body: WhitelistStudentRequest,
    _admin: User = Depends(get_admin_user),
):
    """Manually add a student email (any domain) that behaves as a new pending student."""
    email = body.email.strip().lower()

    # Check if a user with this email already exists
    existing = await User.find_one(User.email == email)
    if existing:
        if existing.role == "student":
            if existing.status != UserStatus.PENDING:
                existing.status = UserStatus.PENDING
                await existing.save()
            return {"message": "Email is already registered as a student (set to pending)", "user_id": existing.int_id}
        else:
            existing.role = "student"
            existing.status = UserStatus.PENDING
            await existing.save()
            return {"message": "Existing user converted to student (pending approval)", "user_id": existing.int_id}

    # Create a new student user in PENDING status
    new_user = User(
        name=email.split("@")[0].capitalize(),
        email=email,
        role="student",
        status=UserStatus.PENDING,
        hashed_password=None,
    )
    await new_user.assign_id()
    await new_user.insert()

    return {"message": "Email successfully whitelisted as pending student", "user_id": new_user.int_id}
