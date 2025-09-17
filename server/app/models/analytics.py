from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class AnalyticsData(Base):
    __tablename__ = "analytics_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    metric_type = Column(String, nullable=False)  # 'enrollment', 'completion', 'performance', etc.
    metric_value = Column(Float, nullable=False)
    metric_date = Column(DateTime, default=datetime.utcnow)
    additional_data = Column(Text, nullable=True)  # JSON string for extra data
    
    # Relationships
    user = relationship("User", back_populates="analytics_data")
    course = relationship("Course", back_populates="analytics_data")

class PerformanceMetrics(Base):
    __tablename__ = "performance_metrics"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    semester = Column(String, nullable=False)
    campus = Column(String, nullable=False)
    total_students = Column(Integer, default=0)
    passed_students = Column(Integer, default=0)
    failed_students = Column(Integer, default=0)
    average_grade = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)
    dropout_rate = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class StudentEngagement(Base):
    __tablename__ = "student_engagement"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    student_id = Column(String, nullable=False)  # External student ID
    engagement_score = Column(Float, default=0.0)
    login_frequency = Column(Integer, default=0)
    assignment_submissions = Column(Integer, default=0)
    quiz_attempts = Column(Integer, default=0)
    forum_participation = Column(Integer, default=0)
    last_activity = Column(DateTime, default=datetime.utcnow)

class AnalyticsResponse:
    def __init__(self, total_students: int, total_courses: int, total_instructors: int,
                 overall_completion_rate: float, average_performance: float, 
                 campus_breakdown: dict, semester_breakdown: dict):
        self.total_students = total_students
        self.total_courses = total_courses
        self.total_instructors = total_instructors
        self.overall_completion_rate = overall_completion_rate
        self.average_performance = average_performance
        self.campus_breakdown = campus_breakdown
        self.semester_breakdown = semester_breakdown
