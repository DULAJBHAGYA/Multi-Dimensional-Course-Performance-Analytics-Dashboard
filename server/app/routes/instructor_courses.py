from fastapi import APIRouter, Depends, HTTPException
from app.firebase_config import get_firestore_client
from app.routes.firebase_auth_updated import verify_token
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter()

# Data model for instructor course count
class InstructorCourseCountData(BaseModel):
    total_courses: int

# Data model for instructor section count
class InstructorSectionCountData(BaseModel):
    total_sections: int

# Data model for instructor average performance
class InstructorAveragePerformanceData(BaseModel):
    avg_performance: float

# Data model for instructor pass rate
class InstructorPassRateData(BaseModel):
    pass_rate: float

# Data model for instructor at-risk courses count
class InstructorAtRiskCoursesCountData(BaseModel):
    at_risk_courses_count: int

# Data model for course performance comparison
class CoursePerformanceData(BaseModel):
    course_code: str
    course_name: str
    average_grade: float
    campus: str

class InstructorCoursePerformanceData(BaseModel):
    courses: List[CoursePerformanceData]

# Data model for at-risk courses
class AtRiskCourseData(BaseModel):
    course_code: str
    course_name: str
    average_grade: float
    campus: str

class InstructorAtRiskCoursesData(BaseModel):
    courses: List[AtRiskCourseData]

# Data model for semester comparison
class SemesterComparisonData(BaseModel):
    semester_name: str
    average_grade: float
    course_count: int

class InstructorSemesterComparisonData(BaseModel):
    semesters: List[SemesterComparisonData]

# Data model for pass rate comparison
class PassRateComparisonData(BaseModel):
    course_code: str
    course_name: str
    pass_rate: float
    fail_rate: float
    passing_assessments: int
    total_assessments: int
    campus: str

class InstructorPassRateComparisonData(BaseModel):
    courses: List[PassRateComparisonData]

# Data model for instructor grade distribution
class GradeDistributionData(BaseModel):
    A: int
    B: int
    C: int
    D: int
    F: int

class AssessmentGradeDistributionData(BaseModel):
    assessment_type: str
    grade_distribution: GradeDistributionData

class InstructorGradeDistributionData(BaseModel):
    assessments: List[AssessmentGradeDistributionData]

# Data model for course pass-fail summary
class CoursePassFailData(BaseModel):
    course_code: str
    course_name: str
    pass_count: int
    fail_count: int
    pass_percentage: float
    fail_percentage: float

class InstructorCoursePassFailSummaryData(BaseModel):
    courses: List[CoursePassFailData]

