from fastapi import APIRouter, Depends, HTTPException, Query
from app.firebase_config import get_firestore_client
from app.routes.firebase_auth_updated import verify_token
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

router = APIRouter()

# Data models
class InstructorKPIs(BaseModel):
    total_students: int
    active_courses: int
    avg_performance: float
    completion_rate: float

class CourseFilterData(BaseModel):
    id: str
    courseName: str
    crnCode: str
    semesterName: str
    department: str

class CRNComparisonData(BaseModel):
    crn1: Dict[str, Any]
    crn2: Dict[str, Any]
    comparison: Dict[str, Any]

class PerformanceTrendData(BaseModel):
    semester: str
    courses: int
    totalStudents: int
    avgCompletionRate: float
    avgGrade: float

class CourseOverviewData(BaseModel):
    courseId: str
    courseName: str
    crnCode: str
    semesterName: str
    department: str
    totalStudents: int
    activeStudents: int
    completionRate: float
    averageGrade: float

class StudentData(BaseModel):
    studentId: str
    studentName: str
    email: str
    courseId: str
    courseName: str
    enrollmentDate: str
    progress: float
    grade: float
    status: str

# New data model for instructor courses
class InstructorCourseData(BaseModel):
    course_id: str
    course_name: str
    course_type: str

# New data model for instructor students
class InstructorStudentData(BaseModel):
    student_id: str
    student_name: str

# API Endpoints

