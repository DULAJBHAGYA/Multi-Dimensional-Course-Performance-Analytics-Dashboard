from fastapi import APIRouter, Depends, HTTPException, Query
from app.firebase_config import get_firestore_client
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
    id: str
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
async def get_instructor_dashboard_firestore(
    current_user: dict = Depends(verify_token)
):
    """Get instructor dashboard data from Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get instructor data from Firestore
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        instructor_doc = db.collection('instructors').document(instructor_id).get()
        if not instructor_doc.exists:
            raise HTTPException(status_code=404, detail="Instructor not found")
        
        instructor_data = instructor_doc.to_dict()
        
        # Get sections assigned to this instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Get courses for these sections
        course_ids = list(set([section.get('courseId') for section in instructor_sections if section.get('courseId')]))
        courses_data = []
        
        for course_id in course_ids:
            if course_id:
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict()
                    course_data['id'] = course_id
                    courses_data.append(course_data)
        
        # Calculate KPIs
        total_students = sum(course.get('students', 0) for course in courses_data)
        active_courses = len(courses_data)
        avg_performance = sum(course.get('completion_rate', 0) for course in courses_data) / len(courses_data) if courses_data else 0
        completion_rate = avg_performance
        total_revenue = sum(course.get('revenue', 0) for course in courses_data)
        monthly_growth = 12.5  # Mock growth percentage
        at_risk_students = int(total_students * 0.15)  # 15% at risk
        pending_assignments = len(courses_data) * 3  # Mock pending assignments
        
        # Prepare detailed course data
        courses_response = [
            CourseData(
                id=course.get('id', ''),
                name=course.get('courseName', 'Unknown Course'),
                students=course.get('students', 0),
                performance=course.get('completion_rate', 0),
                status="active",
                last_activity="2 hours ago",
                upcoming_deadlines=2,
                average_rating=course.get('average_rating', 0)
            ) for course in courses_data
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
                course=courses_data[0].get('courseName', 'Mathematics 101') if courses_data else "Mathematics 101", 
                student="John Doe", 
                time="2 hours ago",
                details="Assignment 3 submitted",
                score=None
            ),
            RecentActivityData(
                type="grade", 
                course=courses_data[1].get('courseName', 'Physics 201') if len(courses_data) > 1 else "Physics 201", 
                student="Jane Smith", 
                time="4 hours ago",
                details="Quiz 2 graded",
                score=95.0
            ),
            RecentActivityData(
                type="announcement", 
                course=courses_data[0].get('courseName', 'Chemistry 101') if courses_data else "Chemistry 101", 
                student="", 
                time="6 hours ago",
                details="Midterm exam scheduled for next week"
            ),
            RecentActivityData(
                type="submission", 
                course=courses_data[1].get('courseName', 'Biology 201') if len(courses_data) > 1 else "Biology 201", 
                student="Mike Johnson", 
                time="1 day ago",
                details="Lab report submitted",
                score=None
            )
        ]
        
        # Upcoming events
        upcoming_events = [
            {
                "title": f"{courses_data[0].get('courseName', 'Mathematics 101')} - Midterm Exam",
                "date": "2024-01-15",
                "time": "10:00 AM",
                "type": "exam",
                "course": courses_data[0].get('courseName', 'Mathematics 101') if courses_data else "Mathematics 101"
            },
            {
                "title": f"{courses_data[1].get('courseName', 'Physics 201')} - Assignment Due",
                "date": "2024-01-18",
                "time": "11:59 PM",
                "type": "assignment",
                "course": courses_data[1].get('courseName', 'Physics 201') if len(courses_data) > 1 else "Physics 201"
            },
            {
                "title": f"{courses_data[0].get('courseName', 'Chemistry 101')} - Lab Report",
                "date": "2024-01-20",
                "time": "5:00 PM",
                "type": "assignment",
                "course": courses_data[0].get('courseName', 'Chemistry 101') if courses_data else "Chemistry 101"
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
            courses=courses_response,
            performance_trend=performance_trend,
            recent_activity=recent_activity,
            upcoming_events=upcoming_events,
            quick_stats=quick_stats
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor dashboard: {str(e)}")

@router.get("/admin", response_model=Dict[str, Any])
async def get_admin_dashboard_firestore(
    current_user: dict = Depends(verify_token)
):
    """Get admin dashboard data from Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get admin data from Firestore
        admin_id = current_user.get('adminId')
        if not admin_id:
            raise HTTPException(status_code=400, detail="Admin ID not found")
        
        admin_doc = db.collection('admins').document(admin_id).get()
        if not admin_doc.exists:
            raise HTTPException(status_code=404, detail="Admin not found")
        
        admin_data = admin_doc.to_dict()
        
        # Get all courses
        courses_query = db.collection('courses').stream()
        all_courses = [course.to_dict() for course in courses_query]
        
        # Get all instructors
        instructors_query = db.collection('instructors').stream()
        all_instructors = [instructor.to_dict() for instructor in instructors_query]
        
        # Get all students
        students_query = db.collection('students').stream()
        all_students = [student.to_dict() for student in students_query]
        
        # Get all campuses
        campuses_query = db.collection('campuses').stream()
        all_campuses = [campus.to_dict() for campus in campuses_query]
        
        # Calculate system-wide KPIs
        total_students = len(all_students)
        total_courses = len(all_courses)
        total_instructors = len(all_instructors)
        overall_completion_rate = sum(course.get('completion_rate', 0) for course in all_courses) / len(all_courses) if all_courses else 0
        at_risk_students = int(total_students * 0.12)  # 12% at risk
        
        # Campus breakdown
        campus_breakdown = {}
        for campus in all_campuses:
            campus_name = campus.get('campusName', 'Unknown')
            campus_breakdown[campus_name] = {
                "total_courses": 0,
                "total_students": 0,
                "average_performance": 0,
                "total_instructors": 0
            }
        
        # Count courses and instructors per campus
        for course in all_courses:
            # This is simplified - in reality you'd need to join with sections to get campus info
            campus_name = "Dubai"  # Default campus
            campus_breakdown[campus_name]["total_courses"] += 1
            campus_breakdown[campus_name]["total_students"] += course.get('students', 0)
            campus_breakdown[campus_name]["average_performance"] += course.get('completion_rate', 0)
        
        for instructor in all_instructors:
            campus_name = instructor.get('campus', 'Dubai')
            if campus_name in campus_breakdown:
                campus_breakdown[campus_name]["total_instructors"] += 1
        
        # Calculate average performance per campus
        for campus in campus_breakdown:
            if campus_breakdown[campus]["total_courses"] > 0:
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
                "total_campuses": len(all_campuses),
                "active_semesters": 18  # From your semesters collection
            },
            "campus_breakdown": campus_breakdown,
            "course_distribution": [
                {
                    "course_type": course.get('courseName', 'Unknown'),
                    "average_performance": course.get('completion_rate', 0),
                    "total_courses": 1,
                    "students": course.get('students', 0)
                } for course in all_courses[:10]  # Limit to first 10 for performance
            ],
            "campus_performance": [
                {
                    "campus": campus,
                    "pass_rate": data["average_performance"],
                    "students": data["total_students"],
                    "courses": data["total_courses"],
                    "instructors": data["total_instructors"]
                } for campus, data in campus_breakdown.items()
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching admin dashboard: {str(e)}")

@router.get("/instructor/courses")
async def get_instructor_courses_firestore(
    current_user: dict = Depends(verify_token)
):
    """Get all courses assigned to the current instructor from Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get sections assigned to this instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Get courses for these sections
        course_ids = list(set([section.get('courseId') for section in instructor_sections if section.get('courseId')]))
        courses_data = []
        
        for course_id in course_ids:
            if course_id:
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict()
                    course_data['id'] = course_id
                    courses_data.append(course_data)
        
        return [
            {
                "id": course.get('id', ''),
                "course_code": course.get('courseCode', ''),
                "course_name": course.get('courseName', ''),
                "course_type": course.get('courseType', ''),
                "students": course.get('students', 0),
                "completion_rate": course.get('completion_rate', 0),
                "average_rating": course.get('average_rating', 0),
                "revenue": course.get('revenue', 0),
                "created_at": datetime.utcnow().isoformat()
            } for course in courses_data
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor courses: {str(e)}")

@router.get("/instructor/students")
async def get_instructor_students_firestore(
    course_id: Optional[str] = Query(None),
    current_user: dict = Depends(verify_token)
):
    """Get students enrolled in instructor's courses from Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get sections assigned to this instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Get students from performance data
        students_query = db.collection('students').limit(100).stream()  # Limit for performance
        students_data = [student.to_dict() for student in students_query]
        
        # Mock student data with some real data from Firestore
        students_response = []
        for i, student in enumerate(students_data[:50]):  # Limit to 50 students
            students_response.append({
                "id": student.get('studentId', f'S{i+1:03d}'),
                "name": student.get('studentName', f'Student {i+1}'),
                "email": f"student{i+1}@hct.ac.ae",
                "course": "Mathematics 101",  # Mock course name
                "enrollment_date": "2024-01-10",
                "progress": 85.5 + (i % 20),  # Mock progress
                "last_activity": "2 hours ago",
                "assignments_submitted": 8,
                "average_grade": 87.2 + (i % 15),
                "status": "active" if i % 10 != 0 else "at_risk"
            })
        
        if course_id:
            # Filter by course if specified
            students_response = [s for s in students_response if course_id in ['1', '2', '3']]
        
        return students_response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor students: {str(e)}")

@router.get("/instructor/assignments")
async def get_instructor_assignments_firestore(
    course_id: Optional[str] = Query(None),
    current_user: dict = Depends(verify_token)
):
    """Get assignments for instructor's courses from Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Mock assignment data (in real app, you'd have an assignments collection)
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
            assignments = [a for a in assignments if course_id in ['1', '2', '3']]
        
        return assignments
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor assignments: {str(e)}")

@router.get("/instructor/announcements")
async def get_instructor_announcements_firestore(
    current_user: dict = Depends(verify_token)
):
    """Get announcements created by instructor from Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Mock announcement data (in real app, you'd have an announcements collection)
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
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor announcements: {str(e)}")