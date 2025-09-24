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
    engagement_metrics: Dict[str, Any]
    attendance_data: List[Dict[str, Any]]
    grade_distribution: List[Dict[str, Any]]
    time_spent_analysis: List[Dict[str, Any]]
    discussion_forum_stats: Dict[str, Any]

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
    performance_predictions: List[Dict[str, Any]]
    resource_utilization_forecast: List[Dict[str, Any]]
    intervention_recommendations: List[Dict[str, Any]]
    success_probability: Dict[str, Any]

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
    
    # Additional comprehensive analytics data
    engagement_metrics = {
        "daily_active_users": 45,
        "weekly_active_users": 156,
        "average_session_duration": 32.5,  # minutes
        "page_views_per_session": 8.7,
        "bounce_rate": 12.3,
        "return_visitor_rate": 78.9
    }
    
    attendance_data = [
        {"week": "Week 1", "attendance_rate": 95.2, "total_students": 45},
        {"week": "Week 2", "attendance_rate": 92.8, "total_students": 44},
        {"week": "Week 3", "attendance_rate": 89.5, "total_students": 43},
        {"week": "Week 4", "attendance_rate": 87.3, "total_students": 42},
        {"week": "Week 5", "attendance_rate": 91.1, "total_students": 41},
        {"week": "Week 6", "attendance_rate": 88.7, "total_students": 40}
    ]
    
    grade_distribution = [
        {"grade_range": "90-100", "count": 12, "percentage": 30.0},
        {"grade_range": "80-89", "count": 15, "percentage": 37.5},
        {"grade_range": "70-79", "count": 8, "percentage": 20.0},
        {"grade_range": "60-69", "count": 4, "percentage": 10.0},
        {"grade_range": "Below 60", "count": 1, "percentage": 2.5}
    ]
    
    time_spent_analysis = [
        {"lesson": "Introduction", "avg_time": 45, "completion_rate": 95},
        {"lesson": "Module 1", "avg_time": 120, "completion_rate": 87},
        {"lesson": "Module 2", "avg_time": 95, "completion_rate": 78},
        {"lesson": "Module 3", "avg_time": 150, "completion_rate": 65},
        {"lesson": "Final Project", "avg_time": 300, "completion_rate": 45}
    ]
    
    discussion_forum_stats = {
        "total_posts": 234,
        "total_replies": 567,
        "active_discussions": 23,
        "instructor_participation": 89.2,
        "average_response_time": 4.5,  # hours
        "most_active_topic": "Assignment Help"
    }
    
    return CourseAnalyticsResponse(
        kpis={
            "total_enrollments": total_enrollments,
            "active_students": active_students,
            "completion_rate": round(completion_rate, 1),
            "average_progress": round(completion_rate, 1),
            "average_rating": round(average_rating, 1),
            "revenue": revenue,
            "engagement_score": 87.5,
            "satisfaction_score": 4.2
        },
        enrollment_trend=enrollment_trend,
        progress_distribution=progress_distribution,
        drop_off_points=drop_off_points,
        ratings_breakdown=ratings_breakdown,
        most_viewed_lessons=most_viewed_lessons,
        least_viewed_lessons=least_viewed_lessons,
        recent_reviews=recent_reviews,
        engagement_metrics=engagement_metrics,
        attendance_data=attendance_data,
        grade_distribution=grade_distribution,
        time_spent_analysis=time_spent_analysis,
        discussion_forum_stats=discussion_forum_stats
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
    
    # Additional predictive analytics data
    performance_predictions = [
        {"student_id": "S001", "predicted_final_grade": 78.5, "confidence": 0.85, "key_factors": ["attendance", "assignment_submission"]},
        {"student_id": "S002", "predicted_final_grade": 92.3, "confidence": 0.92, "key_factors": ["engagement", "quiz_performance"]},
        {"student_id": "S003", "predicted_final_grade": 65.2, "confidence": 0.78, "key_factors": ["participation", "assignment_quality"]}
    ]
    
    resource_utilization_forecast = [
        {"resource": "Video Lectures", "current_usage": 85, "predicted_peak": 95, "recommended_capacity": 100},
        {"resource": "Discussion Forums", "current_usage": 67, "predicted_peak": 78, "recommended_capacity": 80},
        {"resource": "Assignment Submissions", "current_usage": 92, "predicted_peak": 98, "recommended_capacity": 100}
    ]
    
    intervention_recommendations = [
        {"student_id": "S001", "intervention_type": "tutoring", "urgency": "high", "expected_impact": 0.15},
        {"student_id": "S003", "intervention_type": "study_group", "urgency": "medium", "expected_impact": 0.08},
        {"student_id": "S002", "intervention_type": "advanced_materials", "urgency": "low", "expected_impact": 0.05}
    ]
    
    success_probability = {
        "course_completion": 0.82,
        "student_satisfaction": 0.89,
        "instructor_rating": 0.91,
        "revenue_target": 0.76,
        "retention_rate": 0.85
    }
    
    return PredictiveAnalyticsResponse(
        predicted_completion_rate=predicted_completion_rate,
        predicted_dropout_rate=predicted_dropout_rate,
        future_enrollment_forecast=future_enrollment_forecast,
        at_risk_students=at_risk_students,
        engagement_scores=engagement_scores,
        predicted_engaging_lessons=predicted_engaging_lessons,
        predicted_drop_off_points=predicted_drop_off_points,
        content_improvement_suggestions=content_improvement_suggestions,
        ai_recommendations=ai_recommendations,
        performance_predictions=performance_predictions,
        resource_utilization_forecast=resource_utilization_forecast,
        intervention_recommendations=intervention_recommendations,
        success_probability=success_probability
    )

@router.get("/reports")
async def get_report_data(
    course_id: Optional[str] = Query(None),
    date_range: str = Query("30d"),
    report_type: str = Query("performance"),
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Enhanced report data generation
    report_id = f"RPT_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    
    # Generate comprehensive report based on type
    if report_type == "performance":
        return {
            "report_id": report_id,
            "generated_at": datetime.utcnow().isoformat(),
            "course_id": course_id,
            "date_range": date_range,
            "report_type": report_type,
            "summary": {
                "total_students": 156,
                "completion_rate": 78.5,
                "average_grade": 85.2,
                "active_students": 134,
                "at_risk_students": 12,
                "top_performers": 23,
                "improvement_areas": ["Module 3", "Final Project"]
            },
            "data": {
                "student_performance": [
                    {"student_id": "S001", "name": "John Doe", "grade": 88, "status": "completed", "trend": "improving"},
                    {"student_id": "S002", "name": "Jane Smith", "grade": 92, "status": "completed", "trend": "stable"},
                    {"student_id": "S003", "name": "Mike Johnson", "grade": 76, "status": "in_progress", "trend": "declining"}
                ],
                "engagement_metrics": {
                    "daily_logins": 45,
                    "average_session_time": 25.5,
                    "quiz_attempts": 234,
                    "forum_posts": 67,
                    "assignment_submissions": 189,
                    "video_watch_time": 156.7
                },
                "grade_distribution": [
                    {"range": "90-100", "count": 23, "percentage": 14.7},
                    {"range": "80-89", "count": 45, "percentage": 28.8},
                    {"range": "70-79", "count": 52, "percentage": 33.3},
                    {"range": "60-69", "count": 28, "percentage": 17.9},
                    {"range": "Below 60", "count": 8, "percentage": 5.1}
                ]
            }
        }
    elif report_type == "engagement":
        return {
            "report_id": report_id,
            "generated_at": datetime.utcnow().isoformat(),
            "course_id": course_id,
            "date_range": date_range,
            "report_type": report_type,
            "summary": {
                "total_engagement_score": 87.3,
                "most_engaged_students": 34,
                "least_engaged_students": 12,
                "average_participation": 78.5
            },
            "data": {
                "engagement_breakdown": [
                    {"activity": "Video Lectures", "engagement_rate": 89.2, "time_spent": 45.6},
                    {"activity": "Discussions", "engagement_rate": 67.8, "time_spent": 12.3},
                    {"activity": "Assignments", "engagement_rate": 92.1, "time_spent": 23.7},
                    {"activity": "Quizzes", "engagement_rate": 85.4, "time_spent": 8.9}
                ],
                "participation_trends": [
                    {"week": "Week 1", "participation": 95.2},
                    {"week": "Week 2", "participation": 92.8},
                    {"week": "Week 3", "participation": 89.5},
                    {"week": "Week 4", "participation": 87.3}
                ]
            }
        }
    else:  # financial report
        return {
            "report_id": report_id,
            "generated_at": datetime.utcnow().isoformat(),
            "course_id": course_id,
            "date_range": date_range,
            "report_type": report_type,
            "summary": {
                "total_revenue": 45600.00,
                "enrollment_fee": 300.00,
                "total_enrollments": 152,
                "revenue_growth": 12.5,
                "projected_revenue": 51200.00
            },
            "data": {
                "revenue_breakdown": [
                    {"source": "Course Fees", "amount": 45600.00, "percentage": 100.0},
                    {"source": "Certificates", "amount": 0.00, "percentage": 0.0},
                    {"source": "Materials", "amount": 0.00, "percentage": 0.0}
                ],
                "monthly_revenue": [
                    {"month": "Jan", "revenue": 12500.00, "enrollments": 42},
                    {"month": "Feb", "revenue": 15200.00, "enrollments": 51},
                    {"month": "Mar", "revenue": 17900.00, "enrollments": 59}
                ]
            }
        }
