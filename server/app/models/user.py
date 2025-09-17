from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    INSTRUCTOR = "instructor"

class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True)  # From your dataset
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.INSTRUCTOR)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    department = Column(String, default="Computer Science")
    password_hash = Column(String, nullable=True)  # For authentication
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    course_assignments = relationship("CourseAssignment", back_populates="user")
    analytics_data = relationship("AnalyticsData", back_populates="user")

class UserCreate:
    def __init__(self, name: str, email: str, role: UserRole, department: str = "Computer Science"):
        self.name = name
        self.email = email
        self.role = role
        self.department = department

class UserResponse:
    def __init__(self, id: int, user_id: int, name: str, email: str, role: str, 
                 status: str, department: str, created_at: datetime, last_login: datetime = None):
        self.id = id
        self.user_id = user_id
        self.name = name
        self.email = email
        self.role = role
        self.status = status
        self.department = department
        self.created_at = created_at
        self.last_login = last_login
