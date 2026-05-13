from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class UserStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole
    department: Optional[str] = None
    employee_id: Optional[str] = None
    registration_number: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = "EduAI123" # Default password for newly created teachers/students

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    status: Optional[str] = "approved"
    picture: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class GoogleToken(BaseModel):
    """Token returned after Google OAuth login, includes user status."""
    access_token: str
    token_type: str
    status: str  # pending | approved | denied
    user: Optional[dict] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    """Request body for POST /auth/google-login."""
    credential: str  # Google ID token from frontend

class PendingUserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str
    picture: Optional[str] = None
    department: Optional[str] = None

    class Config:
        from_attributes = True

class ApprovalAction(BaseModel):
    """Optional body for deny action."""
    reason: Optional[str] = None