@router.get("/instructor/course-count", response_model=InstructorCourseCountData)
async def get_instructor_course_count(
    current_user: dict = Depends(verify_token)
):
    """Get the total number of unique courses taught by the logged-in instructor.
    
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
            "total_courses": len(unique_course_ids)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor course count: {str(e)}")

@router.get("/instructor/section-count", response_model=InstructorSectionCountData)
async def get_instructor_section_count(
    current_user: dict = Depends(verify_token)
):
    """Get the total number of sections taught by the logged-in instructor.
    
    This endpoint calculates the sections count by:
    1. Getting all sections assigned to the instructor from the sections collection
    2. Counting the total number of sections
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
        
        return {
            "total_sections": len(instructor_sections)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor section count: {str(e)}")

@router.get("/instructor/section-based-performance-average", response_model=InstructorAveragePerformanceData)
async def get_instructor_section_based_performance_average(
    current_user: dict = Depends(verify_token)
):
    """Calculate an instructor's average performance based on courses.
    
    This endpoint calculates the average performance by:
    1. Getting all sections assigned to the instructor from the sections collection
    2. Grouping sections by course
    3. Calculating average of average grades for each course
    4. Getting the average of these course averages
    5. Returning the result as a percentage
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
        
        # Group sections by course and collect average grades
        course_data = {}
        
        for section in instructor_sections:
            course_id = section.get('courseId')
            average_grade = section.get('averageGrade', 0)
            
            # Skip sections without required data
            if not course_id:
                continue
                
            # Initialize course data if not exists
            if course_id not in course_data:
                course_data[course_id] = {
                    'grades': []
                }
            
            # Add grade to the list
            if isinstance(average_grade, (int, float)):
                course_data[course_id]['grades'].append(average_grade)
        
        # Calculate average grade for each course (average of section average grades)
        course_averages = []
        
        for course_id, data in course_data.items():
            grades = data['grades']
            if grades:
                course_average = sum(grades) / len(grades)
                course_averages.append(course_average)
        
        # Calculate overall average performance (average of course averages)
        if course_averages:
            overall_average = sum(course_averages) / len(course_averages)
        else:
            overall_average = 0.0
        
        return {
            "avg_performance": round(overall_average, 2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating instructor section-based performance average: {str(e)}")

@router.get("/instructor/pass-rate", response_model=InstructorPassRateData)
async def get_instructor_pass_rate(
    current_user: dict = Depends(verify_token)
):
    """Calculate an instructor's overall pass rate based on aggregated grade counts.
    
    This endpoint calculates the pass rate by:
    1. Getting all sections assigned to the instructor from the sections collection
    2. For each section, aggregating grade counts from all assessments
    3. Counting pass grades (A, B, C, D) and fail grades (F)
    4. Calculating pass rate as (total pass grades / total grades) * 100
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
        
        # Initialize counters for pass and fail grades
        total_pass_grades = 0
        total_fail_grades = 0
        
        # Process each section
        for section in instructor_sections:
            assessments = section.get('assessments', {})
            
            # Process each assessment in the section
            for assessment_name, assessment_data in assessments.items():
                grade_breakdown = assessment_data.get('gradeBreakdown', {})
                
                # Add pass grades (A, B, C, D) to pass count
                for grade in ['A', 'B', 'C', 'D']:
                    total_pass_grades += grade_breakdown.get(grade, 0)
                
                # Add fail grades (F) to fail count
                total_fail_grades += grade_breakdown.get('F', 0)
        
        # Calculate pass rate as percentage
        total_grades = total_pass_grades + total_fail_grades
        if total_grades > 0:
            pass_rate = (total_pass_grades / total_grades) * 100
        else:
            pass_rate = 0.0
        
        return {
            "pass_rate": round(pass_rate, 2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating instructor pass rate: {str(e)}")

@router.get("/instructor/at-risk-rate", response_model=InstructorAtRiskCoursesCountData)
async def get_instructor_at_risk_rate(
    current_user: dict = Depends(verify_token)
):
    """Calculate an instructor's at-risk courses count based on sections.
    
    This endpoint calculates the at-risk courses count by:
    1. Getting all sections assigned to the instructor from the sections collection
    2. Grouping sections by course
    3. Calculating average of average grades for each course
    4. Counting courses where this overall average is < 40
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
        
        # Group sections by course and collect grades
        course_data = {}
        
        for section in instructor_sections:
            course_id = section.get('courseId')
            average_grade = section.get('averageGrade', 0)
            
            # Skip sections without required data
            if not course_id:
                continue
                
            # Initialize course data if not exists
            if course_id not in course_data:
                course_data[course_id] = {
                    'grades': []
                }
            
            # Add grade to the list
            if isinstance(average_grade, (int, float)):
                course_data[course_id]['grades'].append(average_grade)
        
        # Count at-risk courses (courses with average grade < 40)
        at_risk_courses_count = 0
        
        for course_id, data in course_data.items():
            # Calculate average grade for the course (average of all section average grades)
            grades = data['grades']
            if grades:
                avg_grade = sum(grades) / len(grades)
                # Count courses where average grade is less than 40
                if avg_grade < 70:
                    at_risk_courses_count += 1
        
        return {
            "at_risk_courses_count": at_risk_courses_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating instructor at-risk courses count: {str(e)}")

@router.get("/instructor/course-performance", response_model=InstructorCoursePerformanceData)
async def get_instructor_course_performance(
    current_user: dict = Depends(verify_token)
):
    """Get course performance comparison data for a specific instructor.
    
    This endpoint provides all course average grades for a specific instructor along with their respective campuses.
    It aggregates data from the sections collection and joins with courses and campuses collections to provide
    human-readable information.
    
    The endpoint:
    1. Queries all sections where instructorId matches the selected instructor
    2. For each section, retrieves the courseCode, averageGrade, and campusId
    3. Joins with courses collection to get course names
    4. Joins with campuses collection to get campus names
    5. Aggregates average grades per course (in case instructor has multiple sections of the same course)
    6. Returns structured data for bar chart visualization
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        print(f"Fetching course performance for instructor ID: {instructor_id}")  # Debug log
        
        # Get sections assigned to this instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        print(f"Total sections found: {len(instructor_sections)}")  # Debug log
        for i, section in enumerate(instructor_sections):
            if i < 3:  # Log first 3 sections for debugging
                print(f"Section {i}: {section}")  # Debug log
        
        # Aggregate data by course
        course_data = {}
        
        for section in instructor_sections:
            course_id = section.get('courseId')
            course_code = section.get('courseCode', 'Unknown Course')
            average_grade = section.get('averageGrade', 0)
            campusId = section.get('campusId')
            
            print(f"Course Performance - Processing section - Course ID: {course_id}, Campus ID: {campusId}")  # Debug log
            
            # Skip sections without required data
            if not course_id:
                continue
                
            # Initialize course data if not exists
            if course_id not in course_data:
                course_data[course_id] = {
                    'course_code': course_code,
                    'course_name': 'Unknown Course',
                    'grades': [],
                    'campusId': campusId
                }
            
            # Add grade to the list
            if isinstance(average_grade, (int, float)):
                course_data[course_id]['grades'].append(average_grade)
        
        # Get course names from courses collection
        for course_id in course_data:
            course_doc = db.collection('courses').document(course_id).get()
            if course_doc.exists:
                course_info = course_doc.to_dict() or {}
                course_data[course_id]['course_name'] = course_info.get('courseName', course_data[course_id]['course_code'])
        
        # Get campus names from campuses collection
        campus_names = {}
        for course_id in course_data:
            campusId = course_data[course_id]['campusId']
            print(f"Course Performance - Course ID: {course_id}, Campus ID: {campusId}")  # Debug log
            if campusId and campusId not in campus_names:
                campus_doc = db.collection('campuses').document(campusId).get()
                print(f"Course Performance - Campus document exists: {campus_doc.exists}")  # Debug log
                if campus_doc.exists:
                    campus_info = campus_doc.to_dict() or {}
                    print(f"Course Performance - Campus info: {campus_info}")  # Debug log
                    campus_names[campusId] = campus_info.get('campus', 'Unknown Campus')
                else:
                    campus_names[campusId] = 'Unknown Campus'
                    print(f"Course Performance - Campus document not found for ID: {campusId}")  # Debug log
        
        # Prepare final response data
        courses_performance = []
        for course_id, data in course_data.items():
            # Calculate average grade for the course
            grades = data['grades']
            if grades:
                avg_grade = sum(grades) / len(grades)
            else:
                avg_grade = 0
            
            # Get campus name
            campusId = data['campusId']
            campus_name = campus_names.get(campusId, 'Unknown Campus') if campusId else 'Unknown Campus'
            print(f"Course Performance - Final campus name for course {course_id}: {campus_name}")  # Debug log
            
            courses_performance.append({
                'course_code': data['course_code'],
                'course_name': data['course_name'],
                'average_grade': round(avg_grade, 2),
                'campus': campus_name
            })
        
        print(f"Course Performance data: {courses_performance}")  # Debug log
        return {
            "courses": courses_performance
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor course performance data: {str(e)}")

@router.get("/instructor/at-risk-courses", response_model=InstructorAtRiskCoursesData)
async def get_instructor_at_risk_courses(
    current_user: dict = Depends(verify_token)
):
    """Get all courses with average grades under 40 for a specific instructor.
    
    This endpoint provides at-risk course data for a specific instructor including campus information.
    It queries all sections for the instructor, calculates the average of average grades for each course,
    and identifies courses where this overall average is less than 40.
    
    The endpoint:
    1. Queries all sections where instructorId matches the selected instructor
    2. Groups sections by course and collects all average grades
    3. Calculates the average of average grades for each course
    4. Filters for courses where this overall average is < 40
    5. Joins with courses collection to get course names
    6. Joins with campuses collection to get campus names
    7. Returns structured data for at-risk courses display
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        print(f"Fetching at-risk courses for instructor ID: {instructor_id}")  # Debug log
        
        # Get sections assigned to this instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        print(f"Total sections found: {len(instructor_sections)}")  # Debug log
        
        # Aggregate data by course (collect all grades for each course)
        course_data = {}
        
        for section in instructor_sections:
            course_id = section.get('courseId')
            course_code = section.get('courseCode', 'Unknown Course')
            average_grade = section.get('averageGrade', 0)
            campusId = section.get('campusId')
            
            # Skip sections without required data
            if not course_id:
                continue
                
            # Initialize course data if not exists
            if course_id not in course_data:
                course_data[course_id] = {
                    'course_code': course_code,
                    'course_name': 'Unknown Course',
                    'grades': [],
                    'campusId': campusId
                }
            
            # Add grade to the list
            if isinstance(average_grade, (int, float)):
                course_data[course_id]['grades'].append(average_grade)
        
        # Get course names from courses collection
        for course_id in course_data:
            course_doc = db.collection('courses').document(course_id).get()
            if course_doc.exists:
                course_info = course_doc.to_dict() or {}
                course_data[course_id]['course_name'] = course_info.get('courseName', course_data[course_id]['course_code'])
        
        # Get campus names from campuses collection
        campus_names = {}
        for course_id in course_data:
            campusId = course_data[course_id]['campusId']
            if campusId and campusId not in campus_names:
                campus_doc = db.collection('campuses').document(campusId).get()
                if campus_doc.exists:
                    campus_info = campus_doc.to_dict() or {}
                    campus_names[campusId] = campus_info.get('campus', 'Unknown Campus')
                else:
                    campus_names[campusId] = 'Unknown Campus'
        
        # Prepare final response data - only include courses with average < 40
        at_risk_courses = []
        for course_id, data in course_data.items():
            # Calculate average grade for the course (average of all section average grades)
            grades = data['grades']
            if grades:
                avg_grade = sum(grades) / len(grades)
            else:
                avg_grade = 0
            
            # Only include courses where average grade is less than 40
            if avg_grade < 70:
                # Get campus name
                campusId = data['campusId']
                campus_name = campus_names.get(campusId, 'Unknown Campus') if campusId else 'Unknown Campus'
                
                at_risk_courses.append({
                    'course_code': data['course_code'],
                    'course_name': data['course_name'],
                    'average_grade': round(avg_grade, 2),
                    'campus': campus_name
                })
        
        print(f"At-risk courses data: {at_risk_courses}")  # Debug log
        return {
            "courses": at_risk_courses
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor at-risk courses data: {str(e)}")

@router.get("/instructor/semester-comparison", response_model=InstructorSemesterComparisonData)
async def get_instructor_semester_comparison(
    current_user: dict = Depends(verify_token)
):
    """Get semester comparison data for an instructor's course performance.
    
    This endpoint provides semester-wise performance data for course-instructor combinations
    that have been taught in multiple semesters. It calculates average grades per semester
    and shows how performance varies across different semesters.
    
    The endpoint:
    1. Queries all sections for the instructor
    2. Groups sections by course and semester
    3. Calculates average grades for each semester
    4. Returns structured data for semester comparison visualization
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get all sections assigned to this instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Group sections by course and semester to identify course-instructor combinations across semesters
        course_semester_data = {}
        
        for section in instructor_sections:
            course_id = section.get('courseId')
            semester_id = section.get('semesterId')
            average_grade = section.get('averageGrade', 0)
            
            # Skip sections without required data
            if not course_id or not semester_id:
                continue
                
            # Create a key for grouping by course
            key = course_id
            
            if key not in course_semester_data:
                course_semester_data[key] = {
                    'course_code': section.get('courseCode', 'Unknown Course'),
                    'semesters': {}
                }
            
            # Group by semester within each course
            if semester_id not in course_semester_data[key]['semesters']:
                course_semester_data[key]['semesters'][semester_id] = {
                    'grades': [],
                    'semester_id': semester_id
                }
            
            # Add grade to the list
            if isinstance(average_grade, (int, float)):
                course_semester_data[key]['semesters'][semester_id]['grades'].append(average_grade)
        
        # Get semester names from semesters collection
        semester_names = {}
        semesters_query = db.collection('semesters').stream()
        for semester_doc in semesters_query:
            semester_data = semester_doc.to_dict() or {}
            # Use semesterId as fallback if semester is not available
            semester_names[semester_doc.id] = semester_data.get('semester', semester_doc.id)
        
        # Calculate semester-level statistics
        semester_stats = {}
        
        for course_id, course_data in course_semester_data.items():
            for semester_id, semester_info in course_data['semesters'].items():
                # Only include semesters with data
                if semester_info['grades']:
                    if semester_id not in semester_stats:
                        semester_stats[semester_id] = {
                            'grades': [],
                            'course_count': 0
                        }
                    semester_stats[semester_id]['grades'].extend(semester_info['grades'])
                    semester_stats[semester_id]['course_count'] += 1
        
        # Prepare final response data
        semesters_data = []
        for semester_id, stats in semester_stats.items():
            if stats['grades']:  # Only include semesters with grades
                avg_grade = sum(stats['grades']) / len(stats['grades'])
                semester_name = semester_names.get(semester_id, semester_id)
                
                semesters_data.append({
                    'semester_name': semester_name,
                    'average_grade': round(avg_grade, 2),
                    'course_count': stats['course_count']
                })
        
        # Sort by semester name for consistent ordering
        semesters_data.sort(key=lambda x: x['semester_name'])
        
        return {
            "semesters": semesters_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor semester comparison data: {str(e)}")

@router.get("/instructor/course-performance-comparison", response_model=InstructorCoursePerformanceData)
async def get_instructor_course_performance_comparison(
    current_user: dict = Depends(verify_token)
):
    """Get course performance comparison data for an instructor.
    
    This endpoint provides performance data for course-instructor combinations
    by calculating the average of all section average grades for each course.
    Courses with average grade < 40 are considered at-risk.
    
    The endpoint:
    1. Queries all sections for the instructor
    2. Groups sections by course
    3. Calculates average of average grades for each course
    4. Returns structured data for course performance comparison visualization
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get all sections assigned to this instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Group sections by course to calculate course performance
        course_data = {}
        
        for section in instructor_sections:
            course_id = section.get('courseId')
            course_code = section.get('courseCode', 'Unknown Course')
            average_grade = section.get('averageGrade', 0)
            campusId = section.get('campusId')
            
            # Skip sections without required data
            if not course_id:
                continue
                
            # Initialize course data if not exists
            if course_id not in course_data:
                course_data[course_id] = {
                    'course_code': course_code,
                    'course_name': 'Unknown Course',
                    'grades': [],
                    'campusId': campusId
                }
            
            # Add grade to the list
            if isinstance(average_grade, (int, float)):
                course_data[course_id]['grades'].append(average_grade)
        
        # Get course names from courses collection
        for course_id in course_data:
            course_doc = db.collection('courses').document(course_id).get()
            if course_doc.exists:
                course_info = course_doc.to_dict() or {}
                course_data[course_id]['course_name'] = course_info.get('courseName', course_data[course_id]['course_code'])
        
        # Get campus names from campuses collection
        campus_names = {}
        for course_id in course_data:
            campusId = course_data[course_id]['campusId']
            if campusId and campusId not in campus_names:
                campus_doc = db.collection('campuses').document(campusId).get()
                if campus_doc.exists:
                    campus_info = campus_doc.to_dict() or {}
                    campus_names[campusId] = campus_info.get('campus', 'Unknown Campus')
                else:
                    campus_names[campusId] = 'Unknown Campus'
        
        # Prepare final response data
        courses_performance = []
        for course_id, data in course_data.items():
            # Calculate average grade for the course (average of all section average grades)
            grades = data['grades']
            if grades:
                avg_grade = sum(grades) / len(grades)
            else:
                avg_grade = 0
            
            # Get campus name
            campusId = data['campusId']
            campus_name = campus_names.get(campusId, 'Unknown Campus') if campusId else 'Unknown Campus'
            
            courses_performance.append({
                'course_code': data['course_code'],
                'course_name': data['course_name'],
                'average_grade': round(avg_grade, 2),
                'campus': campus_name
            })
        
        return {
            "courses": courses_performance
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor course performance comparison data: {str(e)}")

@router.get("/instructor/pass-rate-comparison", response_model=InstructorPassRateComparisonData)
async def get_instructor_pass_rate_comparison(
    current_user: dict = Depends(verify_token)
):
    """Get pass rate comparison data for individual courses taught by an instructor.
    
    This endpoint provides pass/fail rate data for each course by calculating:
    1. Total sections per course
    2. Sections with averageGrade > 60 (passing grade)
    3. Pass rate as (passing sections / total sections) * 100
    4. Fail rate as 100 - pass rate
    
    The endpoint:
    1. Queries all sections for the instructor
    2. Groups sections by course
    3. Calculates pass/fail rates for each course
    4. Returns structured data for pass rate comparison visualization
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get all sections assigned to this instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Group sections by course to calculate pass rates
        course_data = {}
        
        for section in instructor_sections:
            course_id = section.get('courseId')
            course_code = section.get('courseCode', 'Unknown Course')
            average_grade = section.get('averageGrade', 0)
            campusId = section.get('campusId')
            
            # Skip sections without required data
            if not course_id:
                continue
                
            # Initialize course data if not exists
            if course_id not in course_data:
                course_data[course_id] = {
                    'course_code': course_code,
                    'course_name': 'Unknown Course',
                    'total_sections': 0,
                    'passing_sections': 0,
                    'campusId': campusId
                }
            
            # Increment total sections
            course_data[course_id]['total_sections'] += 1
            
            # Increment passing sections if grade > 60
            if isinstance(average_grade, (int, float)) and average_grade > 60:
                course_data[course_id]['passing_sections'] += 1
        
        # Get course names from courses collection
        for course_id in course_data:
            course_doc = db.collection('courses').document(course_id).get()
            if course_doc.exists:
                course_info = course_doc.to_dict() or {}
                course_data[course_id]['course_name'] = course_info.get('courseName', course_data[course_id]['course_code'])
        
        # Get campus names from campuses collection
        campus_names = {}
        for course_id in course_data:
            campusId = course_data[course_id]['campusId']
            if campusId and campusId not in campus_names:
                campus_doc = db.collection('campuses').document(campusId).get()
                if campus_doc.exists:
                    campus_info = campus_doc.to_dict() or {}
                    campus_names[campusId] = campus_info.get('campus', 'Unknown Campus')
                else:
                    campus_names[campusId] = 'Unknown Campus'
        
        # Prepare final response data
        pass_rate_comparison = []
        for course_id, data in course_data.items():
            # Calculate pass rate and fail rate
            total_sections = data['total_sections']
            passing_sections = data['passing_sections']
            
            if total_sections > 0:
                pass_rate = (passing_sections / total_sections) * 100
                fail_rate = 100 - pass_rate
            else:
                pass_rate = 0
                fail_rate = 0
            
            # Get campus name
            campusId = data['campusId']
            campus_name = campus_names.get(campusId, 'Unknown Campus') if campusId else 'Unknown Campus'
            
            pass_rate_comparison.append({
                'course_code': data['course_code'],
                'course_name': data['course_name'],
                'pass_rate': round(pass_rate, 2),
                'fail_rate': round(fail_rate, 2),
                'passing_assessments': passing_sections,
                'total_assessments': total_sections,
                'campus': campus_name
            })
        
        return {
            "courses": pass_rate_comparison
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor pass rate comparison data: {str(e)}")

@router.get("/instructor/grade-distribution", response_model=InstructorGradeDistributionData)
async def get_instructor_grade_distribution(
    current_user: dict = Depends(verify_token)
):
    """Get aggregated grade distribution for all assessments across all sections taught by an instructor.
    
    This endpoint aggregates grade data for a specific instructor across all their sections.
    For each assessment type (Quiz 1, Midterm Exam, Final Exam), the system calculates the 
    total count (sum) of grades A, B, C, D, and F from all sections taught by that instructor.
    
    The endpoint:
    1. Queries all sections for the instructor
    2. Extracts assessment data from each section
    3. Aggregates grade counts by assessment type
    4. Returns structured data for pie chart visualization
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get all sections assigned to this instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Initialize grade counters for each assessment type
        grade_distribution = {
            "Quiz 1": {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0},
            "Midterm Exam": {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0},
            "Final Exam": {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
        }
        
        # Process each section
        for section in instructor_sections:
            assessments = section.get('assessments', {})
            
            # Process each assessment type in the section
            for assessment_name, assessment_data in assessments.items():
                # Only process the three main assessment types
                if assessment_name in grade_distribution:
                    grade_breakdown = assessment_data.get('gradeBreakdown', {})
                    
                    # Add grade counts to our aggregation
                    for grade, count in grade_breakdown.items():
                        if grade in grade_distribution[assessment_name]:
                            grade_distribution[assessment_name][grade] += count
        
        # Prepare final response data
        assessment_distributions = []
        for assessment_type, distribution in grade_distribution.items():
            assessment_distributions.append({
                "assessment_type": assessment_type,
                "grade_distribution": distribution
            })
        
        return {
            "assessments": assessment_distributions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor grade distribution data: {str(e)}")

@router.get("/instructor/course-pass-fail-summary", response_model=InstructorCoursePassFailSummaryData)
async def get_instructor_course_pass_fail_summary(
    current_user: dict = Depends(verify_token)
):
    """Get pass-fail summary for each course taught by an instructor.
    
    This endpoint calculates pass-fail summary for each course taught by a specific instructor.
    Grades A, B, C, and D are considered as passes, while grade F is considered as a fail.
    For each instructor and each of their courses, the system aggregates the total number of 
    grades from all assessments across all related sections and computes the overall percentage 
    of passes and fails based on these aggregated counts.
    
    The endpoint:
    1. Queries all sections for the instructor
    2. Groups sections by course
    3. For each course, aggregates pass/fail counts from all assessments across all sections
    4. Calculates pass/fail percentages
    5. Returns structured data for pass-fail summary visualization
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get all sections assigned to this instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Group sections by course and aggregate pass/fail counts
        course_data = {}
        
        for section in instructor_sections:
            course_id = section.get('courseId')
            course_code = section.get('courseCode', 'Unknown Course')
            assessments = section.get('assessments', {})
            
            # Skip sections without required data
            if not course_id:
                continue
                
            # Initialize course data if not exists
            if course_id not in course_data:
                course_data[course_id] = {
                    'course_code': course_code,
                    'course_name': 'Unknown Course',
                    'pass_count': 0,
                    'fail_count': 0
                }
            
            # Process each assessment in the section
            for assessment_name, assessment_data in assessments.items():
                grade_breakdown = assessment_data.get('gradeBreakdown', {})
                
                # Add pass grades (A, B, C, D) to pass count
                for grade in ['A', 'B', 'C', 'D']:
                    course_data[course_id]['pass_count'] += grade_breakdown.get(grade, 0)
                
                # Add fail grades (F) to fail count
                course_data[course_id]['fail_count'] += grade_breakdown.get('F', 0)
        
        # Get course names from courses collection
        for course_id in course_data:
            course_doc = db.collection('courses').document(course_id).get()
            if course_doc.exists:
                course_info = course_doc.to_dict() or {}
                course_data[course_id]['course_name'] = course_info.get('courseName', course_data[course_id]['course_code'])
        
        # Calculate percentages and prepare final response data
        course_pass_fail_summary = []
        for course_id, data in course_data.items():
            total_grades = data['pass_count'] + data['fail_count']
            
            if total_grades > 0:
                pass_percentage = (data['pass_count'] / total_grades) * 100
                fail_percentage = (data['fail_count'] / total_grades) * 100
            else:
                pass_percentage = 0
                fail_percentage = 0
            
            course_pass_fail_summary.append({
                'course_code': data['course_code'],
                'course_name': data['course_name'],
                'pass_count': data['pass_count'],
                'fail_count': data['fail_count'],
                'pass_percentage': round(pass_percentage, 2),
                'fail_percentage': round(fail_percentage, 2)
            })
        
        return {
            "courses": course_pass_fail_summary
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching instructor course pass-fail summary data: {str(e)}")
