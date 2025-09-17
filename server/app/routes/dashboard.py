from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.analytics import AnalyticsData, PerformanceMetrics
from app.routes.auth import verify_token
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta

router = APIRouter()

class KPIData(BaseModel):
    total_students: int
    active_courses: int
    avg_performance: float
    completion_rate: float

class CourseData(BaseModel):
    name: str
    students: int
    performance: float
    status: str

class DashboardResponse(BaseModel):
    kpis: KPIData
    courses: List[CourseData]
    performance_trend: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]

@router.get("/instructor", response_model=DashboardResponse)
async def get_instructor_dashboard(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.INSTRUCTOR:
        raise HTTPException(status_code=403, detail="Access denied. Instructor role required.")
    
    # Get courses assigned to this instructor
    instructor_courses = db.query(Course).join(Course.course_assignments).filter(
        Course.course_assignments.any(user_id=current_user.id)
    ).all()
    
    if not instructor_courses:
        # Return empty dashboard if no courses assigned
        return DashboardResponse(
            kpis=KPIData(total_students=0, active_courses=0, avg_performance=0.0, completion_rate=0.0),
            courses=[],
            performance_trend=[],
            recent_activity=[]
        )
    
    # Calculate KPIs
    total_students = sum(course.total_enrollments for course in instructor_courses)
    active_courses = len(instructor_courses)
    avg_performance = sum(course.completion_rate for course in instructor_courses) / len(instructor_courses)
    completion_rate = avg_performance  # Same as average performance for simplicity
    
    # Prepare course data
    courses_data = [
        CourseData(
            name=course.course_name,
            students=course.total_enrollments,
            performance=course.completion_rate,
            status="active"
        ) for course in instructor_courses
    ]
    
    # Mock performance trend data (in real app, this would come from analytics)
    performance_trend = [
        {"month": "Jan", "performance": 85},
        {"month": "Feb", "performance": 87},
        {"month": "Mar", "performance": 89},
        {"month": "Apr", "performance": 88},
        {"month": "May", "performance": 91},
        {"month": "Jun", "performance": 87}
    ]
    
    # Mock recent activity data
    recent_activity = [
        {"type": "submission", "course": course.course_name, "student": "Student Name", "time": "2 hours ago"}
        for course in instructor_courses[:3]
    ]
    
    return DashboardResponse(
        kpis=KPIData(
            total_students=total_students,
            active_courses=active_courses,
            avg_performance=round(avg_performance, 1),
            completion_rate=round(completion_rate, 1)
        ),
        courses=courses_data,
        performance_trend=performance_trend,
        recent_activity=recent_activity
    )

@router.get("/admin", response_model=Dict[str, Any])
async def get_admin_dashboard(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
    
    # Get all courses and users
    all_courses = db.query(Course).all()
    all_users = db.query(User).all()
    
    # Calculate system-wide KPIs
    total_students = sum(course.total_enrollments for course in all_courses)
    total_courses = len(all_courses)
    total_instructors = len([user for user in all_users if user.role == UserRole.INSTRUCTOR])
    overall_completion_rate = sum(course.completion_rate for course in all_courses) / len(all_courses) if all_courses else 0
    at_risk_students = int(total_students * 0.12)  # 12% at risk
    
    # Campus breakdown
    campus_breakdown = {}
    for course in all_courses:
        campus = course.campus_name
        if campus not in campus_breakdown:
            campus_breakdown[campus] = {
                "total_courses": 0,
                "total_students": 0,
                "average_performance": 0
            }
        campus_breakdown[campus]["total_courses"] += 1
        campus_breakdown[campus]["total_students"] += course.total_enrollments
        campus_breakdown[campus]["average_performance"] += course.completion_rate
    
    # Calculate average performance per campus
    for campus in campus_breakdown:
        campus_breakdown[campus]["average_performance"] = round(
            campus_breakdown[campus]["average_performance"] / campus_breakdown[campus]["total_courses"], 1
        )
    
    return {
        "kpis": {
            "total_students": total_students,
            "total_courses": total_courses,
            "total_instructors": total_instructors,
            "overall_completion_rate": round(overall_completion_rate, 1),
            "at_risk_students": at_risk_students,
            "total_campuses": len(campus_breakdown),
            "active_semesters": len(set(course.semester_name for course in all_courses))
        },
        "campus_breakdown": campus_breakdown,
        "course_distribution": [
            {
                "course_type": course.course_name,
                "average_performance": course.completion_rate,
                "total_courses": 1,
                "students": course.total_enrollments
            } for course in all_courses
        ],
        "campus_performance": [
            {
                "campus": campus,
                "pass_rate": data["average_performance"],
                "students": data["total_students"],
                "courses": data["total_courses"],
                "instructors": data["total_courses"]  # Simplified
            } for campus, data in campus_breakdown.items()
        ]
    }
