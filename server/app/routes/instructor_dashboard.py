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

# New data model for section count
class SectionCountData(BaseModel):
    total_sections: int

# New data model for instructor average performance
class InstructorAveragePerformanceData(BaseModel):
    avg_performance: float

# New data model for instructor CRNs
class InstructorCRNData(BaseModel):
    crns: List[str]

# New data model for unique courses count
class UniqueCoursesCountData(BaseModel):
    unique_courses_count: int

# New data model for instructor courses with department info
class InstructorCourseWithDepartment(BaseModel):
    course_id: str
    course_name: str
    department: str

class InstructorCoursesWithDepartmentsData(BaseModel):
    courses: List[InstructorCourseWithDepartment]

# API Endpoints

# New endpoint to get instructor's average performance based on sections
@router.get("/instructor/section-based-performance-average", response_model=InstructorAveragePerformanceData)
async def get_instructor_section_based_performance_average(
    current_user: dict = Depends(verify_token)
):
    """Calculate an instructor's average performance based on sections.
    
    This endpoint calculates the average performance by:
    1. Checking instructor details first
    2. Getting all average grades relating to an instructor from sections
    3. Dividing by all number of sections relating to an instructor
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Check instructor details first
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get instructor document to verify instructor exists
        instructor_doc = db.collection('instructors').document(instructor_id).get()
        if not instructor_doc.exists:
            raise HTTPException(status_code=404, detail="Instructor not found")
        
        # Get all sections relating to an instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Get all average grades relating to an instructor from sections
        total_average_grade = 0
        
        for section in instructor_sections:
            # Get average grade from each section
            average_grade = section.get('averageGrade', 0)
            # Add all average grades (including 0 values)
            if isinstance(average_grade, (int, float)):
                total_average_grade += average_grade
        
        # Divide by all number of sections relating to an instructor
        # This includes all sections, even those with 0 averageGrade
        if len(instructor_sections) > 0:
            avg_performance = total_average_grade / len(instructor_sections)
        else:
            avg_performance = 0.0
        
        return {
            "avg_performance": round(avg_performance, 2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating instructor section-based performance average: {str(e)}")

@router.get("/instructor/section-count", response_model=SectionCountData)
async def get_instructor_section_count(
    current_user: dict = Depends(verify_token)
):
    """Get the total number of sections assigned to the logged-in instructor"""
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
        
        return {
            "total_sections": len(instructor_sections)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor section count: {str(e)}")

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
        
        # Find sections for the two CRNs (try both 'crnCode' and 'crn' field names)
        section1 = next((s for s in instructor_sections if s.get('crnCode') == crn1 or s.get('crn') == crn1), None)
        section2 = next((s for s in instructor_sections if s.get('crnCode') == crn2 or s.get('crn') == crn2), None)
        
        # Debug logging
        print(f"Looking for CRNs: {crn1}, {crn2}")
        print(f"Found section1: {section1 is not None}")
        print(f"Found section2: {section2 is not None}")
        if section1:
            print(f"Section1 CRN fields: crnCode={section1.get('crnCode')}, crn={section1.get('crn')}")
        if section2:
            print(f"Section2 CRN fields: crnCode={section2.get('crnCode')}, crn={section2.get('crn')}")
        
        if not section1 or not section2:
            # Log available CRNs for debugging
            available_crns = [(s.get('crnCode'), s.get('crn')) for s in instructor_sections]
            print(f"Available CRNs: {available_crns}")
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
        
        # Get additional data for sections
        course1_code = course1_data.get('courseCode', 'Unknown Code')
        course2_code = course2_data.get('courseCode', 'Unknown Code')
        department1 = section1.get('department', 'Unknown Department')
        department2 = section2.get('department', 'Unknown Department')
        
        # Get campus names from campus IDs
        campus_id1 = section1.get('campusId')
        campus_id2 = section2.get('campusId')
        campus1 = 'campus1'
        campus2 = 'campus'
        
        if campus_id1:
            campus_doc1 = db.collection('campuses').document(campus_id1).get()
            if campus_doc1.exists:
                campus_data1 = campus_doc1.to_dict() or {}
                campus1 = campus_data1.get('campus', 'Unknown Campus')
        
        if campus_id2:
            campus_doc2 = db.collection('campuses').document(campus_id2).get()
            if campus_doc2.exists:
                campus_data2 = campus_doc2.to_dict() or {}
                campus2 = campus_data2.get('campus', 'Unknown Campus')
        
        # Use section averageGrade instead of course averageRating for more accurate data
        avg_grade1 = section1.get('averageGrade', 0)
        avg_grade2 = section2.get('averageGrade', 0)
        
        # Prepare comparison data with required information
        comparison_data = {
            "crn1": {
                "crn": crn1,
                "courseId": course1_id,
                "courseName": course1_data.get('courseName', 'Unknown Course'),
                "courseCode": course1_code,
                "department": department1,
                "campus": campus1,
                "semester": section1.get('semesterName', 'Unknown Semester'),
                "averageGrade": avg_grade1
            },
            "crn2": {
                "crn": crn2,
                "courseId": course2_id,
                "courseName": course2_data.get('courseName', 'Unknown Course'),
                "courseCode": course2_code,
                "department": department2,
                "campus": campus2,
                "semester": section2.get('semesterName', 'Unknown Semester'),
                "averageGrade": avg_grade2
            },
            "comparison": {
                "averageGradeDifference": round(avg_grade1 - avg_grade2, 2),
                "betterAverageGrade": crn1 if avg_grade1 > avg_grade2 else crn2
            }
        }
        
        return comparison_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching CRN comparison data: {str(e)}")

@router.get("/instructor/unique-courses-count", response_model=UniqueCoursesCountData)
async def get_instructor_unique_courses_count(
    current_user: dict = Depends(verify_token)
):
    """Get the count of unique courses taught by the logged-in instructor.
    
    This endpoint calculates the unique courses count by:
    1. Getting all sections assigned to the instructor from the sections collection
    2. Extracting unique course IDs from these sections
    3. Counting the distinct course IDs
    """
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
        
        # Extract unique course IDs from these sections
        unique_course_ids = set([section.get('courseId') for section in instructor_sections if section.get('courseId')])
        
        return {
            "unique_courses_count": len(unique_course_ids)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor unique courses count: {str(e)}")

@router.get("/instructor/courses-with-departments", response_model=InstructorCoursesWithDepartmentsData)
async def get_instructor_courses_with_departments(
    current_user: dict = Depends(verify_token)
):
    """Get list of unique courses with department information for the logged-in instructor.
    
    This endpoint retrieves all unique courses taught by the instructor along with their department information.
    It works by:
    1. Getting all sections assigned to the instructor from the sections collection
    2. Extracting unique course IDs from these sections
    3. For each unique course, fetching course details from the courses collection
    4. Getting department information from the related section
    """
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
        
        # Extract unique course IDs from these sections
        unique_course_ids = list(set([section.get('courseId') for section in instructor_sections if section.get('courseId')]))
        
        # Get course details for each unique course
        courses_with_departments = []
        for course_id in unique_course_ids:
            if course_id:
                # Get course details from courses collection
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict() or {}
                    
                    # Find a section for this course to get department info
                    related_section = next((s for s in instructor_sections if s.get('courseId') == course_id), {})
                    
                    courses_with_departments.append({
                        "course_id": course_id,
                        "course_name": course_data.get('courseName', 'Unknown Course'),
                        "department": related_section.get('department', 'Unknown Department')
                    })
        
        return {
            "courses": courses_with_departments
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor courses with departments: {str(e)}")

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

# New endpoint to get all CRNs for a specific instructor
@router.get("/instructor/crns", response_model=InstructorCRNData)
async def get_instructor_crns(
    current_user: dict = Depends(verify_token)
):
    """Get all CRNs assigned to the logged-in instructor"""
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
        
        # Log the number of sections found for debugging
        print(f"Found {len(instructor_sections)} sections for instructor {instructor_id}")
        
        # Extract unique CRNs from these sections
        crns = []
        for i, section in enumerate(instructor_sections):
            # Try both 'crnCode' and 'crn' field names to handle different data formats
            crn_code = section.get('crnCode') or section.get('crn')
            # Log section data for debugging (first few sections only)
            if i < 3:
                print(f"Section {i}: crnCode={section.get('crnCode')}, crn={section.get('crn')}, all_keys={list(section.keys())}")
            if crn_code and crn_code not in crns:
                crns.append(crn_code)
        
        print(f"Extracted {len(crns)} unique CRNs: {crns}")
        
        return {
            "crns": crns
        }
        
    except Exception as e:
        print(f"Error in get_instructor_crns: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching instructor CRNs: {str(e)}")



