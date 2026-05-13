from sqlalchemy import Column, Integer, String, Enum
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class UserStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)  # Nullable for Google OAuth users
    role = Column(String) # Storing as string for simplicity, or use Enum(UserRole)
    status = Column(String, default=UserStatus.APPROVED)  # Default APPROVED for backward compat
    google_id = Column(String, unique=True, index=True, nullable=True)
    picture = Column(String, nullable=True)  # Profile picture URL from Google
    employee_id = Column(String, unique=True, nullable=True)
    registration_number = Column(String, unique=True, nullable=True)
    department = Column(String, nullable=True)
