from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String, unique=True, index=True, nullable=False)
    course_name = Column(String, nullable=False)
    course_credits = Column(Integer, default=3)
    crn_code = Column(Integer, unique=True, index=True)
    semester_name = Column(String, nullable=False)
    campus_name = Column(String, nullable=False)
    total_enrollments = Column(Integer, default=0)
    active_students = Column(Integer, default=0)
    completion_rate = Column(Float, default=0.0)
    average_rating = Column(Float, default=0.0)
    revenue = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    assignments = relationship("CourseAssignment", back_populates="course")
    analytics_data = relationship("AnalyticsData", back_populates="course")

class CourseAssignment(Base):
    __tablename__ = "course_assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    assigned_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="course_assignments")
    course = relationship("Course", back_populates="assignments")

class CourseCreate:
    def __init__(self, course_code: str, course_name: str, course_credits: int, 
                 crn_code: int, semester_name: str, campus_name: str):
        self.course_code = course_code
        self.course_name = course_name
        self.course_credits = course_credits
        self.crn_code = crn_code
        self.semester_name = semester_name
        self.campus_name = campus_name

class CourseResponse:
    def __init__(self, id: int, course_code: str, course_name: str, course_credits: int,
                 crn_code: int, semester_name: str, campus_name: str, total_enrollments: int,
                 active_students: int, completion_rate: float, average_rating: float, revenue: float):
        self.id = id
        self.course_code = course_code
        self.course_name = course_name
        self.course_credits = course_credits
        self.crn_code = crn_code
        self.semester_name = semester_name
        self.campus_name = campus_name
        self.total_enrollments = total_enrollments
        self.active_students = active_students
        self.completion_rate = completion_rate
        self.average_rating = average_rating
        self.revenue = revenue
