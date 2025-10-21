from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from app.firebase_config import get_firestore_client
from app.routes.firebase_auth_updated import verify_token
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import pandas as pd
import asyncio
import functools

router = APIRouter()

# Simple in-memory cache for filter options
filter_cache = {}
CACHE_DURATION = 300  # 5 minutes cache

class KPIData(BaseModel):
    total_students: int
    active_courses: int
    avg_performance: float
    completion_rate: float
    total_enrollments: int
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
    courseName: Optional[str] = None
    semesterName: Optional[str] = None
    department: Optional[str] = None
    campusName: Optional[str] = None
    crnCode: Optional[str] = None

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
                    course_data = course_doc.to_dict() or {}
                    course_data['id'] = course_id
                    courses_data.append(course_data)
        
        # Calculate KPIs
        total_students = sum(course.get('students', 0) for course in courses_data)
        active_courses = len(courses_data)
        avg_performance = sum(course.get('completion_rate', 0) for course in courses_data) / len(courses_data) if courses_data else 0
        completion_rate = avg_performance
        total_enrollments = total_students
        monthly_growth = 12.5  # Mock growth percentage
        at_risk_students = int(total_students * 0.15)  # 15% at risk
        pending_assignments = len(courses_data) * 3  # Mock pending assignments
        
        # Prepare detailed course data with additional filter fields
        courses_response = [
            CourseData(
                id=course.get('id', ''),
                name=course.get('courseName', 'Unknown Course'),
                students=course.get('students', 0),
                performance=course.get('completion_rate', 0),
                status="active",
                last_activity="2 hours ago",
                upcoming_deadlines=2,
                average_rating=course.get('average_rating', 0),
                courseName=course.get('courseName', 'Unknown Course'),
                semesterName=course.get('semesterName', 'Unknown Semester'),
                department=course.get('department', 'Unknown Department'),
                campusName=course.get('campusName', 'Unknown Campus'),
                crnCode=course.get('crnCode', 'N/A')
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
                course=courses_data[0].get('courseName', 'Mathematics 101') if len(courses_data) > 0 else "Mathematics 101", 
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
                course=courses_data[0].get('courseName', 'Chemistry 101') if len(courses_data) > 0 else "Chemistry 101", 
                student="", 
                time="6 hours ago",
                details="Midterm exam scheduled for next week"
            ),
            RecentActivityData(
                type="submission", 
                course=courses_data[0].get('courseName', 'Biology 201') if len(courses_data) > 0 else "Biology 201", 
                student="Mike Johnson", 
                time="1 day ago",
                details="Lab report submitted",
                score=None
            )
        ]
        
        # Upcoming events
        upcoming_events = [
            {
                "title": f"{courses_data[0].get('courseName', 'Mathematics 101') if len(courses_data) > 0 else 'Mathematics 101'} - Midterm Exam",
                "date": "2024-01-15",
                "time": "10:00 AM",
                "type": "exam",
                "course": courses_data[0].get('courseName', 'Mathematics 101') if len(courses_data) > 0 else "Mathematics 101"
            },
            {
                "title": f"{courses_data[1].get('courseName', 'Physics 201') if len(courses_data) > 1 else 'Physics 201'} - Assignment Due",
                "date": "2024-01-18",
                "time": "11:59 PM",
                "type": "assignment",
                "course": courses_data[1].get('courseName', 'Physics 201') if len(courses_data) > 1 else "Physics 201"
            },
            {
                "title": f"{courses_data[0].get('courseName', 'Chemistry 101') if len(courses_data) > 0 else 'Chemistry 101'} - Lab Report",
                "date": "2024-01-20",
                "time": "5:00 PM",
                "type": "assignment",
                "course": courses_data[0].get('courseName', 'Chemistry 101') if len(courses_data) > 0 else "Chemistry 101"
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
                total_enrollments=total_enrollments,
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
            if campus_name not in campus_breakdown:
                campus_breakdown[campus_name] = {
                    "total_courses": 0,
                    "total_students": 0,
                    "average_performance": 0,
                    "total_instructors": 0
                }
            campus_breakdown[campus_name]["total_courses"] += 1
            campus_breakdown[campus_name]["total_students"] += course.get('students', 0)
            campus_breakdown[campus_name]["average_performance"] += course.get('completion_rate', 0)
        
        for instructor in all_instructors:
            campus_name = instructor.get('campus', 'Dubai')
            if campus_name not in campus_breakdown:
                campus_breakdown[campus_name] = {
                    "total_courses": 0,
                    "total_students": 0,
                    "average_performance": 0,
                    "total_instructors": 0
                }
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
                    "department": course.get('department', 'Unknown'),  # Changed from course_type to department
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

@router.get("/admin/campus-course-performance")
async def get_admin_campus_course_performance(
    current_user: dict = Depends(verify_token)
):
    """Get campus course performance data - average grade and pass rate for each unique course"""
    start_time = datetime.now()
    try:
        # Verify user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to access admin metrics")
        
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
        
        admin_data = admin_doc.to_dict() or {}
        admin_campus = admin_data.get('campus') if admin_data else None
        
        if not admin_campus:
            raise HTTPException(status_code=400, detail="Admin campus not found")
        
        # Get all sections for this campus with limit for performance
        sections_query = db.collection('sections').where('campus', '==', admin_campus).limit(300).stream()
        campus_sections = [section.to_dict() for section in sections_query]
        
        # Group sections by course
        course_sections = {}
        for section in campus_sections:
            course_id = section.get('courseId')  # This is the document ID in courses collection
            course_code = section.get('courseCode', 'Unknown')
            
            if not course_id or not course_code:
                continue
                
            if course_code not in course_sections:
                course_sections[course_code] = {
                    'courseId': course_id,
                    'sections': []
                }
            
            course_sections[course_code]['sections'].append(section)
        
        # Get course details from courses collection
        course_details = {}
        
        # Fetch course details for each unique courseId
        for course_code, course_data in course_sections.items():
            course_id = course_data['courseId']
            if course_id:
                try:
                    course_doc = db.collection('courses').document(course_id).get()
                    if course_doc.exists:
                        course_info = course_doc.to_dict() or {}
                        course_details[course_code] = {
                            'courseName': course_info.get('courseName', f'Unknown Course ({course_code})'),
                            'department': course_info.get('department', 'Unknown Department')
                        }
                    else:
                        # If course document doesn't exist, use fallback values
                        course_details[course_code] = {
                            'courseName': f'Unknown Course ({course_code})',
                            'department': 'Unknown Department'
                        }
                except Exception as e:
                    # If there's an error fetching course details, use fallback values
                    course_details[course_code] = {
                        'courseName': f'Unknown Course ({course_code})',
                        'department': 'Unknown Department'
                    }
        
        # Calculate metrics for each course
        course_performance = []
        for course_code, course_data in course_sections.items():
            sections = course_data['sections']
            
            # Get course details or use fallback values
            details = course_details.get(course_code, {
                'courseName': f'Unknown Course ({course_code})',
                'department': 'Unknown Department'
            })
            
            # Calculate average grade
            total_average_grades = sum(section.get('averageGrade', 0) for section in sections)
            average_grade = round(total_average_grades / len(sections), 2) if sections else 0
            
            # Calculate pass rate
            total_pass = 0
            total_fail = 0
            
            for section in sections:
                assessments = section.get('assessments', {})
                for assessment_name, assessment_data in assessments.items():
                    grade_breakdown = assessment_data.get('gradeBreakdown', {})
                    
                    # Count pass grades (A, B, C, D)
                    pass_count = (
                        grade_breakdown.get('A', 0) +
                        grade_breakdown.get('B', 0) +
                        grade_breakdown.get('C', 0) +
                        grade_breakdown.get('D', 0)
                    )
                    
                    # Count fail grades (F)
                    fail_count = grade_breakdown.get('F', 0)
                    
                    total_pass += pass_count
                    total_fail += fail_count
            
            # Calculate pass rate percentage
            total_grades = total_pass + total_fail
            pass_rate = round((total_pass / total_grades) * 100, 1) if total_grades > 0 else 0
            
            course_performance.append({
                'courseCode': course_code,
                'courseName': details['courseName'],
                'department': details['department'],
                'averageGrade': average_grade,
                'passRate': pass_rate
            })
        
        # Sort by course code for consistent display
        course_performance.sort(key=lambda x: x['courseCode'])
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        print(f"Campus course performance endpoint took {processing_time} seconds")
        
        return course_performance
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching campus course performance: {str(e)}")

@router.get("/admin/campus-performance-trend")
async def get_admin_campus_performance_trend(
    current_user: dict = Depends(verify_token)
):
    """Get campus performance trend data for line chart - average grades by semester"""
    start_time = datetime.now()
    try:
        # Verify user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to access admin metrics")
        
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
        
        admin_data = admin_doc.to_dict() or {}
        admin_campus = admin_data.get('campus') if admin_data else None
        
        if not admin_campus:
            raise HTTPException(status_code=400, detail="Admin campus not found")
        
        # Get sections for this campus with limit for performance
        sections_query = db.collection('sections').where('campus', '==', admin_campus).limit(300).stream()
        campus_sections = [section.to_dict() for section in sections_query]
        
        # Group sections by semesterId and calculate average grades
        semester_performance = {}
        
        for section in campus_sections:
            semester_id = section.get('semesterId')
            average_grade = section.get('averageGrade', 0)
            
            # Skip sections without semester information
            if not semester_id:
                continue
                
            if semester_id not in semester_performance:
                semester_performance[semester_id] = {
                    "total_grades": 0,
                    "section_count": 0
                }
            
            semester_performance[semester_id]["total_grades"] += average_grade
            semester_performance[semester_id]["section_count"] += 1
        
        # Get semester names from semesters collection (limit to recent semesters)
        semester_ids = list(semester_performance.keys())[:20]  # Limit to 20 semesters
        semester_names = {}
        
        if semester_ids:
            semesters_query = db.collection('semesters').where('__name__', 'in', semester_ids[:10]).stream()
            for semester_doc in semesters_query:
                semester_data = semester_doc.to_dict() or {}
                semester_names[semester_doc.id] = semester_data.get('semester', f'Semester {semester_doc.id}')
        
        # Calculate average grades for each semester and add semester names
        performance_trend = []
        for semester_id, data in semester_performance.items():
            if data["section_count"] > 0:
                avg_grade = round(data["total_grades"] / data["section_count"], 2)
                performance_trend.append({
                    "semesterId": semester_id,
                    "semesterName": semester_names.get(semester_id, f'Unknown Semester ({semester_id})'),
                    "averageGrade": avg_grade
                })
        
        # Sort by semester name for proper chronological display (limit to 12 items)
        performance_trend.sort(key=lambda x: x["semesterName"])
        performance_trend = performance_trend[-12:]  # Only last 12 semesters
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        print(f"Campus performance trend endpoint took {processing_time} seconds")
        
        return performance_trend
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching campus performance trend: {str(e)}")

@router.get("/admin/campus-grade-distribution")
async def get_admin_campus_grade_distribution(
    current_user: dict = Depends(verify_token)
):
    """Get campus grade distribution data for pie chart - percentage of grades (A, B, C, D, F)"""
    start_time = datetime.now()
    try:
        # Verify user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to access admin metrics")
        
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
        
        admin_data = admin_doc.to_dict() or {}
        admin_campus = admin_data.get('campus') if admin_data else None
        
        if not admin_campus:
            raise HTTPException(status_code=400, detail="Admin campus not found")
        
        # Get sections for this campus with limit for performance
        sections_query = db.collection('sections').where('campus', '==', admin_campus).limit(300).stream()
        campus_sections = [section.to_dict() for section in sections_query]
        
        # Initialize grade counters
        grade_counts = {
            'A': 0,
            'B': 0,
            'C': 0,
            'D': 0,
            'F': 0
        }
        
        # Process each section and aggregate grade breakdowns
        for section in campus_sections:
            assessments = section.get('assessments', {})
            
            # Process each assessment in the section
            for assessment_name, assessment_data in assessments.items():
                grade_breakdown = assessment_data.get('gradeBreakdown', {})
                
                # Add grade counts to totals
                grade_counts['A'] += grade_breakdown.get('A', 0)
                grade_counts['B'] += grade_breakdown.get('B', 0)
                grade_counts['C'] += grade_breakdown.get('C', 0)
                grade_counts['D'] += grade_breakdown.get('D', 0)
                grade_counts['F'] += grade_breakdown.get('F', 0)
        
        # Calculate total grades
        total_grades = sum(grade_counts.values())
        
        # Calculate percentages
        grade_distribution = []
        if total_grades > 0:
            for grade, count in grade_counts.items():
                percentage = round((count / total_grades) * 100, 1)
                grade_distribution.append({
                    "grade": grade,
                    "count": count,
                    "percentage": percentage
                })
        else:
            # If no grades, return zero percentages
            for grade in grade_counts.keys():
                grade_distribution.append({
                    "grade": grade,
                    "count": 0,
                    "percentage": 0.0
                })
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        print(f"Campus grade distribution endpoint took {processing_time} seconds")
        
        return grade_distribution
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching campus grade distribution: {str(e)}")

@router.get("/admin/department-metrics")
async def get_admin_department_metrics(
    current_user: dict = Depends(verify_token)
):
    """Get campus-specific metrics for admin dashboard from Firestore"""
    try:
        # Verify user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to access admin metrics")
        
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
        
        admin_data = admin_doc.to_dict() or {}
        admin_department = admin_data.get('department') if admin_data else None
        admin_campus = admin_data.get('campus') if admin_data else None
        
        if not admin_campus:
            raise HTTPException(status_code=400, detail="Admin campus not found")
        
        # Get all courses (we'll filter by campus later)
        courses_query = db.collection('courses').stream()
        all_courses = [course.to_dict() for course in courses_query]
        
        # Get sections for this campus
        sections_query = db.collection('sections').where('campus', '==', admin_campus).stream()
        campus_sections = [section.to_dict() for section in sections_query]
        
        # Get instructors for this campus
        instructors_query = db.collection('instructors').where('campus', '==', admin_campus).stream()
        campus_instructors = [instructor.to_dict() for instructor in instructors_query]
        
        # Calculate metrics
        total_sections = len(campus_sections)
        total_courses = len(all_courses)  # Total courses in the system
        total_instructors = len(campus_instructors)
        
        return {
            "campus": admin_campus,
            "department": admin_department,  # Keep for reference but not used for filtering
            "totalStudents": total_sections,  # Changed to represent sections
            "totalCourses": total_courses,
            "totalInstructors": total_instructors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching campus metrics: {str(e)}")

@router.get("/admin/department-instructors")
async def get_admin_department_instructors(
    current_user: dict = Depends(verify_token)
):
    """Get campus-specific instructor count for admin dashboard from Firestore"""
    try:
        # Verify user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to access admin metrics")
        
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
        
        admin_data = admin_doc.to_dict() or {}
        admin_department = admin_data.get('department') if admin_data else None
        admin_campus = admin_data.get('campus') if admin_data else None
        
        if not admin_campus:
            raise HTTPException(status_code=400, detail="Admin campus not found")
        
        # Get instructors for this specific campus
        instructors_query = db.collection('instructors').where('campus', '==', admin_campus).stream()
        instructors_docs = list(instructors_query)
        instructor_count = len(instructors_docs)
        
        return {
            "campus": admin_campus,
            "department": admin_department,  # Keep for reference but not used for filtering
            "totalInstructors": instructor_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching campus instructor count: {str(e)}")

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
                    course_data = course_doc.to_dict() or {}
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

@router.get("/instructor/analytics")
async def get_instructor_course_analytics(
    course_id: Optional[str] = Query(None, description="Filter by specific course ID"),
    date_range: Optional[str] = Query("30d", description="Date range filter"),
    current_user: dict = Depends(verify_token)
):
    """Get comprehensive course analytics for instructor from Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get instructor's sections and courses
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Get courses for these sections
        course_ids = list(set([section.get('courseId') for section in instructor_sections if section.get('courseId')]))
        
        # Filter by specific course if provided
        if course_id and course_id != 'all':
            course_ids = [cid for cid in course_ids if cid == course_id]
        
        courses_data = []
        for course_id_item in course_ids:
            if course_id_item:
                course_doc = db.collection('courses').document(course_id_item).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict() or {}
                    course_data['id'] = course_id_item
                    
                    # Find related section for additional data
                    related_section = next((s for s in instructor_sections if s.get('courseId') == course_id_item), {})
                    
                    # Get campus information
                    campus_id = related_section.get('campusId')
                    campus_name = 'Unknown Campus'
                    if campus_id:
                        campus_doc = db.collection('campuses').document(campus_id).get()
                        if campus_doc.exists:
                            campus_data = campus_doc.to_dict() or {}
                            campus_name = campus_data.get('campusName', 'Unknown Campus')
                    
                    course_data.update({
                        'semesterName': related_section.get('semesterName', 'Unknown Semester'),
                        'campusName': campus_name,
                        'crnCode': related_section.get('crnCode', 'N/A'),
                        'department': course_data.get('department') or related_section.get('department', 'Unknown Department')
                    })
                    
                    courses_data.append(course_data)
        
        # Calculate KPIs from real data
        total_enrollments = sum(course.get('totalEnrollments', 0) for course in courses_data)
        active_students = sum(course.get('activeStudents', 0) for course in courses_data)
        total_courses = len(courses_data)
        
        # Calculate completion rate
        completion_rates = [course.get('completionRate', 0) for course in courses_data if course.get('completionRate') is not None]
        avg_completion_rate = sum(completion_rates) / len(completion_rates) if completion_rates else 0
        
        # Calculate average rating
        ratings = [course.get('averageRating', 0) for course in courses_data if course.get('averageRating') is not None]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        
        # Generate enrollment trend data (mock for now, can be enhanced with real performance data)
        enrollment_trend = [
            {"month": "Jan", "enrollments": max(45, total_enrollments // 6)},
            {"month": "Feb", "enrollments": max(67, total_enrollments // 5)},
            {"month": "Mar", "enrollments": max(89, total_enrollments // 4)},
            {"month": "Apr", "enrollments": max(123, total_enrollments // 3)},
            {"month": "May", "enrollments": max(156, total_enrollments // 2)},
            {"month": "Jun", "enrollments": total_enrollments}
        ]
        
        # Generate progress distribution based on real data
        progress_distribution = [
            {"range": "0-20%", "students": max(5, active_students // 10)},
            {"range": "21-40%", "students": max(10, active_students // 8)},
            {"range": "41-60%", "students": max(20, active_students // 5)},
            {"range": "61-80%", "students": max(30, active_students // 3)},
            {"range": "81-100%", "students": max(25, active_students // 4)}
        ]
        
        # Generate ratings breakdown
        ratings_breakdown = [
            {"stars": 5, "count": max(20, int(total_enrollments * 0.4)), "percentage": 40.0},
            {"stars": 4, "count": max(15, int(total_enrollments * 0.3)), "percentage": 30.0},
            {"stars": 3, "count": max(10, int(total_enrollments * 0.2)), "percentage": 20.0},
            {"stars": 2, "count": max(5, int(total_enrollments * 0.07)), "percentage": 7.0},
            {"stars": 1, "count": max(2, int(total_enrollments * 0.03)), "percentage": 3.0}
        ]
        
        # Generate course-specific lessons data
        most_viewed_lessons = []
        least_viewed_lessons = []
        
        for i, course in enumerate(courses_data[:5]):  # Top 5 courses
            course_name = course.get('courseName', f'Course {i+1}')
            base_views = course.get('totalEnrollments', 100)
            
            most_viewed_lessons.append({
                "title": f"{course_name} - Introduction",
                "views": base_views,
                "completion": min(95, course.get('completionRate', 80) + 10)
            })
            
            least_viewed_lessons.append({
                "title": f"{course_name} - Advanced Topics",
                "views": max(10, base_views // 4),
                "completion": max(40, course.get('completionRate', 80) - 30)
            })
        
        # Fill with defaults if no courses
        if not most_viewed_lessons:
            most_viewed_lessons = [
                {"title": "Introduction to Variables", "views": 156, "completion": 89},
                {"title": "Data Types and Structures", "views": 145, "completion": 85},
                {"title": "Control Flow and Loops", "views": 134, "completion": 78},
                {"title": "Functions and Methods", "views": 123, "completion": 82},
                {"title": "Object-Oriented Programming", "views": 112, "completion": 76}
            ]
        
        if not least_viewed_lessons:
            least_viewed_lessons = [
                {"title": "Advanced Algorithms", "views": 34, "completion": 45},
                {"title": "Memory Management", "views": 27, "completion": 52},
                {"title": "Error Handling", "views": 23, "completion": 48},
                {"title": "Testing Strategies", "views": 19, "completion": 55},
                {"title": "Performance Optimization", "views": 15, "completion": 61}
            ]
        
        # Drop-off points based on course structure
        drop_off_points = [
            {"lesson": "Introduction", "dropOff": 5},
            {"lesson": "Basic Concepts", "dropOff": 8},
            {"lesson": "Intermediate Topics", "dropOff": 15},
            {"lesson": "Advanced Concepts", "dropOff": 25},
            {"lesson": "Final Assessment", "dropOff": 12}
        ]
        
        return {
            "kpis": {
                "totalEnrollments": total_enrollments,
                "activeStudents": active_students,
                "completionRate": round(avg_completion_rate, 1),
                "averageProgress": round(avg_completion_rate, 1),
                "averageRating": round(avg_rating, 1),
                "totalCourses": total_courses
            },
            "courses": [
                {
                    "id": course.get('id', ''),
                    "name": course.get('courseName', 'Unknown Course'),
                    "code": course.get('courseCode', 'N/A'),
                    "enrollments": course.get('totalEnrollments', 0),
                    "activeStudents": course.get('activeStudents', 0),
                    "completionRate": course.get('completionRate', 0),
                    "averageRating": course.get('averageRating', 0),
                    "semesterName": course.get('semesterName', 'Unknown'),
                    "campusName": course.get('campusName', 'Unknown'),
                    "department": course.get('department', 'Unknown')
                } for course in courses_data
            ],
            "enrollmentTrend": enrollment_trend,
            "progressDistribution": progress_distribution,
            "dropOffPoints": drop_off_points,
            "ratingsBreakdown": ratings_breakdown,
            "mostViewedLessons": most_viewed_lessons,
            "leastViewedLessons": least_viewed_lessons
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor analytics: {str(e)}")

@router.get("/instructor/reports/detailed-assessment/download")
async def download_detailed_assessment_report(
    format: str = Query("pdf", description="Export format: pdf, xlsx, or csv"),
    course_id: Optional[str] = Query(None, description="Course ID to filter by"),
    current_user: dict = Depends(verify_token)
):
    """Download detailed assessment report in specified format"""
    # Get the report data first
    report_data = await get_instructor_detailed_assessment_report(course_id, current_user)
    
    if format.lower() == "pdf":
        pdf_buffer = create_pdf_report(report_data, "detailed-assessment")
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=detailed-assessment-report.pdf"}
        )
    elif format.lower() in ["xlsx", "excel"]:
        excel_buffer = create_excel_report(report_data, "detailed-assessment")
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=detailed-assessment-report.xlsx"}
        )
    elif format.lower() == "csv":
        buffer = io.StringIO()
        if 'assessments' in report_data and report_data['assessments']:
            df = pd.DataFrame(report_data['assessments'])
            df.to_csv(buffer, index=False)
            buffer.seek(0)
            return Response(
                content=buffer.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=detailed-assessment-report.csv"}
            )
    
    raise HTTPException(status_code=400, detail="Invalid format specified")


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

@router.get("/instructor/reports/course-performance")
async def get_instructor_course_performance_report(
    current_user: dict = Depends(verify_token)
):
    """Get comprehensive course performance report for all courses taught by instructor.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get instructor's sections and courses
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Get courses for these sections
        course_ids = list(set([section.get('courseId') for section in instructor_sections if section.get('courseId')]))
        
        # Extract section IDs for performance data querying
        section_ids = [section.get('sectionId') or section.get('id') for section in instructor_sections 
                      if section.get('sectionId') or section.get('id')]
        
        # Get performance data for all sections to calculate completion rates and grades
        performance_data = []
        student_ids = set()
        
        for section_id in section_ids:
            if section_id:
                performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
                for record in performance_query:
                    record_data = record.to_dict()
                    performance_data.append(record_data)
                    # Collect unique student IDs
                    if record_data.get('studentId'):
                        student_ids.add(record_data.get('studentId'))
        
        # Calculate overall metrics
        total_assessments = len(performance_data)
        passing_assessments = sum(1 for p in performance_data if p.get('percentage', 0) >= 60)
        avg_completion_rate = (passing_assessments / total_assessments * 100) if total_assessments > 0 else 0
        
        # Calculate average grade
        total_percentage = sum(p.get('percentage', 0) for p in performance_data)
        avg_grade = (total_percentage / total_assessments) if total_assessments > 0 else 0
        
        # Identify at-risk students (those with performance below 60%)
        student_performance = {}
        for record in performance_data:
            student_id = record.get('studentId')
            if student_id:
                if student_id not in student_performance:
                    student_performance[student_id] = []
                student_performance[student_id].append(record.get('percentage', 0))
        
        at_risk_students = []
        for student_id, percentages in student_performance.items():
            avg_student_performance = sum(percentages) / len(percentages) if percentages else 0
            if avg_student_performance < 60:
                at_risk_students.append({
                    'studentId': student_id,
                    'averagePerformance': round(avg_student_performance, 2)
                })
        
        courses_data = []
        for course_id in course_ids:
            if course_id:
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict() or {}
                    course_data['id'] = course_id
                    
                    # Find related section for additional data
                    related_section = next((s for s in instructor_sections if s.get('courseId') == course_id), {})
                    
                    # Get campus information
                    campus_id = related_section.get('campusId')
                    campus_name = 'Unknown Campus'
                    if campus_id:
                        campus_doc = db.collection('campuses').document(campus_id).get()
                        if campus_doc.exists:
                            campus_data = campus_doc.to_dict() or {}
                            campus_name = campus_data.get('campusName', 'Unknown Campus')
                    
                    # Get semester information
                    semester_id = related_section.get('semesterId')
                    semester_name = related_section.get('semesterName', 'Unknown Semester')
                    if semester_id:
                        semester_doc = db.collection('semesters').document(semester_id).get()
                        if semester_doc.exists:
                            semester_data = semester_doc.to_dict() or {}
                            semester_name = semester_data.get('semester', semester_name)
                    
                    # Get course-specific performance data
                    course_section_id = related_section.get('sectionId') or related_section.get('id')
                    course_performance = [p for p in performance_data if p.get('sectionId') == course_section_id] if course_section_id else []
                    course_total_assessments = len(course_performance)
                    course_passing_assessments = sum(1 for p in course_performance if p.get('percentage', 0) >= 60)
                    course_completion_rate = (course_passing_assessments / course_total_assessments * 100) if course_total_assessments > 0 else 0
                    
                    # Calculate course average grade
                    course_total_percentage = sum(p.get('percentage', 0) for p in course_performance)
                    course_avg_grade = (course_total_percentage / course_total_assessments) if course_total_assessments > 0 else 0
                    
                    # Identify course-specific at-risk students
                    course_student_performance = {}
                    for record in course_performance:
                        student_id = record.get('studentId')
                        if student_id:
                            if student_id not in course_student_performance:
                                course_student_performance[student_id] = []
                            course_student_performance[student_id].append(record.get('percentage', 0))
                    
                    course_at_risk_count = 0
                    for student_id, percentages in course_student_performance.items():
                        avg_student_performance = sum(percentages) / len(percentages) if percentages else 0
                        if avg_student_performance < 60:
                            course_at_risk_count += 1
                    
                    course_data.update({
                        'semesterName': semester_name,
                        'campusName': campus_name,
                        'crnCode': related_section.get('crnCode', 'N/A'),
                        'department': course_data.get('department') or related_section.get('department', 'Unknown Department'),
                        'courseCompletionRate': round(course_completion_rate, 2),
                        'courseAverageGrade': round(course_avg_grade, 2),
                        'courseTotalAssessments': course_total_assessments,
                        'courseAtRiskStudents': course_at_risk_count
                    })
                    
                    courses_data.append(course_data)
        
        # Generate report data
        report_data = []
        for course in courses_data:
            report_data.append({
                'courseId': course.get('id'),
                'courseName': course.get('courseName', 'Unknown Course'),
                'courseCode': course.get('courseCode', 'N/A'),
                'semester': course.get('semesterName', 'Unknown'),
                'campus': course.get('campusName', 'Unknown'),
                'department': course.get('department', 'Unknown'),
                'crnCode': course.get('crnCode', 'N/A'),
                'totalStudents': course.get('totalEnrollments', 0),
                'activeStudents': course.get('activeStudents', 0),
                'completionRate': course.get('courseCompletionRate', 0),
                'averageGrade': course.get('courseAverageGrade', 0),
                'totalAssessments': course.get('courseTotalAssessments', 0),
                'atRiskStudents': course.get('courseAtRiskStudents', 0),
                'topPerformers': max(0, int(course.get('totalEnrollments', 0) * 0.20))   # Mock top performers
            })
        
        return {
            "reportType": "course-performance",
            "generatedAt": datetime.utcnow().isoformat(),
            "instructorId": instructor_id,
            "courses": report_data,
            "summary": {
                "totalCourses": len(report_data),
                "totalStudents": sum(course['totalStudents'] for course in report_data),
                "totalAssessments": total_assessments,
                "avgCompletionRate": round(avg_completion_rate, 2),
                "avgGrade": round(avg_grade, 2),
                "atRiskStudents": len(at_risk_students),
                "activeStudents": sum(course['activeStudents'] for course in report_data)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating course performance report: {str(e)}")


@router.get("/instructor/reports/course-performance-analysis")
async def get_instructor_course_performance_analysis(
    current_user: dict = Depends(verify_token)
):
    """Generate a course performance analysis report for a specific instructor using your existing collections.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, query the sections collection using the instructor's ID to retrieve all sections 
        # taught by that instructor, which provides the foundation of courses to analyze
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Get courses for these sections
        course_ids = list(set([section.get('courseId') for section in instructor_sections if section.get('courseId')]))
        
        # Extract section IDs for performance data querying
        section_ids = [section.get('sectionId') or section.get('id') for section in instructor_sections 
                      if section.get('sectionId') or section.get('id')]
        
        # Using these section IDs, query the performance data collection to gather all assessment records
        performance_data = []
        student_ids = set()
        
        for section_id in section_ids:
            if section_id:
                performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
                for record in performance_query:
                    record_data = record.to_dict()
                    performance_data.append(record_data)
                    # Collect unique student IDs
                    if record_data.get('studentId'):
                        student_ids.add(record_data.get('studentId'))
        
        # Calculate overall metrics
        total_assessments = len(performance_data)
        passing_assessments = sum(1 for p in performance_data if p.get('percentage', 0) >= 60)
        avg_completion_rate = (passing_assessments / total_assessments * 100) if total_assessments > 0 else 0
        
        # Calculate average grade
        total_percentage = sum(p.get('percentage', 0) for p in performance_data)
        avg_grade = (total_percentage / total_assessments) if total_assessments > 0 else 0
        
        # Identify at-risk students (those with performance below 60%)
        student_performance = {}
        for record in performance_data:
            student_id = record.get('studentId')
            if student_id:
                if student_id not in student_performance:
                    student_performance[student_id] = []
                student_performance[student_id].append(record.get('percentage', 0))
        
        at_risk_students = []
        for student_id, percentages in student_performance.items():
            avg_student_performance = sum(percentages) / len(percentages) if percentages else 0
            if avg_student_performance < 60:
                at_risk_students.append({
                    'studentId': student_id,
                    'averagePerformance': round(avg_student_performance, 2)
                })
        
        # Process each course for detailed analysis
        courses_data = []
        for course_id in course_ids:
            if course_id:
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict() or {}
                    course_data['id'] = course_id
                    
                    # Find related section for additional data
                    related_sections = [s for s in instructor_sections if s.get('courseId') == course_id]
                    
                    # Get campus information from first section
                    campus_name = 'Unknown Campus'
                    if related_sections and related_sections[0].get('campusId'):
                        campus_id = related_sections[0].get('campusId')
                        campus_doc = db.collection('campuses').document(campus_id).get()
                        if campus_doc.exists:
                            campus_data = campus_doc.to_dict() or {}
                            campus_name = campus_data.get('campusName', 'Unknown Campus')
                    
                    # Get semester information from first section
                    semester_name = 'Unknown Semester'
                    if related_sections and related_sections[0].get('semesterId'):
                        semester_id = related_sections[0].get('semesterId')
                        semester_doc = db.collection('semesters').document(semester_id).get()
                        if semester_doc.exists:
                            semester_data = semester_doc.to_dict() or {}
                            semester_name = semester_data.get('semester', 'Unknown Semester')
                    
                    # Get course-specific performance data
                    course_section_ids = [s.get('sectionId') or s.get('id') for s in related_sections 
                                        if s.get('sectionId') or s.get('id')]
                    course_performance = [p for p in performance_data if p.get('sectionId') in course_section_ids]
                    course_total_assessments = len(course_performance)
                    course_passing_assessments = sum(1 for p in course_performance if p.get('percentage', 0) >= 60)
                    course_completion_rate = (course_passing_assessments / course_total_assessments * 100) if course_total_assessments > 0 else 0
                    
                    # Calculate course average grade
                    course_total_percentage = sum(p.get('percentage', 0) for p in course_performance)
                    course_avg_grade = (course_total_percentage / course_total_assessments) if course_total_assessments > 0 else 0
                    
                    # Identify course-specific at-risk students
                    course_student_performance = {}
                    for record in course_performance:
                        student_id = record.get('studentId')
                        if student_id:
                            if student_id not in course_student_performance:
                                course_student_performance[student_id] = []
                            course_student_performance[student_id].append(record.get('percentage', 0))
                    
                    course_at_risk_count = 0
                    for student_id, percentages in course_student_performance.items():
                        avg_student_performance = sum(percentages) / len(percentages) if percentages else 0
                        if avg_student_performance < 60:
                            course_at_risk_count += 1
                    
                    # Get unique students for this course
                    course_student_ids = set()
                    for record in course_performance:
                        if record.get('studentId'):
                            course_student_ids.add(record.get('studentId'))
                    
                    course_data.update({
                        'semesterName': semester_name,
                        'campusName': campus_name,
                        'crnCodes': [s.get('crnCode', 'N/A') for s in related_sections],
                        'department': course_data.get('department') or (related_sections[0].get('department', 'Unknown Department') if related_sections else 'Unknown Department'),
                        'courseCompletionRate': round(course_completion_rate, 2),
                        'courseAverageGrade': round(course_avg_grade, 2),
                        'courseTotalAssessments': course_total_assessments,
                        'courseAtRiskStudents': course_at_risk_count,
                        'courseTotalStudents': len(course_student_ids)
                    })
                    
                    courses_data.append(course_data)
        
        # Generate detailed report data
        report_data = []

# Remove the predictive risk report endpoints

        for course in courses_data:
            report_data.append({
                'courseId': course.get('id'),
                'courseName': course.get('courseName', 'Unknown Course'),
                'courseCode': course.get('courseCode', 'N/A'),
                'semester': course.get('semesterName', 'Unknown'),
                'campus': course.get('campusName', 'Unknown'),
                'department': course.get('department', 'Unknown'),
                'crnCodes': course.get('crnCodes', []),
                'totalStudents': course.get('courseTotalStudents', 0),
                'activeStudents': course.get('activeStudents', 0),
                'completionRate': course.get('courseCompletionRate', 0),
                'averageGrade': course.get('courseAverageGrade', 0),
                'totalAssessments': course.get('courseTotalAssessments', 0),
                'atRiskStudents': course.get('courseAtRiskStudents', 0),
                'topPerformers': max(0, int(course.get('courseTotalStudents', 0) * 0.20))   # Top 20% performers
            })
        
        # Sort courses by average grade (descending)
        report_data.sort(key=lambda x: x['averageGrade'], reverse=True)
        
        return {
            "reportType": "course-performance-analysis",
            "generatedAt": datetime.utcnow().isoformat(),
            "instructorId": instructor_id,
            "courses": report_data,
            "summary": {
                "totalCourses": len(report_data),
                "totalStudents": sum(course['totalStudents'] for course in report_data),
                "totalAssessments": total_assessments,
                "avgCompletionRate": round(avg_completion_rate, 2),
                "avgGrade": round(avg_grade, 2),
                "atRiskStudents": len(at_risk_students),
                "activeStudents": sum(course['activeStudents'] for course in report_data),
                "bestPerformingCourse": report_data[0]['courseName'] if report_data else 'N/A',
                "lowestPerformingCourse": report_data[-1]['courseName'] if report_data else 'N/A'
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating course performance analysis: {str(e)}")


@router.get("/instructor/reports/student-analysis")
async def get_instructor_student_analysis_report(
    course_id: Optional[str] = Query(None, description="Course ID to filter by"),
    current_user: dict = Depends(verify_token)
):
    """Generate a student analysis report for a specific instructor using your existing collections.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, query the sections collection using the instructor's ID to identify all sections 
        # taught by that instructor, which provides the relevant section IDs
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Filter by course if specified
        if course_id:
            instructor_sections = [s for s in instructor_sections if s.get('courseId') == course_id]
        
        # Get section IDs for performance data querying
        section_ids = [s.get('sectionId') or s.get('id') for s in instructor_sections 
                      if s.get('sectionId') or s.get('id')]
        
        # Get course IDs for course information
        course_ids = list(set([s.get('courseId') for s in instructor_sections if s.get('courseId')]))
        
        # Then, use these section IDs to query the performance data collection and retrieve all 
        # assessment records for students in those sections
        performance_data = []
        student_ids = set()
        
        for section_id in section_ids:
            if section_id:
                performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
                for record in performance_query:
                    record_data = record.to_dict()
                    performance_data.append(record_data)
                    # Collect unique student IDs
                    if record_data.get('studentId'):
                        student_ids.add(record_data.get('studentId'))
        
        # Get student details from students collection
        students_info = {}
        for student_id in student_ids:
            if student_id:
                student_doc = db.collection('students').document(student_id).get()
                if student_doc.exists:
                    student_data = student_doc.to_dict() or {}
                    students_info[student_id] = {
                        'studentName': student_data.get('studentName', f'Student {student_id}'),
                        'email': student_data.get('email', f'{student_id}@example.com')
                    }
        
        # Get course details from courses collection
        courses_info = {}
        for course_id in course_ids:
            if course_id:
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict() or {}
                    courses_info[course_id] = {
                        'courseName': course_data.get('courseName', 'Unknown Course'),
                        'courseCode': course_data.get('courseCode', 'N/A')
                    }
        
        # Analyze the data to generate comprehensive metrics
        # Group performance data by student
        student_performance = {}
        for record in performance_data:
            student_id = record.get('studentId')
            section_id = record.get('sectionId')
            if student_id and section_id:
                if student_id not in student_performance:
                    student_performance[student_id] = []
                student_performance[student_id].append(record)
        
        # Calculate individual student metrics
        students_analysis = []
        total_progress = 0
        total_grade = 0
        active_students = 0
        at_risk_students = 0
        
        for student_id, records in student_performance.items():
            # Get student info
            student_info = students_info.get(student_id, {
                'studentName': f'Student {student_id}',
                'email': f'{student_id}@example.com'
            })
            
            # Calculate student metrics
            total_assessments = len(records)
            completed_assessments = sum(1 for r in records if r.get('percentage') is not None)
            completion_rate = (completed_assessments / total_assessments * 100) if total_assessments > 0 else 0
            
            # Calculate average grade
            grades = [r.get('percentage', 0) for r in records if r.get('percentage') is not None]
            avg_grade = sum(grades) / len(grades) if grades else 0
            
            # Identify assessment types
            assessment_types = list(set(r.get('assessmentType', 'Unknown') for r in records))
            
            # Determine student status (at-risk if average grade < 60)
            status = 'at_risk' if avg_grade < 60 else 'active'
            
            # Get courses this student is enrolled in
            student_sections = list(set(r.get('sectionId') for r in records if r.get('sectionId')))
            student_courses = []
            for section_id in student_sections:
                section = next((s for s in instructor_sections if (s.get('sectionId') == section_id or s.get('id') == section_id)), None)
                if section and section.get('courseId'):
                    course_id = section.get('courseId')
                    course_info = courses_info.get(course_id, {'courseName': 'Unknown Course', 'courseCode': 'N/A'})
                    student_courses.append({
                        'courseId': course_id,
                        'courseName': course_info['courseName'],
                        'courseCode': course_info['courseCode']
                    })
            
            # Create student analysis record
            student_analysis = {
                'studentId': student_id,
                'studentName': student_info['studentName'],
                'email': student_info['email'],
                'progress': round(completion_rate, 1),
                'grade': round(avg_grade, 1),
                'lastActive': records[-1].get('date', 'Unknown') if records else 'Unknown',
                'status': status,
                'assignmentsCompleted': completed_assessments,
                'totalAssessments': total_assessments,
                'courses': student_courses,
                'assessmentTypes': assessment_types
            }
            
            students_analysis.append(student_analysis)
            
            # Update summary metrics
            total_progress += completion_rate
            total_grade += avg_grade
            if status == 'active':
                active_students += 1
            else:
                at_risk_students += 1
        
        # Sort students by grade (descending)
        students_analysis.sort(key=lambda x: x['grade'], reverse=True)
        
        # Calculate summary statistics
        total_students = len(students_analysis)
        avg_progress = (total_progress / total_students) if total_students > 0 else 0
        avg_grade = (total_grade / total_students) if total_students > 0 else 0
        
        return {
            "reportType": "student-analysis",
            "generatedAt": datetime.utcnow().isoformat(),
            "instructorId": instructor_id,
            "courseId": course_id,
            "students": students_analysis,
            "summary": {
                "totalStudents": total_students,
                "activeStudents": active_students,
                "atRiskStudents": at_risk_students,
                "avgProgress": round(avg_progress, 1),
                "avgGrade": round(avg_grade, 1),
                "topPerformingStudent": students_analysis[0]['studentName'] if students_analysis else 'N/A',
                "lowestPerformingStudent": students_analysis[-1]['studentName'] if students_analysis else 'N/A'
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating student analysis report: {str(e)}")


@router.get("/instructor/reports/semester-comparison")
async def get_instructor_semester_comparison_report(
    current_user: dict = Depends(verify_token)
):
    """Generate a semester comparison report for a specific instructor using your existing collections.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, query the sections collection using the instructor's ID to retrieve all sections 
        # taught by that instructor across different semesters, which provides both the section IDs 
        # and their associated semester IDs
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Extract section IDs and semester IDs for performance data querying
        section_ids = [s.get('sectionId') or s.get('id') for s in instructor_sections 
                      if s.get('sectionId') or s.get('id')]
        semester_ids = list(set([s.get('semesterId') for s in instructor_sections if s.get('semesterId')]))
        
        # Then, use these semester IDs to fetch semester details from the semesters collection 
        # and section IDs to gather all performance records from the performance data collection
        semester_details = {}
        for semester_id in semester_ids:
            if semester_id:
                semester_doc = db.collection('semesters').document(semester_id).get()
                if semester_doc.exists:
                    semester_data = semester_doc.to_dict() or {}
                    semester_details[semester_id] = {
                        'semesterName': semester_data.get('semester', f'Semester {semester_id}'),
                        'startDate': semester_data.get('startDate', ''),
                        'endDate': semester_data.get('endDate', '')
                    }
        
        # Get performance data for all sections to calculate metrics
        performance_data = []
        student_ids = set()
        
        for section_id in section_ids:
            if section_id:
                performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
                for record in performance_query:
                    record_data = record.to_dict()
                    performance_data.append(record_data)
                    # Collect unique student IDs
                    if record_data.get('studentId'):
                        student_ids.add(record_data.get('studentId'))
        
        # Group the performance data by semester and calculate key metrics
        semester_metrics = {}
        
        # Process each section to associate with its semester
        for section in instructor_sections:
            section_id = section.get('sectionId') or section.get('id')
            semester_id = section.get('semesterId')
            semester_name = section.get('semesterName', 'Unknown Semester')
            
            # Use semester details if available, otherwise use the name from section
            if semester_id and semester_id in semester_details:
                semester_name = semester_details[semester_id]['semesterName']
            
            # Initialize semester data if not exists
            if semester_name not in semester_metrics:
                semester_metrics[semester_name] = {
                    'totalStudents': 0,
                    'totalAssessments': 0,
                    'passingAssessments': 0,
                    'totalGrades': 0,
                    'courses': set(),
                    'studentIds': set()
                }
            
            # Add course ID to track unique courses
            course_id = section.get('courseId')
            if course_id:
                semester_metrics[semester_name]['courses'].add(course_id)
            
            # Filter performance data for this section
            section_performance = [p for p in performance_data if p.get('sectionId') == section_id]
            
            # Update semester metrics with section data
            semester_metrics[semester_name]['totalAssessments'] += len(section_performance)
            
            # Calculate passing assessments (typically 60% or higher)
            passing_count = sum(1 for p in section_performance if p.get('percentage', 0) >= 60)
            semester_metrics[semester_name]['passingAssessments'] += passing_count
            
            # Sum grades for average calculation
            total_percentage = sum(p.get('percentage', 0) for p in section_performance)
            semester_metrics[semester_name]['totalGrades'] += total_percentage
            
            # Collect unique students for this section
            section_students = set(p.get('studentId') for p in section_performance if p.get('studentId'))
            semester_metrics[semester_name]['studentIds'].update(section_students)
        
        # Calculate final metrics for each semester
        semester_comparison = []
        for semester_name, data in semester_metrics.items():
            total_assessments = data['totalAssessments']
            passing_assessments = data['passingAssessments']
            total_grades = data['totalGrades']
            course_count = len(data['courses'])
            student_count = len(data['studentIds'])
            
            # Calculate key metrics
            avg_grade = (total_grades / total_assessments) if total_assessments > 0 else 0
            pass_rate = (passing_assessments / total_assessments * 100) if total_assessments > 0 else 0
            student_to_course_ratio = (student_count / course_count) if course_count > 0 else 0
            
            semester_comparison.append({
                'semester': semester_name,
                'courses': course_count,
                'totalStudents': student_count,
                'avgCompletionRate': round(pass_rate, 2),
                'avgGrade': round(avg_grade, 2),
                'studentToCourseRatio': round(student_to_course_ratio, 2),
                'totalAssessments': total_assessments,
                'passRate': round(pass_rate, 2)
            })
        
        # Sort by semester name for chronological display
        semester_comparison.sort(key=lambda x: x['semester'])
        
        # By comparing these metrics across semesters, the report reveals trends in teaching effectiveness
        return {
            "reportType": "semester-comparison",
            "generatedAt": datetime.utcnow().isoformat(),
            "instructorId": instructor_id,
            "semesters": semester_comparison,
            "summary": {
                "totalSemesters": len(semester_comparison),
                "bestPerformingSemester": max(semester_comparison, key=lambda x: x['avgGrade'])['semester'] if semester_comparison else 'N/A',
                "worstPerformingSemester": min(semester_comparison, key=lambda x: x['avgGrade'])['semester'] if semester_comparison else 'N/A',
                "totalStudents": sum(s['totalStudents'] for s in semester_comparison),
                "totalCourses": sum(s['courses'] for s in semester_comparison)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating semester comparison report: {str(e)}")


@router.get("/instructor/reports/student-analytics")
async def get_instructor_student_analytics_report(  # pyright: ignore[reportRedeclaration]
    course_id: Optional[str] = Query(None),
    current_user: dict = Depends(verify_token)
):
    """Get student analytics report for individual student progress"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get instructor's sections and courses
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Get courses for these sections
        course_ids = list(set([section.get('courseId') for section in instructor_sections if section.get('courseId')]))
        
        # Extract section IDs for performance data querying
        section_ids = [section.get('sectionId') or section.get('id') for section in instructor_sections 
                      if section.get('sectionId') or section.get('id')]
        
        # Get performance data for all sections to calculate completion rates and grades
        performance_data = []
        student_ids = set()
        
        for section_id in section_ids:
            if section_id:
                performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
                for record in performance_query:
                    record_data = record.to_dict()
                    performance_data.append(record_data)
                    # Collect unique student IDs
                    if record_data.get('studentId'):
                        student_ids.add(record_data.get('studentId'))
        
        # Calculate overall metrics
        total_assessments = len(performance_data)
        passing_assessments = sum(1 for p in performance_data if p.get('percentage', 0) >= 60)
        avg_completion_rate = (passing_assessments / total_assessments * 100) if total_assessments > 0 else 0
        
        # Calculate average grade
        total_percentage = sum(p.get('percentage', 0) for p in performance_data)
        avg_grade = (total_percentage / total_assessments) if total_assessments > 0 else 0
        
        # Identify at-risk students (those with performance below 60%)
        student_performance = {}
        for record in performance_data:
            student_id = record.get('studentId')
            if student_id:
                if student_id not in student_performance:
                    student_performance[student_id] = []
                student_performance[student_id].append(record.get('percentage', 0))
        
        at_risk_students = []
        for student_id, percentages in student_performance.items():
            avg_student_performance = sum(percentages) / len(percentages) if percentages else 0
            if avg_student_performance < 60:
                at_risk_students.append({
                    'studentId': student_id,
                    'averagePerformance': round(avg_student_performance, 2)
                })
        
        # Process each course for detailed analysis
        courses_data = []
        for course_id in course_ids:
            if course_id:
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict() or {}
                    course_data['id'] = course_id
                    
                    # Find related section for additional data
                    related_sections = [s for s in instructor_sections if s.get('courseId') == course_id]
                    
                    # Get campus information from first section
                    campus_name = 'Unknown Campus'
                    if related_sections and related_sections[0].get('campusId'):
                        campus_id = related_sections[0].get('campusId')
                        campus_doc = db.collection('campuses').document(campus_id).get()
                        if campus_doc.exists:
                            campus_data = campus_doc.to_dict() or {}
                            campus_name = campus_data.get('campusName', 'Unknown Campus')
                    
                    # Get semester information from first section
                    semester_name = 'Unknown Semester'
                    if related_sections and related_sections[0].get('semesterId'):
                        semester_id = related_sections[0].get('semesterId')
                        semester_doc = db.collection('semesters').document(semester_id).get()
                        if semester_doc.exists:
                            semester_data = semester_doc.to_dict() or {}
                            semester_name = semester_data.get('semester', 'Unknown Semester')
                    
                    # Get course-specific performance data
                    course_section_ids = [s.get('sectionId') or s.get('id') for s in related_sections 
                                        if s.get('sectionId') or s.get('id')]
                    course_performance = [p for p in performance_data if p.get('sectionId') in course_section_ids]
                    course_total_assessments = len(course_performance)
                    course_passing_assessments = sum(1 for p in course_performance if p.get('percentage', 0) >= 60)
                    course_completion_rate = (course_passing_assessments / course_total_assessments * 100) if course_total_assessments > 0 else 0
                    
                    # Calculate course average grade
                    course_total_percentage = sum(p.get('percentage', 0) for p in course_performance)
                    course_avg_grade = (course_total_percentage / course_total_assessments) if course_total_assessments > 0 else 0
                    
                    # Identify course-specific at-risk students
                    course_student_performance = {}
                    for record in course_performance:
                        student_id = record.get('studentId')
                        if student_id:
                            if student_id not in course_student_performance:
                                course_student_performance[student_id] = []
                            course_student_performance[student_id].append(record.get('percentage', 0))
                    
                    course_at_risk_count = 0
                    for student_id, percentages in course_student_performance.items():
                        avg_student_performance = sum(percentages) / len(percentages) if percentages else 0
                        if avg_student_performance < 60:
                            course_at_risk_count += 1
                    
                    # Get unique students for this course
                    course_student_ids = set()
                    for record in course_performance:
                        if record.get('studentId'):
                            course_student_ids.add(record.get('studentId'))
                    
                    course_data.update({
                        'semesterName': semester_name,
                        'campusName': campus_name,
                        'crnCodes': [s.get('crnCode', 'N/A') for s in related_sections],
                        'department': course_data.get('department') or (related_sections[0].get('department', 'Unknown Department') if related_sections else 'Unknown Department'),
                        'courseCompletionRate': round(course_completion_rate, 2),
                        'courseAverageGrade': round(course_avg_grade, 2),
                        'courseTotalAssessments': course_total_assessments,
                        'courseAtRiskStudents': course_at_risk_count,
                        'courseTotalStudents': len(course_student_ids)
                    })
                    
                    courses_data.append(course_data)
        
        # Generate detailed report data
        report_data = []
        for course in courses_data:
            report_data.append({
                'courseId': course.get('id'),
                'courseName': course.get('courseName', 'Unknown Course'),
                'courseCode': course.get('courseCode', 'N/A'),
                'semester': course.get('semesterName', 'Unknown'),
                'campus': course.get('campusName', 'Unknown'),
                'department': course.get('department', 'Unknown'),
                'crnCodes': course.get('crnCodes', []),
                'totalStudents': course.get('courseTotalStudents', 0),
                'activeStudents': course.get('activeStudents', 0),
                'completionRate': course.get('courseCompletionRate', 0),
                'averageGrade': course.get('courseAverageGrade', 0),
                'totalAssessments': course.get('courseTotalAssessments', 0),
                'atRiskStudents': course.get('courseAtRiskStudents', 0),
                'topPerformers': max(0, int(course.get('courseTotalStudents', 0) * 0.20))   # Top 20% performers
            })
        
        # Sort courses by average grade (descending)
        report_data.sort(key=lambda x: x['averageGrade'], reverse=True)
        
        return {
            "reportType": "course-performance-analysis",
            "generatedAt": datetime.utcnow().isoformat(),
            "instructorId": instructor_id,
            "courses": report_data,
            "summary": {
                "totalCourses": len(report_data),
                "totalStudents": sum(course['totalStudents'] for course in report_data),
                "totalAssessments": total_assessments,
                "avgCompletionRate": round(avg_completion_rate, 2),
                "avgGrade": round(avg_grade, 2),
                "atRiskStudents": len(at_risk_students),
                "activeStudents": sum(course['activeStudents'] for course in report_data),
                "bestPerformingCourse": report_data[0]['courseName'] if report_data else 'N/A',
                "lowestPerformingCourse": report_data[-1]['courseName'] if report_data else 'N/A'
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating course performance analysis: {str(e)}")

@router.get("/instructor/reports/student-analytics")
async def get_instructor_student_analytics_report(
    course_id: Optional[str] = Query(None),
    current_user: dict = Depends(verify_token)
):
    """Get student analytics report for individual student progress"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get instructor's sections
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Filter by course if specified
        if course_id:
            instructor_sections = [s for s in instructor_sections if s.get('courseId') == course_id]
        
        # Get course IDs
        course_ids = list(set([section.get('courseId') for section in instructor_sections if section.get('courseId')]))
        
        # Get students from performance data (mocked for now)
        students_data = []
        for i in range(50):  # Mock 50 students
            students_data.append({
                'studentId': f'S{i+1:03d}',
                'studentName': f'Student {i+1}',
                'email': f'student{i+1}@example.com',
                'progress': 75 + (i % 25),  # Mock progress between 75-99
                'grade': 80 + (i % 20),     # Mock grade between 80-99
                'lastActive': f'{i % 10 + 1} days ago',
                'status': 'active' if i % 5 != 0 else 'at_risk',
                'assignmentsCompleted': 8 + (i % 5),
                'quizzesTaken': 3 + (i % 3),
                'averageQuizScore': 85 + (i % 15)
            })
        
        # Categorize students
        active_students = [s for s in students_data if s['status'] == 'active']
        at_risk_students = [s for s in students_data if s['status'] == 'at_risk']
        
        return {
            "reportType": "student-analytics",
            "generatedAt": datetime.utcnow().isoformat(),
            "instructorId": instructor_id,
            "courseId": course_id,
            "students": students_data,
            "summary": {
                "totalStudents": len(students_data),
                "activeStudents": len(active_students),
                "atRiskStudents": len(at_risk_students),
                "avgProgress": round(sum(s['progress'] for s in students_data) / len(students_data), 1) if students_data else 0,
                "avgGrade": round(sum(s['grade'] for s in students_data) / len(students_data), 1) if students_data else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating student analytics report: {str(e)}")



@router.get("/instructor/reports/detailed-assessment")
async def get_instructor_detailed_assessment_report(
    course_id: Optional[str] = Query(None),
    current_user: dict = Depends(verify_token)
):
    """Generate a detailed assessment report for a specific instructor using your existing collections.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, query the sections collection using the instructor's unique ID to retrieve all sections 
        # taught by that instructor, obtaining the relevant section IDs
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Filter by course if specified
        if course_id:
            instructor_sections = [s for s in instructor_sections if s.get('courseId') == course_id]
        
        # Get course IDs and section IDs for performance data querying
        course_ids = list(set([s.get('courseId') for s in instructor_sections if s.get('courseId')]))
        section_ids = [s.get('sectionId') or s.get('id') for s in instructor_sections 
                      if s.get('sectionId') or s.get('id')]
        
        # Then, use these section IDs to query the performance data collection, extracting all assessment 
        # records including assessment titles, scores, max scores, percentages, assessment types, and weights
        performance_data = []
        for section_id in section_ids:
            if section_id:
                performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
                for record in performance_query:
                    record_data = record.to_dict()
                    performance_data.append(record_data)
        
        # Get course details from courses collection
        courses_info = {}
        for course_id in course_ids:
            if course_id:
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict() or {}
                    courses_info[course_id] = {
                        'courseName': course_data.get('courseName', 'Unknown Course'),
                        'courseCode': course_data.get('courseCode', 'N/A'),
                        'semesterId': course_data.get('semesterId', ''),
                        'department': course_data.get('department', 'Unknown Department')
                    }
        
        # Get semester details from semesters collection
        semester_details = {}
        semester_ids = list(set([courses_info[course_id]['semesterId'] for course_id in course_ids 
                                if course_id in courses_info and courses_info[course_id]['semesterId']]))
        for semester_id in semester_ids:
            if semester_id:
                semester_doc = db.collection('semesters').document(semester_id).get()
                if semester_doc.exists:
                    semester_data = semester_doc.to_dict() or {}
                    semester_details[semester_id] = {
                        'semesterName': semester_data.get('semester', f'Semester {semester_id}'),
                        'startDate': semester_data.get('startDate', ''),
                        'endDate': semester_data.get('endDate', '')
                    }
        
        # Process the data to generate comprehensive metrics
        assessments = []
        assessment_metrics = {
            'quizzes': {'count': 0, 'totalScore': 0, 'totalMaxScore': 0, 'passingCount': 0},
            'assignments': {'count': 0, 'totalScore': 0, 'totalMaxScore': 0, 'passingCount': 0},
            'exams': {'count': 0, 'totalScore': 0, 'totalMaxScore': 0, 'passingCount': 0},
            'projects': {'count': 0, 'totalScore': 0, 'totalMaxScore': 0, 'passingCount': 0}
        }
        
        # Group performance data by assessment
        assessment_groups = {}
        for record in performance_data:
            assessment_name = record.get('assessmentName', 'Unknown Assessment')
            if assessment_name not in assessment_groups:
                assessment_groups[assessment_name] = []
            assessment_groups[assessment_name].append(record)
        
        # Process each assessment group
        for assessment_name, records in assessment_groups.items():
            if not records:
                continue
                
            # Get assessment details from first record
            first_record = records[0]
            assessment_type = first_record.get('assessmentType', 'Unknown').lower()
            section_id = first_record.get('sectionId', '')
            
            # Find the section and course for this assessment
            section = next((s for s in instructor_sections if (s.get('sectionId') == section_id or s.get('id') == section_id)), None)
            course_id = section.get('courseId') if section else 'Unknown'
            course_info = courses_info.get(course_id, {}) if section else {}
            
            # Calculate metrics for this assessment
            total_score = sum(r.get('score', 0) for r in records)
            total_max_score = sum(r.get('maxScore', 100) for r in records)
            total_records = len(records)
            
            # Calculate averages
            avg_score = total_score / total_records if total_records > 0 else 0
            avg_max_score = total_max_score / total_records if total_records > 0 else 100
            avg_percentage = (avg_score / avg_max_score * 100) if avg_max_score > 0 else 0
            
            # Count passing assessments (typically 60% or higher)
            passing_count = sum(1 for r in records if (r.get('percentage', 0) >= 60))
            pass_rate = (passing_count / total_records * 100) if total_records > 0 else 0
            
            # Determine assessment type category
            type_category = 'assignments'  # default
            if 'quiz' in assessment_type:
                type_category = 'quizzes'
            elif 'exam' in assessment_type:
                type_category = 'exams'
            elif 'project' in assessment_type:
                type_category = 'projects'
            
            # Update assessment metrics
            assessment_metrics[type_category]['count'] += 1
            assessment_metrics[type_category]['totalScore'] += total_score
            assessment_metrics[type_category]['totalMaxScore'] += total_max_score
            assessment_metrics[type_category]['passingCount'] += passing_count
            
            # Create assessment record
            assessments.append({
                'assessmentName': assessment_name,
                'courseId': course_id,
                'courseName': course_info.get('courseName', 'Unknown Course'),
                'courseCode': course_info.get('courseCode', 'N/A'),
                'type': first_record.get('assessmentType', 'Unknown'),
                'dueDate': first_record.get('date', 'Unknown'),
                'totalPoints': avg_max_score,
                'avgScore': round(avg_score, 2),
                'highestScore': max(r.get('score', 0) for r in records),
                'lowestScore': min(r.get('score', 0) for r in records),
                'submissions': total_records,
                'passRate': round(pass_rate, 2),
                'avgPercentage': round(avg_percentage, 2),
                'feedbackProvided': first_record.get('feedback', False)
            })
        
        # Calculate overall metrics
        total_assessments = sum(metrics['count'] for metrics in assessment_metrics.values())
        total_submissions = sum(len([r for r in performance_data if r.get('assessmentType', '').lower() in 
                                   (type_key[:-1] if type_key.endswith('s') else type_key)]) 
                               for type_key in assessment_metrics.keys())
        
        # Calculate overall averages
        overall_avg_score = 0
        overall_pass_rate = 0
        if performance_data:
            total_scores = sum(r.get('score', 0) for r in performance_data)
            total_max_scores = sum(r.get('maxScore', 100) for r in performance_data)
            overall_avg_score = (total_scores / len(performance_data)) if len(performance_data) > 0 else 0
            overall_percentage = (overall_avg_score / (total_max_scores / len(performance_data)) * 100) if len(performance_data) > 0 and total_max_scores > 0 else 0
            passing_submissions = sum(1 for r in performance_data if r.get('percentage', 0) >= 60)
            overall_pass_rate = (passing_submissions / len(performance_data) * 100) if len(performance_data) > 0 else 0
        
        # Sort assessments by due date
        assessments.sort(key=lambda x: x['dueDate'])
        
        # By correlating this assessment data with course information from the courses collection 
        # and semester details from the semesters collection, the report provides a complete picture
        return {
            "reportType": "detailed-assessment",
            "generatedAt": datetime.utcnow().isoformat(),
            "instructorId": instructor_id,
            "courseId": course_id,
            "assessments": assessments,
            "summary": {
                "totalAssessments": total_assessments,
                "quizzes": assessment_metrics['quizzes']['count'],
                "assignments": assessment_metrics['assignments']['count'],
                "exams": assessment_metrics['exams']['count'],
                "projects": assessment_metrics['projects']['count'],
                "avgScore": round(overall_avg_score, 2),
                "overallPassRate": round(overall_pass_rate, 2),
                "totalSubmissions": len(performance_data)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating detailed assessment report: {str(e)}")

# Helper function to create PDF report
def create_pdf_report(report_data, report_type):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Add title
    title = f"{report_type.replace('-', ' ').title()} Report"
    story.append(Paragraph(title, styles['Title']))
    story.append(Spacer(1, 12))
    
    # Add generated date
    generated_at = report_data.get('generatedAt', datetime.now().isoformat())
    story.append(Paragraph(f"Generated: {generated_at}", styles['Normal']))
    story.append(Spacer(1, 12))
    
    # Add summary data if available
    if 'summary' in report_data:
        story.append(Paragraph("Summary", styles['Heading2']))
        summary_data = report_data['summary']
        summary_table_data = [[key.replace('_', ' ').title(), str(value)] for key, value in summary_data.items()]
        summary_table = Table(summary_table_data)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 12))
    
    # Add detailed data if available
    for key, value in report_data.items():
        if key not in ['summary', 'generatedAt'] and isinstance(value, list):
            story.append(Paragraph(key.replace('_', ' ').title(), styles['Heading2']))
            if value and isinstance(value[0], dict):
                # Create table from list of dictionaries
                headers = list(value[0].keys())
                table_data = [headers]
                for item in value:
                    table_data.append([str(item.get(header, '')) for header in headers])
                
                table = Table(table_data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                story.append(table)
                story.append(Spacer(1, 12))
    
    doc.build(story)
    buffer.seek(0)
    return buffer

# Helper function to create Excel report
def create_excel_report(report_data, report_type):
    import tempfile
    import os
    
    # Create a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
    temp_file.close()
    
    try:
        # Create Excel writer with temporary file path
        writer = pd.ExcelWriter(temp_file.name, engine='openpyxl')
        
        # Add summary sheet if available
        if 'summary' in report_data:
            summary_items = list(report_data['summary'].items())
            summary_df = pd.DataFrame(data=summary_items)
            summary_df.columns = ['Metric', 'Value']
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # Add detailed data sheets
        for key, value in report_data.items():
            if key not in ['summary', 'generatedAt'] and isinstance(value, list):
                if value and isinstance(value[0], dict):
                    df = pd.DataFrame(data=value)
                    # Limit sheet name to 31 characters
                    sheet_name = key.replace('_', ' ').title()[:31]
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        writer.close()
        
        # Read the file content into a BytesIO buffer
        with open(temp_file.name, 'rb') as f:
            buffer = io.BytesIO(f.read())
        
        return buffer
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

# Download endpoints for reports
@router.get("/instructor/reports/course-performance/download")
async def download_course_performance_report(
    format: str = Query("pdf", description="Export format: pdf, xlsx, or csv"),
    current_user: dict = Depends(verify_token)
):
    """Download course performance report in specified format"""
    # Get the report data first
    report_data = await get_instructor_course_performance_report(current_user)
    
    if format.lower() == "pdf":
        pdf_buffer = create_pdf_report(report_data, "course-performance")
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=course-performance-report.pdf"}
        )
    elif format.lower() in ["xlsx", "excel"]:
        excel_buffer = create_excel_report(report_data, "course-performance")
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=course-performance-report.xlsx"}
        )
    elif format.lower() == "csv":
        # For CSV, we'll create one with the main data
        buffer = io.StringIO()
        if 'courses' in report_data and report_data['courses']:
            df = pd.DataFrame(report_data['courses'])
            df.to_csv(buffer, index=False)
            buffer.seek(0)
            return Response(
                content=buffer.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=course-performance-report.csv"}
            )
    
    raise HTTPException(status_code=400, detail="Invalid format specified")

@router.get("/instructor/reports/course-performance-analysis/download")
async def download_course_performance_analysis_report(
    format: str = Query("pdf", description="Export format: pdf, xlsx, or csv"),
    current_user: dict = Depends(verify_token)
):
    """Download course performance analysis report in specified format"""
    # Get the report data first
    report_data = await get_instructor_course_performance_analysis(current_user)
    
    if format.lower() == "pdf":
        pdf_buffer = create_pdf_report(report_data, "course-performance-analysis")
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=course-performance-analysis-report.pdf"}
        )
    elif format.lower() in ["xlsx", "excel"]:
        excel_buffer = create_excel_report(report_data, "course-performance-analysis")
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=course-performance-analysis-report.xlsx"}
        )
    elif format.lower() == "csv":
        buffer = io.StringIO()
        if 'courses' in report_data and report_data['courses']:
            df = pd.DataFrame(report_data['courses'])
            df.to_csv(buffer, index=False)
            buffer.seek(0)
            return Response(
                content=buffer.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=course-performance-analysis-report.csv"}
            )
    
    raise HTTPException(status_code=400, detail="Invalid format specified")

@router.get("/instructor/reports/student-analytics/download")
async def download_student_analytics_report(
    format: str = Query("pdf", description="Export format: pdf, xlsx, or csv"),
    course_id: Optional[str] = Query(None, description="Course ID to filter by"),
    current_user: dict = Depends(verify_token)
):
    """Download student analytics report in specified format"""
    # Get the report data first
    report_data = await get_instructor_student_analytics_report(course_id, current_user)
    
    if format.lower() == "pdf":
        pdf_buffer = create_pdf_report(report_data, "student-analytics")
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=student-analytics-report.pdf"}
        )
    elif format.lower() in ["xlsx", "excel"]:
        excel_buffer = create_excel_report(report_data, "student-analytics")
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=student-analytics-report.xlsx"}
        )
    elif format.lower() == "csv":
        buffer = io.StringIO()
        if 'students' in report_data and report_data['students']:
            df = pd.DataFrame(report_data['students'])
            df.to_csv(buffer, index=False)
            buffer.seek(0)
            return Response(
                content=buffer.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=student-analytics-report.csv"}
            )
    
    raise HTTPException(status_code=400, detail="Invalid format specified")

@router.get("/instructor/reports/semester-comparison/download")
async def download_semester_comparison_report(
    format: str = Query("pdf", description="Export format: pdf, xlsx, or csv"),
    current_user: dict = Depends(verify_token)
):
    """Download semester comparison report in specified format"""
    # Get the report data first
    report_data = await get_instructor_semester_comparison_report(current_user)
    
    if format.lower() == "pdf":
        pdf_buffer = create_pdf_report(report_data, "semester-comparison")
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=semester-comparison-report.pdf"}
        )
    elif format.lower() in ["xlsx", "excel"]:
        excel_buffer = create_excel_report(report_data, "semester-comparison")
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=semester-comparison-report.xlsx"}
        )
    elif format.lower() == "csv":
        buffer = io.StringIO()
        if 'semesters' in report_data and report_data['semesters']:
            df = pd.DataFrame(report_data['semesters'])
            df.to_csv(buffer, index=False)
            buffer.seek(0)
            return Response(
                content=buffer.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=semester-comparison-report.csv"}
            )
    
    raise HTTPException(status_code=400, detail="Invalid format specified")

@router.get("/instructor/reports/student-analysis/download")
async def download_student_analysis_report(
    format: str = Query("pdf", description="Export format: pdf, xlsx, or csv"),
    course_id: Optional[str] = Query(None, description="Course ID to filter by"),
    current_user: dict = Depends(verify_token)
):
    """Download student analysis report in specified format"""
    # Get the report data first
    report_data = await get_instructor_student_analysis_report(course_id, current_user)
    
    if format.lower() == "pdf":
        pdf_buffer = create_pdf_report(report_data, "student-analysis")
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=student-analysis-report.pdf"}
        )
    elif format.lower() in ["xlsx", "excel"]:
        excel_buffer = create_excel_report(report_data, "student-analysis")
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=student-analysis-report.xlsx"}
        )
    elif format.lower() == "csv":
        buffer = io.StringIO()
        if 'students' in report_data and report_data['students']:
            df = pd.DataFrame(report_data['students'])
            df.to_csv(buffer, index=False)
            buffer.seek(0)
            return Response(
                content=buffer.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=student-analysis-report.csv"}
            )
    
    raise HTTPException(status_code=400, detail="Invalid format specified")


# New endpoints for CRN comparison and semester performance
@router.get("/instructor/crn-comparison")
async def get_instructor_crn_comparison(
    crn1: str = Query(..., description="First CRN to compare"),
    crn2: str = Query(..., description="Second CRN to compare"),
    current_user: dict = Depends(verify_token)
):
    """Get performance comparison data for two CRNs"""
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
        
        # Find sections for the two CRNs
        section1 = next((s for s in instructor_sections if s.get('crnCode') == crn1), None)
        section2 = next((s for s in instructor_sections if s.get('crnCode') == crn2), None)
        
        if not section1 or not section2:
            raise HTTPException(status_code=404, detail="One or both CRNs not found for this instructor")
        
        # Get course data for both sections
        course1_id = section1.get('courseId')
        course2_id = section2.get('courseId')
        
        course1_doc = db.collection('courses').document(course1_id).get()
        course2_doc = db.collection('courses').document(course2_id).get()
        
        if not course1_doc.exists or not course2_doc.exists:
            raise HTTPException(status_code=404, detail="Course data not found")
        
        course1_data = course1_doc.to_dict() or {}
        course2_data = course2_doc.to_dict() or {}
        
        # Prepare comparison data
        comparison_data = {
            "crn1": {
                "crn": crn1,
                "courseName": course1_data.get('courseName', 'Unknown Course'),
                "semester": section1.get('semesterName', 'Unknown Semester'),
                "students": course1_data.get('totalEnrollments', 0),
                "completionRate": course1_data.get('completionRate', 0),
                "averageGrade": course1_data.get('averageRating', 0),
                "activeStudents": course1_data.get('activeStudents', 0),
                "atRiskStudents": max(0, int(course1_data.get('totalEnrollments', 0) * 0.15))
            },
            "crn2": {
                "crn": crn2,
                "courseName": course2_data.get('courseName', 'Unknown Course'),
                "semester": section2.get('semesterName', 'Unknown Semester'),
                "students": course2_data.get('totalEnrollments', 0),
                "completionRate": course2_data.get('completionRate', 0),
                "averageGrade": course2_data.get('averageRating', 0),
                "activeStudents": course2_data.get('activeStudents', 0),
                "atRiskStudents": max(0, int(course2_data.get('totalEnrollments', 0) * 0.15))
            },
            "comparison": {
                "studentsDifference": course1_data.get('totalEnrollments', 0) - course2_data.get('totalEnrollments', 0),
                "completionRateDifference": round(course1_data.get('completionRate', 0) - course2_data.get('completionRate', 0), 2),
                "averageGradeDifference": round(course1_data.get('averageRating', 0) - course2_data.get('averageRating', 0), 2),
                "betterCompletionRate": crn1 if course1_data.get('completionRate', 0) > course2_data.get('completionRate', 0) else crn2,
                "betterAverageGrade": crn1 if course1_data.get('averageRating', 0) > course2_data.get('averageRating', 0) else crn2
            }
        }
        
        return comparison_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching CRN comparison data: {str(e)}")

@router.get("/instructor/semester-performance")
async def get_instructor_semester_performance(
    current_user: dict = Depends(verify_token)
):
    """Get semester performance trend data for line chart"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get instructor's sections
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Group by semester
        semester_data = {}
        for section in instructor_sections:
            semester = section.get('semesterName', 'Unknown')
            course_id = section.get('courseId')
            
            if course_id and semester != 'Unknown':
                if semester not in semester_data:
                    semester_data[semester] = {
                        "courses": 0,
                        "totalStudents": 0,
                        "totalCompletionRate": 0,
                        "totalGrades": 0
                    }
                
                # Get course data
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict() or {}
                    semester_data[semester]["courses"] += 1
                    semester_data[semester]["totalStudents"] += course_data.get('totalEnrollments', 0)
                    semester_data[semester]["totalCompletionRate"] += course_data.get('completionRate', 0)
                    semester_data[semester]["totalGrades"] += course_data.get('averageRating', 0)
        
        # Calculate averages and prepare trend data
        trend_data = []
        for semester, data in semester_data.items():
            if data["courses"] > 0:
                trend_data.append({
                    "semester": semester,
                    "courses": data["courses"],
                    "totalStudents": data["totalStudents"],
                    "avgCompletionRate": round(data["totalCompletionRate"] / data["courses"], 2),
                    "avgGrade": round(data["totalGrades"] / data["courses"], 2),
                    "studentToCourseRatio": round(data["totalStudents"] / data["courses"], 2) if data["courses"] > 0 else 0
                })
        
        # Sort by semester (assuming format like "Fall 2023", "Spring 2024", etc.)
        trend_data.sort(key=lambda x: x["semester"])
        
        return trend_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching semester performance data: {str(e)}")



@router.get("/admin/metrics")
async def get_admin_platform_metrics(
    current_user: dict = Depends(verify_token)
):
    """Get platform metrics for admin dashboard from Firestore"""
    try:
        # Verify user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to access admin metrics")
        
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get counts from different collections
        instructors_count = len([doc for doc in db.collection('instructors').stream()])
        students_count = len([doc for doc in db.collection('students').stream()])
        courses_count = len([doc for doc in db.collection('courses').stream()])
        admins_count = len([doc for doc in db.collection('admins').stream()])
        department_heads_count = len([doc for doc in db.collection('departmentHeads').stream()])  # New count for department heads
        
        # Get role distribution data for pie chart
        role_distribution = [
            {"role": "Instructors", "count": instructors_count},
            {"role": "Admins", "count": admins_count},
            {"role": "Department Heads", "count": department_heads_count}  # Add department heads to role distribution
        ]
        
        return {
            "totalInstructors": instructors_count,
            "totalDepartmentHeads": department_heads_count,  # Changed from totalStudents to totalDepartmentHeads
            "totalCourses": courses_count,
            "totalAdmins": admins_count,
            "roleDistribution": role_distribution
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching admin platform metrics: {str(e)}")

@router.get("/admin/course-popularity")
async def get_admin_course_popularity(
    current_user: dict = Depends(verify_token)
):
    """Get course distribution by department for bar chart from Firestore"""
    try:
        # Verify user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to access admin metrics")
        
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get all courses
        courses_query = db.collection('courses').stream()
        
        # Group courses by department instead of course type
        course_distribution = {}
        for course_doc in courses_query:
            course_data = course_doc.to_dict() or {}
            # Use department field instead of courseType
            department = course_data.get('department', 'Unknown')
            
            if department not in course_distribution:
                course_distribution[department] = {
                    "department": department,
                    "total_courses": 0
                }
            
            course_distribution[department]["total_courses"] += 1
        
        # Convert to list
        course_distribution_list = list(course_distribution.values())
        
        # Sort alphabetically by department for consistent display
        course_distribution_list.sort(key=lambda x: x["department"])
        
        return course_distribution_list
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching course distribution data: {str(e)}")

@router.get("/admin/campus-performance")
async def get_admin_campus_performance(
    current_user: dict = Depends(verify_token)
):
    """Get campus-level performance metrics by calculating average grades and pass rates from sections and assessment data"""
    try:
        # Verify user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to access admin metrics")
        
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get all sections
        sections_query = db.collection('sections').stream()
        
        # Group performance data by campus
        campus_performance = {}
        
        # Process sections
        for section_doc in sections_query:
            section_data = section_doc.to_dict() or {}
            campus_id = section_data.get('campusId')
            campus_name = section_data.get('campus')
            
            # Skip sections without campus information
            if not campus_id:
                continue
                
            # Initialize campus data if not exists
            if campus_id not in campus_performance:
                campus_performance[campus_id] = {
                    "campus_id": campus_id,
                    "campus_name": campus_name or f'Campus {campus_id}',
                    "total_sections": 0,
                    "sum_average_grades": 0,
                    "total_pass": 0,
                    "total_fail": 0
                }
            
            # Increment section count
            campus_performance[campus_id]["total_sections"] += 1
            
            # Get average grade for this section
            average_grade = section_data.get('averageGrade', 0)
            campus_performance[campus_id]["sum_average_grades"] += average_grade
            
            # Process assessments to calculate pass/fail rates
            assessments = section_data.get('assessments', {})
            for assessment_name, assessment_data in assessments.items():
                grade_breakdown = assessment_data.get('gradeBreakdown', {})
                
                # Count pass grades (A, B, C, D)
                pass_count = (
                    grade_breakdown.get('A', 0) +
                    grade_breakdown.get('B', 0) +
                    grade_breakdown.get('C', 0) +
                    grade_breakdown.get('D', 0)
                )
                
                # Count fail grades (F)
                fail_count = grade_breakdown.get('F', 0)
                
                campus_performance[campus_id]["total_pass"] += pass_count
                campus_performance[campus_id]["total_fail"] += fail_count
        
        # Calculate final metrics for each campus
        campus_performance_list = []
        for campus_id, data in campus_performance.items():
            # Calculate average of average grades
            if data["total_sections"] > 0:
                campus_average_grade = round(data["sum_average_grades"] / data["total_sections"], 2)
            else:
                campus_average_grade = 0
            
            # Calculate pass rate
            total_grades = data["total_pass"] + data["total_fail"]
            if total_grades > 0:
                pass_rate = round((data["total_pass"] / total_grades) * 100, 2)
            else:
                pass_rate = 0
            
            campus_performance_list.append({
                "campus_id": data["campus_id"],
                "campus": data["campus_name"],
                "averageGrade": campus_average_grade,
                "passRate": pass_rate
            })
        
        return campus_performance_list
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching campus performance data: {str(e)}")


@router.get("/admin/filter-options")
async def get_admin_filter_options(
    current_user: dict = Depends(verify_token)
):
    """Get filter options for admin dashboard from Firestore with caching"""
    try:
        # Verify user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to access admin metrics")
        
        # Check cache first
        cache_key = "admin_filter_options"
        current_time = datetime.now().timestamp()
        
        if cache_key in filter_cache:
            cached_data, timestamp = filter_cache[cache_key]
            if current_time - timestamp < CACHE_DURATION:
                print("Returning cached filter options")
                return cached_data
        
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Use more efficient querying with limits and better data processing
        # Fetch only necessary data to reduce payload size
        
        # Fetch semesters with limit
        semesters_query = db.collection('semesters').limit(50).stream()
        semesters = []
        for semester_doc in semesters_query:
            semester_data = semester_doc.to_dict() or {}
            semesters.append({
                "id": semester_doc.id,
                "name": semester_data.get('semester', 'Unknown Semester')
            })
        
        # Fetch campuses with limit
        campuses_query = db.collection('campuses').limit(50).stream()
        campuses = []
        for campus_doc in campuses_query:
            campus_data = campus_doc.to_dict() or {}
            campus_name = campus_data.get('campusName')
            if campus_name:
                campuses.append(campus_name)
        
        # Fetch instructors with limit
        instructors_query = db.collection('instructors').limit(100).stream()
        instructors = []
        for instructor_doc in instructors_query:
            instructor_data = instructor_doc.to_dict() or {}
            instructor_name = instructor_data.get('display_name') or instructor_data.get('username') or instructor_data.get('email')
            if instructor_name:
                instructors.append({
                    "id": instructor_doc.id,
                    "name": instructor_name
                })
        
        # Fetch courses with limit and process efficiently
        courses_query = db.collection('courses').limit(200).stream()
        courses = []
        departments = set()
        
        for course_doc in courses_query:
            course_data = course_doc.to_dict() or {}
            course_id = course_doc.id
            course_name = course_data.get('courseName', 'Unknown Course')
            course_type = course_data.get('courseType', 'Unknown')
            department = course_data.get('department')
            
            courses.append({
                "id": course_id,
                "name": course_name,
                "type": course_type
            })
            
            if department:
                departments.add(department)
        
        # Get departments from admins collection instead of separate departments collection
        admins_query = db.collection('admins').limit(100).stream()
        admin_departments = set()
        for admin_doc in admins_query:
            admin_data = admin_doc.to_dict() or {}
            department = admin_data.get('department')
            if department:
                admin_departments.add(department)
        
        # Combine departments from courses and admins
        all_departments = departments.union(admin_departments)
        
        # Sort all lists efficiently
        semesters.sort(key=lambda x: x["name"])
        courses.sort(key=lambda x: x["name"])
        instructors.sort(key=lambda x: x["name"])
        instructors_list = [{"id": "all", "name": "All Instructors"}] + instructors[:50]  # Limit instructors list
        departments_list = sorted(list(all_departments))[:50]  # Limit departments list
        campuses_list = sorted(list(set(campuses)))[:30]  # Limit campuses list
        
        # Prepare response data
        response_data = {
            "semesters": semesters,
            "courses": courses[:100],  # Limit courses list
            "instructors": instructors_list,
            "departments": departments_list,
            "campuses": campuses_list
            # REMOVED: crns from return object
        }
        
        # Cache the response
        filter_cache[cache_key] = (response_data, current_time)
        
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching filter options: {str(e)}")

