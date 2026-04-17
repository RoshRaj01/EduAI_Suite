from sqlalchemy import Column, Integer, String, Enum
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # Storing as string for simplicity, or use Enum(UserRole)
    employee_id = Column(String, unique=True, nullable=True)
    registration_number = Column(String, unique=True, nullable=True)
    department = Column(String, nullable=True)
