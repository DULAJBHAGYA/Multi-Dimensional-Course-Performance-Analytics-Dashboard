from fastapi import APIRouter, Depends, HTTPException, Query
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

class CourseAnalyticsResponse(BaseModel):
    kpis: Dict[str, Any]
    enrollment_trend: List[Dict[str, Any]]
    progress_distribution: List[Dict[str, Any]]
    drop_off_points: List[Dict[str, Any]]
    ratings_breakdown: List[Dict[str, Any]]
    most_viewed_lessons: List[Dict[str, Any]]
    least_viewed_lessons: List[Dict[str, Any]]
    recent_reviews: List[Dict[str, Any]]

class PredictiveAnalyticsResponse(BaseModel):
    predicted_completion_rate: float
    predicted_dropout_rate: float
    future_enrollment_forecast: List[Dict[str, Any]]
    at_risk_students: List[Dict[str, Any]]
    engagement_scores: List[Dict[str, Any]]
    predicted_engaging_lessons: List[Dict[str, Any]]
    predicted_drop_off_points: List[Dict[str, Any]]
    content_improvement_suggestions: List[Dict[str, Any]]
    ai_recommendations: List[Dict[str, Any]]

@router.get("/course", response_model=CourseAnalyticsResponse)
async def get_course_analytics(
    course_id: Optional[str] = Query(None, description="Course ID to filter by"),
    date_range: str = Query("30d", description="Date range filter"),
    cohort: str = Query("all", description="Student cohort filter"),
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Get courses based on user role
    if current_user.role == UserRole.INSTRUCTOR:
        courses = db.query(Course).join(Course.course_assignments).filter(
            Course.course_assignments.any(user_id=current_user.id)
        ).all()
    else:
        courses = db.query(Course).all()
    
    if course_id and course_id != "all":
        courses = [c for c in courses if c.course_code.lower() == course_id.lower()]
    
    if not courses:
        raise HTTPException(status_code=404, detail="No courses found")
    
    # Calculate KPIs
    total_enrollments = sum(course.total_enrollments for course in courses)
    active_students = sum(course.active_students for course in courses)
    completion_rate = sum(course.completion_rate for course in courses) / len(courses)
    average_rating = sum(course.average_rating for course in courses) / len(courses)
    revenue = sum(course.revenue for course in courses)
    
    # Mock data for charts (in real app, this would come from analytics tables)
    enrollment_trend = [
        {"month": "Jan", "enrollments": 45},
        {"month": "Feb", "enrollments": 67},
        {"month": "Mar", "enrollments": 89},
        {"month": "Apr", "enrollments": 123},
        {"month": "May", "enrollments": 156},
        {"month": "Jun", "enrollments": 134}
    ]
    
    progress_distribution = [
        {"range": "0-20%", "students": 5, "percentage": 18.5},
        {"range": "21-40%", "students": 8, "percentage": 29.6},
        {"range": "41-60%", "students": 7, "percentage": 25.9},
        {"range": "61-80%", "students": 4, "percentage": 14.8},
        {"range": "81-100%", "students": 3, "percentage": 11.1}
    ]
    
    drop_off_points = [
        {"lesson": "Introduction", "completion_rate": 95, "drop_off": 5},
        {"lesson": "Module 1", "completion_rate": 87, "drop_off": 8},
        {"lesson": "Module 2", "completion_rate": 78, "drop_off": 9},
        {"lesson": "Module 3", "completion_rate": 65, "drop_off": 13},
        {"lesson": "Final Project", "completion_rate": 45, "drop_off": 20}
    ]
    
    ratings_breakdown = [
        {"stars": 5, "count": 45, "percentage": 60.0},
        {"stars": 4, "count": 20, "percentage": 26.7},
        {"stars": 3, "count": 7, "percentage": 9.3},
        {"stars": 2, "count": 2, "percentage": 2.7},
        {"stars": 1, "count": 1, "percentage": 1.3}
    ]
    
    most_viewed_lessons = [
        {"lesson": "Introduction to Programming", "views": 156, "completion_rate": 95},
        {"lesson": "Data Structures", "views": 142, "completion_rate": 87},
        {"lesson": "Algorithms", "views": 138, "completion_rate": 78}
    ]
    
    least_viewed_lessons = [
        {"lesson": "Advanced Topics", "views": 45, "completion_rate": 65},
        {"lesson": "Case Studies", "views": 52, "completion_rate": 70},
        {"lesson": "Final Review", "views": 38, "completion_rate": 60}
    ]
    
    recent_reviews = [
        {"student": "John Doe", "rating": 5, "comment": "Excellent course!", "date": "2 days ago"},
        {"student": "Jane Smith", "rating": 4, "comment": "Very informative", "date": "3 days ago"},
        {"student": "Mike Johnson", "rating": 5, "comment": "Great instructor", "date": "5 days ago"}
    ]
    
    return CourseAnalyticsResponse(
        kpis={
            "total_enrollments": total_enrollments,
            "active_students": active_students,
            "completion_rate": round(completion_rate, 1),
            "average_progress": round(completion_rate, 1),
            "average_rating": round(average_rating, 1),
            "revenue": revenue
        },
        enrollment_trend=enrollment_trend,
        progress_distribution=progress_distribution,
        drop_off_points=drop_off_points,
        ratings_breakdown=ratings_breakdown,
        most_viewed_lessons=most_viewed_lessons,
        least_viewed_lessons=least_viewed_lessons,
        recent_reviews=recent_reviews
    )

@router.get("/predictive", response_model=PredictiveAnalyticsResponse)
async def get_predictive_analytics(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Mock predictive analytics data
    # In a real application, this would use ML models to generate predictions
    
    predicted_completion_rate = 82.5
    predicted_dropout_rate = 17.5
    
    future_enrollment_forecast = [
        {"month": "Jul", "predicted_enrollments": 145},
        {"month": "Aug", "predicted_enrollments": 167},
        {"month": "Sep", "predicted_enrollments": 189},
        {"month": "Oct", "predicted_enrollments": 201},
        {"month": "Nov", "predicted_enrollments": 178},
        {"month": "Dec", "predicted_enrollments": 156}
    ]
    
    at_risk_students = [
        {"student_id": "S001", "name": "John Doe", "risk_score": 0.85, "reasons": ["Low engagement", "Missing assignments"]},
        {"student_id": "S002", "name": "Jane Smith", "risk_score": 0.72, "reasons": ["Poor quiz performance"]},
        {"student_id": "S003", "name": "Mike Johnson", "risk_score": 0.68, "reasons": ["Infrequent logins"]}
    ]
    
    engagement_scores = [
        {"student_id": "S001", "name": "John Doe", "score": 45},
        {"student_id": "S002", "name": "Jane Smith", "score": 78},
        {"student_id": "S003", "name": "Mike Johnson", "score": 62}
    ]
    
    predicted_engaging_lessons = [
        {"lesson": "Interactive Coding", "predicted_engagement": 92, "confidence": 0.87},
        {"lesson": "Real-world Projects", "predicted_engagement": 88, "confidence": 0.82},
        {"lesson": "Peer Collaboration", "predicted_engagement": 85, "confidence": 0.79}
    ]
    
    predicted_drop_off_points = [
        {"lesson": "Advanced Algorithms", "predicted_drop_off": 25, "confidence": 0.91},
        {"lesson": "Complex Data Structures", "predicted_drop_off": 18, "confidence": 0.85},
        {"lesson": "Final Project", "predicted_drop_off": 15, "confidence": 0.78}
    ]
    
    content_improvement_suggestions = [
        {"area": "Module 3", "suggestion": "Add more visual examples", "priority": "High"},
        {"area": "Quiz Format", "suggestion": "Include interactive elements", "priority": "Medium"},
        {"area": "Assignment Instructions", "suggestion": "Provide clearer guidelines", "priority": "Low"}
    ]
    
    ai_recommendations = [
        {"type": "tip", "message": "Consider adding more interactive elements to Module 2", "priority": "high"},
        {"type": "alert", "message": "3 students are at risk of dropping out", "priority": "urgent"},
        {"type": "suggestion", "message": "Schedule additional office hours for struggling students", "priority": "medium"}
    ]
    
    return PredictiveAnalyticsResponse(
        predicted_completion_rate=predicted_completion_rate,
        predicted_dropout_rate=predicted_dropout_rate,
        future_enrollment_forecast=future_enrollment_forecast,
        at_risk_students=at_risk_students,
        engagement_scores=engagement_scores,
        predicted_engaging_lessons=predicted_engaging_lessons,
        predicted_drop_off_points=predicted_drop_off_points,
        content_improvement_suggestions=content_improvement_suggestions,
        ai_recommendations=ai_recommendations
    )

@router.get("/reports")
async def get_report_data(
    course_id: Optional[str] = Query(None),
    date_range: str = Query("30d"),
    report_type: str = Query("performance"),
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Mock report data generation
    return {
        "report_id": "RPT_001",
        "generated_at": datetime.utcnow().isoformat(),
        "course_id": course_id,
        "date_range": date_range,
        "report_type": report_type,
        "summary": {
            "total_students": 156,
            "completion_rate": 78.5,
            "average_grade": 85.2,
            "active_students": 134
        },
        "data": {
            "student_performance": [
                {"student_id": "S001", "name": "John Doe", "grade": 88, "status": "completed"},
                {"student_id": "S002", "name": "Jane Smith", "grade": 92, "status": "completed"},
                {"student_id": "S003", "name": "Mike Johnson", "grade": 76, "status": "in_progress"}
            ],
            "engagement_metrics": {
                "daily_logins": 45,
                "average_session_time": 25.5,
                "quiz_attempts": 234,
                "forum_posts": 67
            }
        }
    }
