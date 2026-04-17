from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

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

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
