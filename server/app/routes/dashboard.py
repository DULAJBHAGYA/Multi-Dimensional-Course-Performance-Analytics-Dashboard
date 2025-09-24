from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.analytics import AnalyticsData, PerformanceMetrics
from app.routes.auth import verify_token
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

router = APIRouter()

class KPIData(BaseModel):
    total_students: int
    active_courses: int
    avg_performance: float
    completion_rate: float
    total_revenue: float
    monthly_growth: float
    at_risk_students: int
    pending_assignments: int

class CourseData(BaseModel):
    id: int
    name: str
    students: int
    performance: float
    status: str
    last_activity: str
    upcoming_deadlines: int
    average_rating: float

class PerformanceTrendData(BaseModel):
    month: str
    performance: float
    students: int
    assignments: int

class RecentActivityData(BaseModel):
    type: str
    course: str
    student: str
    time: str
    details: Optional[str] = None
    score: Optional[float] = None

class DashboardResponse(BaseModel):
    kpis: KPIData
    courses: List[CourseData]
    performance_trend: List[PerformanceTrendData]
    recent_activity: List[RecentActivityData]
    upcoming_events: List[Dict[str, Any]]
    quick_stats: Dict[str, Any]

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
            kpis=KPIData(
                total_students=0, active_courses=0, avg_performance=0.0, 
                completion_rate=0.0, total_revenue=0.0, monthly_growth=0.0,
                at_risk_students=0, pending_assignments=0
            ),
            courses=[],
            performance_trend=[],
            recent_activity=[],
            upcoming_events=[],
            quick_stats={}
        )
    
    # Calculate comprehensive KPIs
    total_students = sum(course.total_enrollments for course in instructor_courses)
    active_courses = len(instructor_courses)
    avg_performance = sum(course.completion_rate for course in instructor_courses) / len(instructor_courses)
    completion_rate = avg_performance
    total_revenue = sum(course.revenue for course in instructor_courses)
    monthly_growth = 12.5  # Mock growth percentage
    at_risk_students = int(total_students * 0.15)  # 15% at risk
    pending_assignments = len(instructor_courses) * 3  # Mock pending assignments
    
    # Prepare detailed course data
    courses_data = [
        CourseData(
            id=course.id,
            name=course.course_name,
            students=course.total_enrollments,
            performance=course.completion_rate,
            status="active",
            last_activity="2 hours ago",
            upcoming_deadlines=2,
            average_rating=course.average_rating
        ) for course in instructor_courses
    ]
    
    # Enhanced performance trend data
    performance_trend = [
        PerformanceTrendData(month="Jan", performance=85, students=120, assignments=45),
        PerformanceTrendData(month="Feb", performance=87, students=135, assignments=52),
        PerformanceTrendData(month="Mar", performance=89, students=142, assignments=48),
        PerformanceTrendData(month="Apr", performance=88, students=138, assignments=51),
        PerformanceTrendData(month="May", performance=91, students=156, assignments=47),
        PerformanceTrendData(month="Jun", performance=87, students=148, assignments=49)
    ]
    
    # Enhanced recent activity data
    recent_activity = [
        RecentActivityData(
            type="submission", 
            course=instructor_courses[0].course_name if instructor_courses else "Mathematics 101", 
            student="John Doe", 
            time="2 hours ago",
            details="Assignment 3 submitted",
            score=None
        ),
        RecentActivityData(
            type="grade", 
            course=instructor_courses[1].course_name if len(instructor_courses) > 1 else "Physics 201", 
            student="Jane Smith", 
            time="4 hours ago",
            details="Quiz 2 graded",
            score=95.0
        ),
        RecentActivityData(
            type="announcement", 
            course=instructor_courses[0].course_name if instructor_courses else "Chemistry 101", 
            student="", 
            time="6 hours ago",
            details="Midterm exam scheduled for next week"
        ),
        RecentActivityData(
            type="submission", 
            course=instructor_courses[1].course_name if len(instructor_courses) > 1 else "Biology 201", 
            student="Mike Johnson", 
            time="1 day ago",
            details="Lab report submitted",
            score=None
        )
    ]
    
    # Upcoming events
    upcoming_events = [
        {
            "title": "Mathematics 101 - Midterm Exam",
            "date": "2024-01-15",
            "time": "10:00 AM",
            "type": "exam",
            "course": instructor_courses[0].course_name if instructor_courses else "Mathematics 101"
        },
        {
            "title": "Physics 201 - Assignment Due",
            "date": "2024-01-18",
            "time": "11:59 PM",
            "type": "assignment",
            "course": instructor_courses[1].course_name if len(instructor_courses) > 1 else "Physics 201"
        },
        {
            "title": "Chemistry 101 - Lab Report",
            "date": "2024-01-20",
            "time": "5:00 PM",
            "type": "assignment",
            "course": instructor_courses[0].course_name if instructor_courses else "Chemistry 101"
        }
    ]
    
    # Quick stats
    quick_stats = {
        "total_assignments": 156,
        "graded_assignments": 142,
        "pending_grades": 14,
        "student_questions": 23,
        "announcements_sent": 8,
        "office_hours_attended": 45
    }
    
    return DashboardResponse(
        kpis=KPIData(
            total_students=total_students,
            active_courses=active_courses,
            avg_performance=round(avg_performance, 1),
            completion_rate=round(completion_rate, 1),
            total_revenue=round(total_revenue, 2),
            monthly_growth=monthly_growth,
            at_risk_students=at_risk_students,
            pending_assignments=pending_assignments
        ),
        courses=courses_data,
        performance_trend=performance_trend,
        recent_activity=recent_activity,
        upcoming_events=upcoming_events,
        quick_stats=quick_stats
    )