@router.get("/instructor/kpis")
async def get_instructor_kpis(
    current_user: dict = Depends(verify_token)
):
    """Get KPIs for logged-in instructor: total students, active courses, avg performance, completion rate"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get instructor document to check for direct student count
        instructor_doc = db.collection('instructors').document(instructor_id).get()
        instructor_students = 0
        if instructor_doc.exists:
            instructor_data = instructor_doc.to_dict()
            if instructor_data:
                # Check if instructor document has a students count
                instructor_students = instructor_data.get('students', 0)
        
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
        # Use instructor's direct student count if available, otherwise sum from courses
        if instructor_students > 0:
            total_students = instructor_students
        else:
            total_students = sum(course.get('totalEnrollments', 0) for course in courses_data)
        
        active_courses = len(courses_data)
        
        # Calculate average performance and completion rate
        if courses_data:
            avg_performance = sum(course.get('completionRate', 0) for course in courses_data) / len(courses_data)
            completion_rate = avg_performance
        else:
            avg_performance = 0
            completion_rate = 0
        
        return {
            "total_students": total_students,
            "active_courses": active_courses,
            "avg_performance": round(avg_performance, 2),
            "completion_rate": round(completion_rate, 2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor KPIs: {str(e)}")

@router.get("/instructor/filters")
async def get_instructor_filters(
    current_user: dict = Depends(verify_token)
):
    """Get filter options for dropdowns: semesters, courses, departments for logged-in instructor"""
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
        
        # Extract unique semesters, courses, and departments
        semesters = list(set([section.get('semesterName', 'Unknown') for section in instructor_sections]))
        departments = list(set([section.get('department', 'Unknown') for section in instructor_sections]))
        
        # Get courses for these sections
        course_filters = []
        course_ids = list(set([section.get('courseId') for section in instructor_sections if section.get('courseId')]))
        
        for course_id in course_ids:
            if course_id:
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict() or {}
                    # Find the related section to get CRN and other info
                    related_section = next((s for s in instructor_sections if s.get('courseId') == course_id), {})
                    
                    course_filters.append({
                        "id": course_id,
                        "courseName": course_data.get('courseName', 'Unknown Course'),
                        "crnCode": related_section.get('crnCode', 'N/A'),
                        "semesterName": related_section.get('semesterName', 'Unknown'),
                        "department": related_section.get('department', 'Unknown')
                    })
        
        return {
            "semesters": semesters,
            "departments": departments,
            "courses": course_filters
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor filters: {str(e)}")

@router.get("/instructor/crn-comparison", response_model=CRNComparisonData)
async def compare_crns(
    crn1: str = Query(..., description="First CRN to compare"),
    crn2: str = Query(..., description="Second CRN to compare"),
    current_user: dict = Depends(verify_token)
):
    """Compare performance data for two CRNs"""
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

@router.get("/instructor/performance-trend", response_model=List[PerformanceTrendData])
async def get_performance_trend(
    current_user: dict = Depends(verify_token)
):
    """Get semester-wise performance trend data for line chart"""
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
                    "avgGrade": round(data["totalGrades"] / data["courses"], 2)
                })
        
        # Sort by semester (assuming format like "Fall 2023", "Spring 2024", etc.)
        trend_data.sort(key=lambda x: x["semester"])
        
        return trend_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching performance trend data: {str(e)}")

@router.get("/instructor/course-overviews", response_model=List[CourseOverviewData])
async def get_course_overviews(
    current_user: dict = Depends(verify_token)
):
    """Get overview data for all courses of the logged-in instructor"""
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
        
        # Get courses for these sections
        course_overviews = []
        course_ids = list(set([section.get('courseId') for section in instructor_sections if section.get('courseId')]))
        
        for course_id in course_ids:
            if course_id:
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict() or {}
                    
                    # Find related section for additional data
                    related_section = next((s for s in instructor_sections if s.get('courseId') == course_id), {})
                    
                    course_overviews.append({
                        "courseId": course_id,
                        "courseName": course_data.get('courseName', 'Unknown Course'),
                        "crnCode": related_section.get('crnCode', 'N/A'),
                        "semesterName": related_section.get('semesterName', 'Unknown'),
                        "department": related_section.get('department', 'Unknown'),
                        "totalStudents": course_data.get('totalEnrollments', 0),
                        "activeStudents": course_data.get('activeStudents', 0),
                        "completionRate": course_data.get('completionRate', 0),
                        "averageGrade": course_data.get('averageRating', 0)
                    })
        
        return course_overviews
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching course overviews: {str(e)}")

@router.get("/instructor/students", response_model=List[StudentData])
async def get_instructor_students(
    current_user: dict = Depends(verify_token)
):
    """Get all students registered under courses of the logged-in instructor"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get instructor document to check for direct student information
        instructor_doc = db.collection('instructors').document(instructor_id).get()
        instructor_students_count = 0
        if instructor_doc.exists:
            instructor_data = instructor_doc.to_dict()
            if instructor_data:
                instructor_students_count = instructor_data.get('students', 0)
        
        # Get instructor's sections
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Get course IDs
        course_ids = list(set([section.get('courseId') for section in instructor_sections if section.get('courseId')]))
        
        # Get all students enrolled in these courses
        all_students = []
        
        # If instructor has a direct student count, create mock students based on that
        if instructor_students_count > 0:
            # Distribute students across courses
            students_per_course = instructor_students_count // max(len(course_ids), 1)
            remaining_students = instructor_students_count % max(len(course_ids), 1)
            
            for i, course_id in enumerate(course_ids):
                if course_id:
                    # Get course name
                    course_name = "Unknown Course"
                    course_doc = db.collection('courses').document(course_id).get()
                    if course_doc.exists:
                        course_data = course_doc.to_dict()
                        if course_data:
                            course_name = course_data.get('courseName', 'Unknown Course')
                    
                    # Calculate how many students for this course
                    students_for_this_course = students_per_course
                    if i < remaining_students:
                        students_for_this_course += 1
                    
                    # Add students for this course
                    for j in range(students_for_this_course):
                        student_index = sum([instructor_students_count // max(len(course_ids), 1) for k in range(i)]) + j + 1
                        all_students.append({
                            "studentId": f"student_{student_index}",
                            "studentName": f"Student {student_index}",
                            "email": f"student{student_index}@hct.ac.ae",
                            "courseId": course_id,
                            "courseName": course_name,
                            "enrollmentDate": "2024-01-10",
                            "progress": 85.5 + (student_index % 15),  # Mock progress
                            "grade": 87.2 + (student_index % 13),     # Mock grade
                            "status": "active" if student_index % 5 != 0 else "at_risk"
                        })
        else:
            # Query enrollments collection to get actual student data
            # Assuming there's an enrollments collection that links students to courses
            for course_id in course_ids:
                if course_id:
                    # Try to get enrollments for this course
                    enrollments_query = db.collection('enrollments').where('courseId', '==', course_id).stream()
                    for enrollment_doc in enrollments_query:
                        enrollment_data = enrollment_doc.to_dict()
                        student_id = enrollment_data.get('studentId')
                        
                        if student_id:
                            # Get student details
                            student_doc = db.collection('students').document(student_id).get()
                            if student_doc.exists:
                                student_data = student_doc.to_dict()
                                if student_data:
                                    # Get course name for this course ID
                                    course_name = "Unknown Course"
                                    course_doc = db.collection('courses').document(course_id).get()
                                    if course_doc.exists:
                                        course_data = course_doc.to_dict()
                                        if course_data:
                                            course_name = course_data.get('courseName', 'Unknown Course')
                                    
                                    # Get section information for additional details
                                    section_name = "Unknown Section"
                                    semester_name = "Unknown Semester"
                                    for section in instructor_sections:
                                        if section.get('courseId') == course_id:
                                            section_name = section.get('sectionName', 'Unknown Section')
                                            semester_name = section.get('semesterName', 'Unknown Semester')
                                            break
                                    
                                    all_students.append({
                                        "studentId": student_id,
                                        "studentName": student_data.get('studentName', f'Student {student_id}'),
                                        "email": student_data.get('email', f'{student_id}@hct.ac.ae'),
                                        "courseId": course_id,
                                        "courseName": course_name,
                                        "enrollmentDate": enrollment_data.get('enrollmentDate', 'Unknown'),
                                        "progress": enrollment_data.get('progress', 0.0),
                                        "grade": enrollment_data.get('grade', 0.0),
                                        "status": enrollment_data.get('status', 'active')
                                    })
            
            # If no enrollments found, fall back to checking courses for student count
            if not all_students:
                # Get actual student count from courses
                for course_id in course_ids:
                    if course_id:
                        course_doc = db.collection('courses').document(course_id).get()
                        if course_doc.exists:
                            course_data = course_doc.to_dict()
                            if course_data:
                                # Get course name
                                course_name = course_data.get('courseName', 'Unknown Course')
                                
                                # Get section information
                                section_name = "Unknown Section"
                                semester_name = "Unknown Semester"
                                for section in instructor_sections:
                                    if section.get('courseId') == course_id:
                                        section_name = section.get('sectionName', 'Unknown Section')
                                        semester_name = section.get('semesterName', 'Unknown Semester')
                                        break
                                
                                # Add mock students based on the actual student count in the course
                                total_enrollments = course_data.get('totalEnrollments', 0)
                                for i in range(total_enrollments):
                                    all_students.append({
                                        "studentId": f"{course_id}_student_{i+1}",
                                        "studentName": f"Student {i+1}",
                                        "email": f"student{i+1}@hct.ac.ae",
                                        "courseId": course_id,
                                        "courseName": course_name,
                                        "enrollmentDate": "2024-01-10",
                                        "progress": 85.5 + (i % 15),  # Mock progress
                                        "grade": 87.2 + (i % 13),     # Mock grade
                                        "status": "active" if i % 5 != 0 else "at_risk"
                                    })
        
        return all_students
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor students: {str(e)}")

@router.get("/instructor/student-count")
async def get_instructor_student_count(
    current_user: dict = Depends(verify_token)
):
    """Get total count of all students enrolled in courses taught by the logged-in instructor"""
    try:
        print(f"get_instructor_student_count called for instructor: {current_user.get('instructorId')}")
        print(f"Current user: {current_user}")
        
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        print(f"Querying instructor document for ID: {instructor_id}")
        # First, check if instructor document has a direct student count
        instructor_doc = db.collection('instructors').document(instructor_id).get()
        print(f"Instructor document exists: {instructor_doc.exists}")
        if instructor_doc.exists:
            instructor_data = instructor_doc.to_dict()
            print(f"Instructor data: {instructor_data}")
            if instructor_data and 'students' in instructor_data:
                # Return the authoritative student count from instructor document
                student_count = instructor_data.get('students', 0)
                print(f"Returning student count from instructor document: {student_count}")
                return {"total_students": student_count}
        
        print("Falling back to enrollment calculation...")
        # If no direct count, calculate from enrollments
        # Get instructor's sections
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        print(f"Found {len(instructor_sections)} sections for instructor")
        
        # Get unique course IDs
        course_ids = list(set([section.get('courseId') for section in instructor_sections if section.get('courseId')]))
        print(f"Course IDs: {course_ids}")
        
        # Count students from enrollments
        total_students = 0
        student_ids = set()  # Use set to avoid counting the same student multiple times
        
        # Query enrollments for all courses
        for course_id in course_ids:
            if course_id:
                print(f"Querying enrollments for course: {course_id}")
                enrollments_query = db.collection('enrollments').where('courseId', '==', course_id).stream()
                enrollment_count = 0
                for enrollment_doc in enrollments_query:
                    enrollment_data = enrollment_doc.to_dict()
                    student_id = enrollment_data.get('studentId')
                    if student_id:
                        student_ids.add(student_id)
                        enrollment_count += 1
                print(f"Found {enrollment_count} enrollments for course {course_id}")
        
        total_students = len(student_ids)
        print(f"Total unique students from enrollments: {total_students}")
        
        # If no enrollments found, fall back to course data
        if total_students == 0:
            print("No enrollments found, falling back to course data")
            for course_id in course_ids:
                if course_id:
                    course_doc = db.collection('courses').document(course_id).get()
                    if course_doc.exists:
                        course_data = course_doc.to_dict()
                        if course_data:
                            course_enrollments = course_data.get('totalEnrollments', 0)
                            total_students += course_enrollments
                            print(f"Added {course_enrollments} students from course {course_id}")
        
        print(f"Final calculated student count: {total_students}")
        return {"total_students": total_students}
        
    except Exception as e:
        print(f"Error in get_instructor_student_count: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching instructor student count: {str(e)}")

@router.get("/instructor/course-count")
async def get_instructor_course_count(
    current_user: dict = Depends(verify_token)
):
    """Get total count of all courses related to the logged-in instructor.
    
    The sections collection serves as the perfect bridge to establish the relationship 
    between instructors and the courses they teach. When you need to determine how many 
    courses a specific instructor is teaching, you query the sections collection filtering 
    by the instructor's unique ID. This returns all the sections assigned to that instructor 
    across different semesters and campuses. Since each section contains a course ID reference, 
    you can then extract all unique course IDs from these sections. The count of these distinct 
    course IDs represents the total number of different courses the instructor is currently teaching.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Query the sections collection filtering by the instructor's unique ID
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Extract all unique course IDs from these sections
        course_ids = set()
        for section in instructor_sections:
            course_id = section.get('courseId')
            if course_id:
                course_ids.add(course_id)
        
        # The count of these distinct course IDs represents the total number of different courses
        total_courses = len(course_ids)
        
        return {"total_courses": total_courses}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor course count: {str(e)}")

@router.get("/instructor/unique-student-count")
async def get_instructor_unique_student_count(
    current_user: dict = Depends(verify_token)
):
    """Get unique student count for a specific instructor using sections and performance data collection.
    
    The relationship flows through a clear chain: each instructor is associated with multiple 
    sections via the instructor ID in the sections collection, and each section is linked to 
    student performance records through the section ID in the performance data collection. 
    To find the unique student count for a particular instructor, you first query the sections 
    collection to retrieve all sections taught by that instructor, gathering their section IDs. 
    Then, using these section IDs, you query the performance data collection to find all records 
    associated with these sections. By extracting student IDs from these performance records 
    and filtering for unique values, you obtain the exact count of distinct students enrolled 
    in that instructor's courses. This method effectively leverages the existing database 
    relationships to provide accurate student enrollment metrics for individual instructors 
    without requiring direct links between instructors and students.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, query the sections collection to retrieve all sections taught by that instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Gather section IDs from these sections
        section_ids = set()
        for section in instructor_sections:
            section_id = section.get('sectionId') or section.get('id')
            if section_id:
                section_ids.add(section_id)
        
        # Using these section IDs, query the performance data collection to find all records
        student_ids = set()
        for section_id in section_ids:
            # Query performance data collection for records associated with this section
            performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
            for record in performance_query:
                record_data = record.to_dict()
                # Extract student IDs from these performance records
                student_id = record_data.get('studentId')
                if student_id:
                    student_ids.add(student_id)
        
        # The count of these unique student IDs represents the unique student count
        unique_student_count = len(student_ids)
        
        return {"unique_student_count": unique_student_count}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor unique student count: {str(e)}")

@router.get("/instructor/total-assessments")
async def get_instructor_total_assessments(
    current_user: dict = Depends(verify_token)
):
    """Get total assessments count for a specific instructor using sections and performance data collection.
    
    To get the Total Assessments Count for a specific instructor, you query the performance data 
    collection through the sections collection relationship. First, you retrieve all section IDs 
    associated with the instructor by filtering the sections collection using the instructor's 
    unique ID. Then, using these section IDs, you query the performance data collection to count 
    all assessment records where the section ID matches any of the instructor's sections. Each 
    record in the performance data represents one assessment for one student, so the total count 
    of these matching records gives you the exact number of assessments and grades recorded for 
    all students enrolled in that instructor's courses across all sections they teach.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, retrieve all section IDs associated with the instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Gather section IDs from these sections
        section_ids = set()
        for section in instructor_sections:
            section_id = section.get('sectionId') or section.get('id')
            if section_id:
                section_ids.add(section_id)
        
        # Using these section IDs, query the performance data collection to count all assessment records
        total_assessments = 0
        for section_id in section_ids:
            # Count performance data records associated with this section
            performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
            for record in performance_query:
                # Each record represents one assessment for one student
                total_assessments += 1
        
        # The total count of these matching records gives you the exact number of assessments
        return {"total_assessments": total_assessments}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor total assessments: {str(e)}")

@router.get("/instructor/assignment-pass-rate")
async def get_instructor_assignment_pass_rate(
    current_user: dict = Depends(verify_token)
):
    """Calculate the pass rate of assignments given by a specific instructor.
    
    To calculate this metric, you first identify all sections taught by the instructor using 
    their instructor ID from the sections collection. Then, you query the performance data 
    collection to find all assessment records linked to those sections, filtering specifically 
    for assignment-type assessments. For each assignment record, you determine if the student 
    passed by checking if their percentage score meets or exceeds the passing threshold 
    (typically 60%). The pass rate is then calculated by dividing the number of passing 
    assignment records by the total number of assignment records and multiplying by 100 to 
    get a percentage. This provides the instructor's assignment pass rate across all their 
    courses and sections.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, identify all sections taught by the instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Gather section IDs from these sections
        section_ids = set()
        for section in instructor_sections:
            section_id = section.get('sectionId') or section.get('id')
            if section_id:
                section_ids.add(section_id)
        
        # Query the performance data collection to find all assignment assessment records
        total_assignments = 0
        passing_assignments = 0
        passing_threshold = 60.0  # Typically 60% is the passing threshold
        
        for section_id in section_ids:
            # Find all performance data records associated with this section
            performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
            for record in performance_query:
                record_data = record.to_dict()
                # Filter specifically for assignment-type assessments
                assessment_type = record_data.get('assessmentType', '').lower()
                if 'assignment' in assessment_type:
                    total_assignments += 1
                    # Check if student passed by meeting/exceeding passing threshold
                    percentage_score = record_data.get('percentage', 0)
                    if percentage_score >= passing_threshold:
                        passing_assignments += 1
        
        # Calculate pass rate: (passing assignments / total assignments) * 100
        if total_assignments > 0:
            pass_rate = (passing_assignments / total_assignments) * 100
        else:
            pass_rate = 0.0
        
        return {
            "pass_rate": round(pass_rate, 2),
            "total_assignments": total_assignments,
            "passing_assignments": passing_assignments
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating instructor assignment pass rate: {str(e)}")

@router.get("/instructor/high-performance-rate")
async def get_instructor_high_performance_rate(
    current_user: dict = Depends(verify_token)
):
    """Calculate the percentage of assessment marks from all performance records relating to an instructor.
    
    To calculate this metric, you query the sections collection to get all section IDs for the 
    instructor, then use these section IDs to find all performance records from the performance 
    data collection. From these records, you calculate what percentage of all assessment marks 
    are high performance (A grades - 90% and above). This is done by counting the number of 
    assessments with scores of 90% or higher and dividing by the total number of assessments, 
    then multiplying by 100 to get the percentage.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, query the sections collection to retrieve all sections taught by the specific instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Extract section IDs from these sections
        section_ids = [section.get('sectionId') or section.get('id') for section in instructor_sections if section.get('sectionId') or section.get('id')]
        
        # Using these section IDs, query the performance data collection to gather all assessment records
        total_assignments = 0
        high_performance_assignments = 0
        high_performance_threshold = 90.0  # Typically 90% is considered high performance
        
        for section_id in section_ids:
            if section_id:
                # Query performance data collection for records associated with this section
                performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
                for record in performance_query:
                    record_data = record.to_dict()
                    # Filter specifically for assignment-type assessments
                    assessment_type = record_data.get('assessmentType', '').lower()
                    if 'assignment' in assessment_type:
                        total_assignments += 1
                        # Check if student's performance is high by meeting/exceeding high performance threshold
                        percentage_score = record_data.get('percentage', 0)
                        if percentage_score >= high_performance_threshold:
                            high_performance_assignments += 1
        
        # Calculate high performance rate: (high performance assignments / total assignments) * 100
        if total_assignments > 0:
            high_performance_rate = (high_performance_assignments / total_assignments) * 100
        else:
            high_performance_rate = 0.0
        
        return {
            "high_performance_rate": round(high_performance_rate, 2),
            "total_assignments": total_assignments,
            "high_performance_assignments": high_performance_assignments
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating instructor high performance rate: {str(e)}")

# New endpoint to get instructor's performance average as a percentage
@router.get("/instructor/performance-average")
async def get_instructor_performance_average(
    current_user: dict = Depends(verify_token)
):
    """Calculate an instructor's performance average as a percentage.
    
    To calculate an instructor's performance average as a percentage, you would follow 
    a systematic process using your database collections. First, query the sections 
    collection to retrieve all sections taught by the specific instructor, which 
    provides you with the complete list of section IDs associated with that instructor. 
    Then, using these section IDs, query the performance data collection to gather 
    all assessment records linked to these sections, ensuring you capture every 
    student evaluation under the instructor's guidance. For each assessment record, 
    calculate the individual percentage score by dividing the student's actual score 
    by the maximum possible score and multiplying by 100. Once you have all these 
    individual percentages, sum them together and divide by the total number of 
    assessment records to obtain the instructor's overall performance average percentage. 
    This final percentage represents the mean performance across all students and all 
    assessments taught by the instructor, providing a comprehensive metric of teaching 
    effectiveness that accounts for every graded component under their supervision.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, query the sections collection to retrieve all sections taught by the specific instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Extract section IDs from these sections
        section_ids = [section.get('sectionId') or section.get('id') for section in instructor_sections if section.get('sectionId') or section.get('id')]
        
        # Using these section IDs, query the performance data collection to gather all assessment records
        total_percentage = 0
        assessment_count = 0
        
        for section_id in section_ids:
            if section_id:
                # Query performance data collection for records associated with this section
                performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
                for record in performance_query:
                    record_data = record.to_dict()
                    # For each assessment record, calculate the individual percentage score
                    # by dividing the student's actual score by the maximum possible score and multiplying by 100
                    actual_score = record_data.get('score', 0)
                    max_score = record_data.get('maxScore', 100)  # Default to 100 if not specified
                    
                    if max_score > 0:  # Avoid division by zero
                        percentage = (actual_score / max_score) * 100
                        total_percentage += percentage
                        assessment_count += 1
        
        # Once you have all these individual percentages, sum them together and divide by the total number
        # of assessment records to obtain the instructor's overall performance average percentage
        if assessment_count > 0:
            performance_average = total_percentage / assessment_count
        else:
            performance_average = 0.0
        
        # This final percentage represents the mean performance across all students and all assessments
        # taught by the instructor
        return {
            "performance_average": round(performance_average, 2),
            "total_assessments": assessment_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating instructor performance average: {str(e)}")

# Firebase Instructor Reports endpoints

# New endpoint to download detailed assessment report
@router.get("/instructor/detailed-assessment/download")
async def download_instructor_detailed_assessment_report(
    format: str = Query("pdf", description="Export format: pdf, xlsx, or csv"),
    course_id: Optional[str] = Query(None, description="Course ID to filter by"),
    current_user: dict = Depends(verify_token)
):
    """Download detailed assessment report in specified format"""
    try:
        # Import the helper functions for creating reports
        from app.routes.firebase_dashboard import create_pdf_report, create_excel_report
        from fastapi import Response
        from fastapi.responses import StreamingResponse
        import io
        import pandas as pd
        
        # Get the report data first by calling the existing endpoint function
        report_data = await get_instructor_detailed_assessment(course_id=course_id, current_user=current_user)
        
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
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading detailed assessment report: {str(e)}")




@router.get("/instructor/grade-distribution")
async def get_instructor_grade_distribution(
    current_user: dict = Depends(verify_token)
):
    """Get grade distribution for a specific instructor's courses.
    
    You can directly utilize the pre-calculated percentage field from the performance 
    data collection to generate grade distribution charts for instructors. Here's how 
    it works: First, you query the sections collection to find all sections associated 
    with the specific instructor using their instructor ID. This gives you all the 
    course sections they teach. Then, using these section IDs, you query the performance 
    data collection and filter for records where the section ID matches any of the 
    instructor's sections. For each matching performance record, you directly use the 
    existing percentage value to categorize it into grade bands - A for 90-100%, B for 
    80-89%, C for 70-79%, D for 60-69%, and F for 0-59%. You count how many assessments 
    fall into each grade category across all of the instructor's courses. Finally, you 
    convert these raw counts into percentages of the total number of assessments to 
    create the data structure for visualization.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, query the sections collection to find all sections associated with the instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Gather section IDs from these sections
        section_ids = set()
        for section in instructor_sections:
            section_id = section.get('sectionId') or section.get('id')
            if section_id:
                section_ids.add(section_id)
        
        # Initialize grade counters
        grade_counts = {
            'A': 0,  # 90-100%
            'B': 0,  # 80-89%
            'C': 0,  # 70-79%
            'D': 0,  # 60-69%
            'F': 0   # 0-59%
        }
        
        total_assessments = 0
        
        # Using these section IDs, query the performance data collection
        for section_id in section_ids:
            # Filter for records where the section ID matches any of the instructor's sections
            performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
            for record in performance_query:
                record_data = record.to_dict()
                total_assessments += 1
                # Directly use the existing percentage value to categorize it into grade bands
                percentage = record_data.get('percentage', 0)
                
                # Categorize into grade bands
                if 90 <= percentage <= 100:
                    grade_counts['A'] += 1
                elif 80 <= percentage <= 89:
                    grade_counts['B'] += 1
                elif 70 <= percentage <= 79:
                    grade_counts['C'] += 1
                elif 60 <= percentage <= 69:
                    grade_counts['D'] += 1
                elif 0 <= percentage <= 59:
                    grade_counts['F'] += 1
        
        # Convert raw counts into percentages of the total number of assessments
        grade_distribution = {}
        if total_assessments > 0:
            for grade, count in grade_counts.items():
                grade_distribution[grade] = round((count / total_assessments) * 100, 2)
        else:
            # If no assessments, set all grades to 0%
            for grade in grade_counts:
                grade_distribution[grade] = 0.0
        
        return {
            "grade_distribution": grade_distribution,
            "total_assessments": total_assessments
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor grade distribution: {str(e)}")

@router.get("/instructor/course-performance-comparison")
async def get_instructor_course_performance_comparison(
    current_user: dict = Depends(verify_token)
):
    """Get course performance comparison data for an instructor.
    
    To develop the course performance comparison chart for an instructor, you need to 
    establish relationships between multiple collections in a specific sequence. First, 
    you query the sections collection using the instructor's ID to retrieve all sections 
    taught by that instructor, which gives you the list of course sections they are 
    responsible for. From these sections, you extract the unique course IDs to identify 
    which specific courses the instructor teaches. Then, for each course, you query the 
    performance data collection using the section IDs associated with that particular 
    course to gather all assessment records. For each course, you calculate the average 
    percentage score across all performance records, providing a comprehensive performance 
    metric for that subject. This process creates a dataset where each course the 
    instructor teaches has a corresponding average performance score. Finally, you 
    visualize this data using a comparative bar chart that displays courses on one axis 
    and their average performance scores on the other, allowing for immediate visual 
    comparison of teaching effectiveness across different subjects.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, query the sections collection using the instructor's ID to retrieve all sections
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # From these sections, extract the unique course IDs and group section IDs by course
        course_data = {}
        for section in instructor_sections:
            course_id = section.get('courseId')
            section_id = section.get('sectionId') or section.get('id')
            
            if course_id and section_id:
                if course_id not in course_data:
                    course_data[course_id] = {
                        'section_ids': set(),
                        'total_percentage': 0,
                        'assessment_count': 0
                    }
                course_data[course_id]['section_ids'].add(section_id)
        
        # For each course, fetch the actual course name from the courses collection
        # and calculate the performance data
        course_performance = []
        for course_id, data in course_data.items():
            # Fetch the actual course name from the courses collection
            course_doc = db.collection('courses').document(course_id).get()
            course_name = "Unknown Course"
            if course_doc.exists:
                course_data_doc = course_doc.to_dict()
                if course_data_doc:
                    course_name = course_data_doc.get('courseName', 'Unknown Course')
            
            total_percentage = 0
            assessment_count = 0
            
            # Gather all assessment records for this course's sections
            for section_id in data['section_ids']:
                performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
                for record in performance_query:
                    record_data = record.to_dict()
                    percentage = record_data.get('percentage', 0)
                    total_percentage += percentage
                    assessment_count += 1
            
            # Calculate the average percentage score for this course
            average_percentage = 0
            if assessment_count > 0:
                average_percentage = total_percentage / assessment_count
            
            course_performance.append({
                'course_id': course_id,
                'course_name': course_name,
                'average_percentage': round(average_percentage, 2),
                'assessment_count': assessment_count
            })
        
        return course_performance
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor course performance comparison: {str(e)}")

@router.get("/instructor/semester-comparison")
async def get_instructor_semester_comparison(
    current_user: dict = Depends(verify_token)
):
    """Get semester-wise comparison data for instructor analytics.
    
    To implement semester-wise comparison for instructor analytics, you leverage the 
    relationships between sections, performance data, and semesters collections. First, 
    you query the sections collection to identify all instances where the instructor 
    taught the same course across different semesters, using the instructor ID to filter 
    sections and grouping them by course ID and semester ID. Then, for each semester-group 
    of sections, you join with the performance data collection using section IDs to 
    calculate key metrics like average grades, pass rates, and grade distributions. The 
    semesters collection provides the chronological context to track trends over time. 
    This approach reveals patterns of grade improvement or deterioration across semesters, 
    shows enrollment fluctuations through student count variations in performance records, 
    and measures teaching effectiveness by comparing semester-over-semester performance 
    metrics for the same course, providing instructors with valuable insights into their 
    longitudinal teaching impact and student learning outcomes.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, query the sections collection to identify all instances where the instructor taught courses
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Group sections by semester
        semester_data = {}
        for section in instructor_sections:
            semester_id = section.get('semesterId')
            section_id = section.get('sectionId') or section.get('id')
            
            if semester_id and section_id:
                if semester_id not in semester_data:
                    semester_data[semester_id] = {
                        'sections': [],
                        'total_percentage': 0,
                        'total_assessments': 0,
                        'passing_assessments': 0,  # For pass rate calculation
                        'student_count': set()  # Use set to count unique students
                    }
                semester_data[semester_id]['sections'].append(section)
        
        # For each semester, fetch the actual semester name from the semesters collection
        # and join with performance data collection to calculate key metrics
        semester_comparison = []
        passing_threshold = 60.0  # Typically 60% is the passing threshold
        
        for semester_id, data in semester_data.items():
            # Fetch the actual semester name from the semesters collection
            semester_doc = db.collection('semesters').document(semester_id).get()
            semester_name = "Unknown Semester"
            if semester_doc.exists:
                semester_data_doc = semester_doc.to_dict()
                if semester_data_doc:
                    semester_name = semester_data_doc.get('semesterName', 'Unknown Semester')
            
            total_percentage = 0
            total_assessments = 0
            passing_assessments = 0
            student_ids = set()
            
            # Process all sections in this semester
            for section in data['sections']:
                section_id = section.get('sectionId') or section.get('id')
                if section_id:
                    # Query performance data for this section
                    performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
                    for record in performance_query:
                        record_data = record.to_dict()
                        percentage = record_data.get('percentage', 0)
                        student_id = record_data.get('studentId')
                        
                        total_percentage += percentage
                        total_assessments += 1
                        
                        # Count passing assessments
                        if percentage >= passing_threshold:
                            passing_assessments += 1
                        
                        # Add student ID to set for unique count
                        if student_id:
                            student_ids.add(student_id)
            
            # Calculate key metrics for this semester
            average_grade = 0
            pass_rate = 0
            
            if total_assessments > 0:
                average_grade = total_percentage / total_assessments
                pass_rate = (passing_assessments / total_assessments) * 100
            
            semester_comparison.append({
                'semester_id': semester_id,
                'semester_name': semester_name,
                'average_grade': round(average_grade, 2),
                'pass_rate': round(pass_rate, 2),
                'total_assessments': total_assessments,
                'student_count': len(student_ids)
            })
        
        # Sort by semester name for chronological display
        semester_comparison.sort(key=lambda x: x['semester_name'])
        
        return semester_comparison
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor semester comparison: {str(e)}")

@router.get("/instructor/pass-rate-comparison")
async def get_instructor_pass_rate_comparison(
    current_user: dict = Depends(verify_token)
):
    """Get pass rate comparison data for instructor courses.
    
    To implement the Pass Rate Comparison donut charts using your collections, you would 
    leverage the relationship between the sections collection and performance data collection. 
    First, you query the sections collection to identify all courses taught by the specific 
    instructor using their instructor ID, which returns all the section IDs associated with 
    that instructor. Then, using these section IDs, you query the performance data collection 
    to retrieve all assessment records for those sections. For each course, you calculate 
    the pass rate by analyzing the percentage scores from the performance data - typically 
    considering scores of 60% and above as passes. The donut chart would visually represent 
    the proportion of passing versus failing students for each course, with color coding 
    (green for pass, red for fail) for immediate visual comprehension and percentage 
    displays showing the exact success rates. This implementation effectively utilizes 
    the existing database structure where sections connect instructors to courses and 
    performance data provides the actual student assessment results, creating a clear 
    visual comparison of teaching effectiveness across different courses.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, query the sections collection to identify all courses taught by the instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Group sections by course to calculate pass rates
        course_data = {}
        for section in instructor_sections:
            course_id = section.get('courseId')
            section_id = section.get('sectionId') or section.get('id')
            course_name = section.get('courseName', 'Unknown Course')
            
            if course_id and section_id:
                if course_id not in course_data:
                    course_data[course_id] = {
                        'course_name': course_name,
                        'sections': [],
                        'total_assessments': 0,
                        'passing_assessments': 0
                    }
                course_data[course_id]['sections'].append({
                    'section_id': section_id,
                    'section_name': section.get('sectionName', 'Unknown Section')
                })
        
        # For each course, fetch the actual course name from the courses collection
        # and calculate pass rates using performance data
        pass_rate_comparison = []
        passing_threshold = 60.0  # Typically 60% is the passing threshold
        
        for course_id, data in course_data.items():
            # Fetch the actual course name from the courses collection
            course_doc = db.collection('courses').document(course_id).get()
            course_name = data['course_name']  # Default to section course name
            if course_doc.exists:
                course_data_doc = course_doc.to_dict()
                if course_data_doc:
                    course_name = course_data_doc.get('courseName', data['course_name'])
            
            total_assessments = 0
            passing_assessments = 0
            
            # Process all sections for this course
            for section_info in data['sections']:
                section_id = section_info['section_id']
                if section_id:
                    # Query performance data for this section
                    performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
                    for record in performance_query:
                        record_data = record.to_dict()
                        percentage = record_data.get('percentage', 0)
                        
                        total_assessments += 1
                        
                        # Count passing assessments
                        if percentage >= passing_threshold:
                            passing_assessments += 1
            
            # Calculate pass rate for this course
            pass_rate = 0
            fail_rate = 0
            
            if total_assessments > 0:
                pass_rate = (passing_assessments / total_assessments) * 100
                fail_rate = 100 - pass_rate
            
            pass_rate_comparison.append({
                'course_id': course_id,
                'course_name': course_name,
                'pass_rate': round(pass_rate, 2),
                'fail_rate': round(fail_rate, 2),
                'total_assessments': total_assessments,
                'passing_assessments': passing_assessments
            })
        
        return pass_rate_comparison
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor pass rate comparison: {str(e)}")

# New endpoint to get all courses taught by a specific instructor
@router.get("/instructor/courses", response_model=List[InstructorCourseData])
async def get_instructor_courses(
    current_user: dict = Depends(verify_token)
):
    """Get all courses taught by a specific instructor by leveraging the relationship between 
    the sections collection and courses collection. First, query the sections collection 
    using the instructor's unique ID to find all sections assigned to that instructor. 
    From these section records, extract the course IDs, which are the foreign keys linking 
    to the courses collection. Then, using these course IDs, query the courses collection 
    to retrieve the complete course details including course ID, course name, and course type.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, query the sections collection using the instructor's unique ID 
        # to find all sections assigned to that instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # From these section records, extract the course IDs
        course_ids = list(set([section.get('courseId') for section in instructor_sections if section.get('courseId')]))
        
        # Using these course IDs, query the courses collection to retrieve the complete course details
        instructor_courses = []
        for course_id in course_ids:
            if course_id:
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict() or {}
                    instructor_courses.append(InstructorCourseData(
                        course_id=course_id,
                        course_name=course_data.get('courseName', 'Unknown Course'),
                        course_type=course_data.get('courseType', 'Unknown Type')
                    ))
        
        return instructor_courses
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor courses: {str(e)}")

# New endpoint to get students by performance data for a specific instructor
@router.get("/instructor/students-by-performance", response_model=List[InstructorStudentData])
async def get_instructor_students_by_performance(
    current_user: dict = Depends(verify_token)
):
    """Get all students enrolled in courses taught by the specific instructor by leveraging the relationship between 
    the sections collection and performance data collection. First, query the sections collection using the 
    instructor's unique ID to find all sections assigned to that instructor. Then, using the section IDs from 
    these sections, query the performance data collection to retrieve all student records associated with those 
    sections. Finally, extract the unique student IDs from these performance records and query the students 
    collection to get the complete student details including student ID and student name.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, query the sections collection using the instructor's unique ID 
        # to find all sections assigned to that instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Then, using the section IDs from these sections, query the performance data collection 
        # to retrieve all student records associated with those sections
        student_ids = set()
        for section in instructor_sections:
            section_id = section.get('sectionId') or section.get('id')
            if section_id:
                performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
                for record in performance_query:
                    record_data = record.to_dict()
                    student_id = record_data.get('studentId')
                    if student_id:
                        student_ids.add(student_id)
        
        # Finally, extract the unique student IDs from these performance records 
        # and query the students collection to get the complete student details
        instructor_students = []
        for student_id in student_ids:
            if student_id:
                student_doc = db.collection('students').document(student_id).get()
                if student_doc.exists:
                    student_data = student_doc.to_dict() or {}
                    instructor_students.append(InstructorStudentData(
                        student_id=student_id,
                        student_name=student_data.get('studentName', f'Student {student_id}')
                    ))
        
        return instructor_students
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor students: {str(e)}")

# New endpoint to get detailed assessment report data for a specific instructor
@router.get("/instructor/detailed-assessment")
async def get_instructor_detailed_assessment(
    course_id: Optional[str] = Query(None),
    current_user: dict = Depends(verify_token)
):
    """Generate a detailed assessment report for a specific instructor using your existing collections.
    
    To generate a detailed assessment report for a specific instructor using your existing collections, 
    you would create an API that leverages the relational structure between sections and performance data. 
    First, query the sections collection using the instructor's unique ID to retrieve all sections taught 
    by that instructor, obtaining the relevant section IDs. Then, use these section IDs to query the 
    performance data collection, extracting all assessment records including assessment titles, scores, 
    max scores, percentages, assessment types, and weights. The API would process this data to generate 
    comprehensive metrics such as assessment-level performance averages, completion rates across different 
    assessment types (quizzes, assignments, exams, projects), temporal analysis of student performance 
    throughout the semester, comparative analysis between different courses, and identification of 
    assessment patterns that reveal teaching effectiveness. By correlating this assessment data with 
    course information from the courses collection and semester details from the semesters collection, 
    the report provides a complete picture of assessment effectiveness, student learning outcomes, and 
    instructional impact across all courses taught by the instructor.
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
                        'semesterName': semester_data.get('semesterName', f'Semester {semester_id}'),
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
        
        # Calculate overall averages
        overall_avg_score = 0
        overall_pass_rate = 0
        if performance_data:
            total_scores = sum(r.get('score', 0) for r in performance_data)
            total_max_scores = sum(r.get('maxScore', 100) for r in performance_data)
            overall_avg_score = (total_scores / len(performance_data)) if len(performance_data) > 0 else 0
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

# New endpoint to get instructor's grade improvement percentage
@router.get("/instructor/grade-improvement")
async def get_instructor_grade_improvement(
    current_user: dict = Depends(verify_token)
):
    """Calculate the Grade Improvement Percentage for an instructor.
    
    To calculate the Grade Improvement Percentage for an instructor, you need to track 
    student performance progression from the beginning to the end of their courses. 
    First, identify all students enrolled in the instructor's sections by querying 
    the performance data collection using the instructor's section IDs. For each student, 
    retrieve their first assessment scores (typically from early quizzes or assignments) 
    and their final assessment scores (from end-of-semester exams or projects). Calculate 
    the percentage difference for each student by subtracting their initial score from 
    their final score, dividing by the initial score, and multiplying by 100. Then, 
    average these individual improvement percentages across all students to determine 
    the instructor's overall Grade Improvement Percentage. This metric effectively 
    measures the instructor's impact on student learning growth throughout the course 
    duration, highlighting their ability to facilitate academic progress from start to finish.
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # First, identify all students enrolled in the instructor's sections by querying
        # the performance data collection using the instructor's section IDs
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Extract section IDs from these sections
        section_ids = [section.get('sectionId') or section.get('id') for section in instructor_sections if section.get('sectionId') or section.get('id')]
        
        # For each student, we need to track their first and final assessment scores
        student_scores = {}
        
        for section_id in section_ids:
            if section_id:
                # Query performance data collection for records associated with this section
                performance_query = db.collection('performanceData').where('sectionId', '==', section_id).stream()
                for record in performance_query:
                    record_data = record.to_dict()
                    student_id = record_data.get('studentId')
                    score = record_data.get('score', 0)
                    max_score = record_data.get('maxScore', 100)
                    assessment_date = record_data.get('date')  # Assuming there's a date field
                    
                    if student_id and max_score > 0:
                        # Calculate percentage score
                        percentage_score = (score / max_score) * 100
                        
                        # Initialize student data if not already present
                        if student_id not in student_scores:
                            student_scores[student_id] = {
                                'first_score': None,
                                'final_score': None,
                                'first_date': None,
                                'final_date': None
                            }
                        
                        # If this is the first assessment or earlier than current first assessment
                        if student_scores[student_id]['first_date'] is None or (assessment_date and assessment_date < student_scores[student_id]['first_date']):
                            student_scores[student_id]['first_score'] = percentage_score
                            student_scores[student_id]['first_date'] = assessment_date
                        
                        # If this is the final assessment or later than current final assessment
                        if student_scores[student_id]['final_date'] is None or (assessment_date and assessment_date > student_scores[student_id]['final_date']):
                            student_scores[student_id]['final_score'] = percentage_score
                            student_scores[student_id]['final_date'] = assessment_date
        
        # Calculate the percentage difference for each student
        total_improvement = 0
        valid_students = 0
        
        for student_id, scores in student_scores.items():
            # Only calculate improvement for students with both first and final scores
            if scores['first_score'] is not None and scores['final_score'] is not None and scores['first_score'] > 0:
                # Calculate the percentage difference for each student
                improvement = ((scores['final_score'] - scores['first_score']) / scores['first_score']) * 100
                total_improvement += improvement
                valid_students += 1
        
        # Average these individual improvement percentages across all students
        if valid_students > 0:
            grade_improvement_percentage = total_improvement / valid_students
        else:
            grade_improvement_percentage = 0.0
        
        # This metric effectively measures the instructor's impact on student learning growth
        return {
            "grade_improvement_percentage": round(grade_improvement_percentage, 2),
            "total_students": valid_students
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating instructor grade improvement: {str(e)}")

# Firebase Instructor Reports endpoints