# Additional instructor-specific endpoints

@router.get("/instructor/courses")
async def get_instructor_courses(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get all courses assigned to the current instructor"""
    if current_user.role != UserRole.INSTRUCTOR:
        raise HTTPException(status_code=403, detail="Access denied. Instructor role required.")
    
    instructor_courses = db.query(Course).join(Course.course_assignments).filter(
        Course.course_assignments.any(user_id=current_user.id)
    ).all()
    
    return [
        {
            "id": course.id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "course_credits": course.course_credits,
            "crn_code": course.crn_code,
            "semester_name": course.semester_name,
            "campus_name": course.campus_name,
            "total_enrollments": course.total_enrollments,
            "active_students": course.active_students,
            "completion_rate": course.completion_rate,
            "average_rating": course.average_rating,
            "revenue": course.revenue,
            "created_at": course.created_at.isoformat()
        } for course in instructor_courses
    ]

@router.get("/instructor/assignments")
async def get_instructor_assignments(
    course_id: Optional[int] = None,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get assignments for instructor's courses"""
    if current_user.role != UserRole.INSTRUCTOR:
        raise HTTPException(status_code=403, detail="Access denied. Instructor role required.")
    
    # Mock assignment data
    assignments = [
        {
            "id": 1,
            "title": "Mathematics 101 - Assignment 1",
            "course": "Mathematics 101",
            "due_date": "2024-01-15T23:59:00",
            "total_submissions": 45,
            "graded_submissions": 42,
            "pending_grades": 3,
            "average_score": 87.5,
            "status": "active"
        },
        {
            "id": 2,
            "title": "Physics 201 - Lab Report 2",
            "course": "Physics 201",
            "due_date": "2024-01-18T17:00:00",
            "total_submissions": 38,
            "graded_submissions": 35,
            "pending_grades": 3,
            "average_score": 92.1,
            "status": "active"
        },
        {
            "id": 3,
            "title": "Chemistry 101 - Quiz 3",
            "course": "Chemistry 101",
            "due_date": "2024-01-20T14:30:00",
            "total_submissions": 52,
            "graded_submissions": 52,
            "pending_grades": 0,
            "average_score": 78.9,
            "status": "completed"
        }
    ]
    
    if course_id:
        assignments = [a for a in assignments if course_id in [1, 2, 3]]  # Mock filtering
    
    return assignments

@router.get("/instructor/students")
async def get_instructor_students(
    course_id: Optional[int] = None,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get students enrolled in instructor's courses"""
    if current_user.role != UserRole.INSTRUCTOR:
        raise HTTPException(status_code=403, detail="Access denied. Instructor role required.")
    
    # Mock student data
    students = [
        {
            "id": 1,
            "name": "John Doe",
            "email": "john.doe@university.edu",
            "course": "Mathematics 101",
            "enrollment_date": "2024-01-10",
            "progress": 85.5,
            "last_activity": "2 hours ago",
            "assignments_submitted": 8,
            "average_grade": 87.2,
            "status": "active"
        },
        {
            "id": 2,
            "name": "Jane Smith",
            "email": "jane.smith@university.edu",
            "course": "Physics 201",
            "enrollment_date": "2024-01-08",
            "progress": 92.3,
            "last_activity": "1 day ago",
            "assignments_submitted": 6,
            "average_grade": 94.1,
            "status": "active"
        },
        {
            "id": 3,
            "name": "Mike Johnson",
            "email": "mike.johnson@university.edu",
            "course": "Chemistry 101",
            "enrollment_date": "2024-01-12",
            "progress": 67.8,
            "last_activity": "3 days ago",
            "assignments_submitted": 4,
            "average_grade": 72.5,
            "status": "at_risk"
        }
    ]
    
    if course_id:
        students = [s for s in students if course_id in [1, 2, 3]]  # Mock filtering
    
    return students

@router.get("/instructor/announcements")
async def get_instructor_announcements(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get announcements created by instructor"""
    if current_user.role != UserRole.INSTRUCTOR:
        raise HTTPException(status_code=403, detail="Access denied. Instructor role required.")
    
    # Mock announcement data
    announcements = [
        {
            "id": 1,
            "title": "Midterm Exam Schedule",
            "content": "The midterm exam for Mathematics 101 will be held on January 15th at 10:00 AM in Room 201.",
            "course": "Mathematics 101",
            "created_at": "2024-01-10T09:00:00",
            "priority": "high",
            "read_count": 45,
            "status": "active"
        },
        {
            "id": 2,
            "title": "Assignment Extension",
            "content": "Due to technical issues, Assignment 2 deadline has been extended by 2 days.",
            "course": "Physics 201",
            "created_at": "2024-01-08T14:30:00",
            "priority": "medium",
            "read_count": 38,
            "status": "active"
        },
        {
            "id": 3,
            "title": "Lab Safety Reminder",
            "content": "Please remember to follow all safety protocols during the chemistry lab session.",
            "course": "Chemistry 101",
            "created_at": "2024-01-05T11:15:00",
            "priority": "low",
            "read_count": 52,
            "status": "active"
        }
    ]
    
    return announcements

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
