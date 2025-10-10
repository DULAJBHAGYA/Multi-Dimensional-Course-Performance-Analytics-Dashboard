"""
Department Head Dashboard Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from app.firebase_config import get_firestore_client
from typing import List, Dict, Any, Optional
import logging
from app.routes.firebase_auth_updated import verify_token

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/department-head/unique-courses-count")
async def get_department_head_unique_courses_count(current_user: dict = Depends(verify_token)):
    """Get the count of unique courses available in a specific department within a specific campus.
    
    When the department head logs in, their associated campus and department values will be used 
    to filter the data. The API queries the sections collection in Firestore and filters all 
    documents where the campus and department fields match the logged-in department head's details. 
    Then, from those filtered sections, it extracts all unique courseCode values and counts them.
    
    This endpoint:
    1. Gets the campus and department information for the current department head
    2. Queries all sections that belong to that campus and department
    3. Counts the unique courses (based on courseCode) from those sections
    4. Returns the count
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get department head information from the current user
        # The verify_token function provides the department head's details including campus and department
        department_name = current_user.get('department')
        campus_name = current_user.get('campus')
        
        if not department_name or not campus_name:
            raise HTTPException(status_code=400, detail="Department or Campus information not found for department head")
        
        # Query sections that belong to this campus and department
        # We're filtering by both campus and department fields in the sections collection
        sections_query = db.collection('sections').where('campus', '==', campus_name).where('department', '==', department_name).stream()
        sections = [section.to_dict() for section in sections_query]
        
        # Extract unique course codes from the filtered sections
        unique_courses = set()
        for section in sections:
            course_code = section.get('courseCode')
            if course_code:
                unique_courses.add(course_code)
        
        # Return the count of unique courses
        return {
            "unique_courses_count": len(unique_courses),
            "department": department_name,
            "campus": campus_name
        }
        
    except Exception as e:
        logger.error(f"Error fetching department head unique courses count: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching department head unique courses count: {str(e)}")

@router.get("/department-head/unique-instructors-count")
async def get_department_head_unique_instructors_count(current_user: dict = Depends(verify_token)):
    """Get the count of unique instructors teaching courses in a specific department within a specific campus.
    
    When the department head logs in, their campus and department values will be used 
    to filter the data. The API queries the sections collection in Firestore and filters all 
    documents where the campus and department fields match the logged-in department head's details. 
    From those filtered sections, it extracts all unique instructorId values and counts them.
    
    This endpoint:
    1. Gets the campus and department information for the current department head
    2. Queries all sections that belong to that campus and department
    3. Counts the unique instructors (based on instructorId) from those sections
    4. Returns the count
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get department head information from the current user
        department_name = current_user.get('department')
        campus_name = current_user.get('campus')
        
        if not department_name or not campus_name:
            raise HTTPException(status_code=400, detail="Department or Campus information not found for department head")
        
        # Query sections that belong to this campus and department
        sections_query = db.collection('sections').where('campus', '==', campus_name).where('department', '==', department_name).stream()
        sections = [section.to_dict() for section in sections_query]
        
        # Extract unique instructor IDs from the filtered sections
        unique_instructors = set()
        for section in sections:
            instructor_id = section.get('instructorId')
            if instructor_id:
                unique_instructors.add(instructor_id)
        
        # Return the count of unique instructors
        return {
            "unique_instructors_count": len(unique_instructors),
            "department": department_name,
            "campus": campus_name
        }
        
    except Exception as e:
        logger.error(f"Error fetching department head unique instructors count: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching department head unique instructors count: {str(e)}")

@router.get("/department-head/total-sections-count")
async def get_department_head_total_sections_count(current_user: dict = Depends(verify_token)):
    """Get the total number of sections in a specific department within a specific campus.
    
    When the department head logs in, their campus and department values will be used 
    to filter the data. The API queries the sections collection in Firestore and filters all 
    documents where the campus and department fields match the logged-in department head's details. 
    Then it counts the total number of sections.
    
    This endpoint:
    1. Gets the campus and department information for the current department head
    2. Queries all sections that belong to that campus and department
    3. Returns the total count of sections
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get department head information from the current user
        department_name = current_user.get('department')
        campus_name = current_user.get('campus')
        
        if not department_name or not campus_name:
            raise HTTPException(status_code=400, detail="Department or Campus information not found for department head")
        
        # Query sections that belong to this campus and department
        sections_query = db.collection('sections').where('campus', '==', campus_name).where('department', '==', department_name).stream()
        sections = [section.to_dict() for section in sections_query]
        
        # Return the total count of sections
        return {
            "total_sections_count": len(sections),
            "department": department_name,
            "campus": campus_name
        }
        
    except Exception as e:
        logger.error(f"Error fetching department head total sections count: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching department head total sections count: {str(e)}")

@router.get("/department-head/average-grade")
async def get_department_head_average_grade(current_user: dict = Depends(verify_token)):
    """Calculate the department-level average grade for a department head's dashboard.
    
    When the department head logs in, the API uses their campus and department values 
    to filter all relevant sections from the sections collection in Firestore. Then, 
    the API groups these sections by courseCode to handle courses with multiple sections. 
    For each unique course, it calculates the average of averageGrade across its sections. 
    After computing averages for all courses, the API sums these per-course averages and 
    divides by the total number of unique courses to get the overall department-level average grade.
    
    This endpoint:
    1. Gets the campus and department information for the current department head
    2. Queries all sections that belong to that campus and department
    3. Groups sections by courseCode
    4. Calculates average grade for each course (average of section averageGrade values)
    5. Calculates overall department-level average grade (average of course averages)
    6. Returns the department-level average grade
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get department head information from the current user
        department_name = current_user.get('department')
        campus_name = current_user.get('campus')
        
        if not department_name or not campus_name:
            raise HTTPException(status_code=400, detail="Department or Campus information not found for department head")
        
        # Query sections that belong to this campus and department
        sections_query = db.collection('sections').where('campus', '==', campus_name).where('department', '==', department_name).stream()
        sections = [section.to_dict() for section in sections_query]
        
        if not sections:
            return {
                "department_average_grade": 0.0,
                "department": department_name,
                "campus": campus_name,
                "total_courses": 0,
                "total_sections": 0
            }
        
        # Group sections by courseCode
        courses = {}
        for section in sections:
            course_code = section.get('courseCode')
            average_grade = section.get('averageGrade', 0)
            
            if course_code:
                if course_code not in courses:
                    courses[course_code] = []
                courses[course_code].append(average_grade)
        
        # Calculate average grade for each course
        course_averages = []
        for course_code, grades in courses.items():
            if grades:
                # Calculate average of section averageGrade values for this course
                course_average = sum(grades) / len(grades)
                course_averages.append(course_average)
        
        # Calculate overall department-level average grade
        department_average_grade = 0.0
        if course_averages:
            department_average_grade = sum(course_averages) / len(course_averages)
        
        # Return the department-level average grade
        return {
            "department_average_grade": round(department_average_grade, 2),
            "department": department_name,
            "campus": campus_name,
            "total_courses": len(courses),
            "total_sections": len(sections)
        }
        
    except Exception as e:
        logger.error(f"Error calculating department head average grade: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating department head average grade: {str(e)}")

@router.get("/department-head/at-risk-courses-count")
async def get_department_head_at_risk_courses_count(current_user: dict = Depends(verify_token)):
    """Calculate the number of at-risk courses in a department for a department head's dashboard.
    
    When the department head logs in, the API uses their campus and department values 
    to filter all relevant sections from the sections collection in Firestore. Then, 
    the API groups these sections by courseCode to handle courses with multiple sections. 
    For each unique course, it calculates the average of averageGrade across its sections. 
    If the resulting per-course average grade is less than 40, that course is considered at-risk.
    Finally, the API counts all such at-risk courses and returns this total count.
    
    This endpoint:
    1. Gets the campus and department information for the current department head
    2. Queries all sections that belong to that campus and department
    3. Groups sections by courseCode
    4. Calculates average grade for each course (average of section averageGrade values)
    5. Identifies courses with average grade < 40 as at-risk
    6. Returns the count of at-risk courses
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get department head information from the current user
        department_name = current_user.get('department')
        campus_name = current_user.get('campus')
        
        if not department_name or not campus_name:
            raise HTTPException(status_code=400, detail="Department or Campus information not found for department head")
        
        # Query sections that belong to this campus and department
        sections_query = db.collection('sections').where('campus', '==', campus_name).where('department', '==', department_name).stream()
        sections = [section.to_dict() for section in sections_query]
        
        if not sections:
            return {
                "at_risk_courses_count": 0,
                "department": department_name,
                "campus": campus_name,
                "total_courses": 0,
                "total_sections": 0
            }
        
        # Group sections by courseCode
        courses = {}
        for section in sections:
            course_code = section.get('courseCode')
            average_grade = section.get('averageGrade', 0)
            
            if course_code:
                if course_code not in courses:
                    courses[course_code] = []
                courses[course_code].append(average_grade)
        
        # Calculate average grade for each course and count at-risk courses
        at_risk_courses_count = 0
        for course_code, grades in courses.items():
            if grades:
                # Calculate average of section averageGrade values for this course
                course_average = sum(grades) / len(grades)
                # If course average is less than 40, it's at-risk
                if course_average < 40:
                    at_risk_courses_count += 1
        
        # Return the count of at-risk courses
        return {
            "at_risk_courses_count": at_risk_courses_count,
            "department": department_name,
            "campus": campus_name,
            "total_courses": len(courses),
            "total_sections": len(sections)
        }
        
    except Exception as e:
        logger.error(f"Error calculating department head at-risk courses count: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating department head at-risk courses count: {str(e)}")

@router.get("/department-head/at-risk-courses")
async def get_department_head_at_risk_courses(current_user: dict = Depends(verify_token)):
    """Get detailed list of at-risk courses in a department for a department head's dashboard.
    
    When the department head logs in, the API uses their campus and department values 
    to filter all relevant sections from the sections collection in Firestore. Then, 
    the API groups these sections by courseCode to handle courses with multiple sections. 
    For each unique course, it calculates the average of averageGrade across its sections. 
    If the resulting per-course average grade is less than 40, that course is considered at-risk.
    Finally, the API returns detailed information about all such at-risk courses.
    
    This endpoint:
    1. Gets the campus and department information for the current department head
    2. Queries all sections that belong to that campus and department
    3. Groups sections by courseCode
    4. Calculates average grade for each course (average of section averageGrade values)
    5. Identifies courses with average grade < 40 as at-risk
    6. Returns detailed information about at-risk courses
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get department head information from the current user
        department_name = current_user.get('department')
        campus_name = current_user.get('campus')
        
        if not department_name or not campus_name:
            raise HTTPException(status_code=400, detail="Department or Campus information not found for department head")
        
        # Query sections that belong to this campus and department
        sections_query = db.collection('sections').where('campus', '==', campus_name).where('department', '==', department_name).stream()
        sections = [section.to_dict() for section in sections_query]
        
        if not sections:
            return {
                "courses": [],
                "department": department_name,
                "campus": campus_name
            }
        
        # Group sections by courseCode and collect course information
        courses = {}
        for section in sections:
            course_code = section.get('courseCode')
            course_name = section.get('courseName', 'Unknown Course')
            average_grade = section.get('averageGrade', 0)
            instructor_id = section.get('instructorId')
            
            if course_code:
                if course_code not in courses:
                    courses[course_code] = {
                        'course_name': course_name,
                        'grades': [],
                        'instructor_ids': set()
                    }
                courses[course_code]['grades'].append(average_grade)
                if instructor_id:
                    courses[course_code]['instructor_ids'].add(instructor_id)
        
        # Calculate average grade for each course and identify at-risk courses
        at_risk_courses = []
        for course_code, data in courses.items():
            if data['grades']:
                # Calculate average of section averageGrade values for this course
                course_average = sum(data['grades']) / len(data['grades'])
                # If course average is less than 40, it's at-risk
                if course_average < 40:
                    # Get instructor names
                    instructor_names = []
                    for instructor_id in data['instructor_ids']:
                        instructor_doc = db.collection('instructors').document(instructor_id).get()
                        if instructor_doc and instructor_doc.exists:
                            instructor_data = instructor_doc.to_dict()
                            if instructor_data:
                                instructor_names.append(instructor_data.get('name', instructor_id))
                            else:
                                instructor_names.append(instructor_id)
                        else:
                            instructor_names.append(instructor_id)
                    
                    at_risk_courses.append({
                        'course_code': course_code,
                        'course_name': data['course_name'],
                        'average_grade': round(course_average, 2),
                        'instructor_names': instructor_names,
                        'section_count': len(data['grades'])
                    })
        
        # Sort by average grade (ascending)
        at_risk_courses.sort(key=lambda x: x['average_grade'])
        
        # Return the at-risk courses
        return {
            "courses": at_risk_courses,
            "department": department_name,
            "campus": campus_name,
            "total_at_risk_courses": len(at_risk_courses)
        }
        
    except Exception as e:
        logger.error(f"Error fetching department head at-risk courses: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching department head at-risk courses: {str(e)}")

@router.get("/department-head/instructor-comparison")
async def get_department_head_instructor_comparison(
    instructor1_id: str, 
    instructor2_id: str,
    course_code: Optional[str] = None,
    current_user: dict = Depends(verify_token)
):
    """Get instructor performance data for a specific department and campus.
    
    First, the API filters the sections collection in Firestore using the logged-in department head's 
    department and campus values. For the selected two instructors, the API aggregates their section 
    data separately. For each instructor, it calculates the number of students (sum of all students 
    in their sections), pass rate (sum of passing grades A+B+C+D divided by total students, 
    multiplied by 100), and average grade (average of the averageGrade field across all their sections). 
    Optionally, assessment-level averages for Quiz, Midterm, and Final can also be calculated.
    
    This endpoint:
    1. Gets the campus and department information for the current department head
    2. Queries sections that belong to that campus and department
    3. Optionally filters by courseCode if provided
    4. Separately aggregates data for each of the two selected instructors
    5. Calculates performance metrics for each instructor
    6. Returns structured comparison data
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get department head information from the current user
        department_name = current_user.get('department')
        campus_name = current_user.get('campus')
        
        if not department_name or not campus_name:
            raise HTTPException(status_code=400, detail="Department or Campus information not found for department head")
        
        # Query sections that belong to this campus and department
        sections_query = db.collection('sections').where('campus', '==', campus_name).where('department', '==', department_name)
        
        # If course_code is provided, filter by it
        if course_code:
            sections_query = sections_query.where('courseCode', '==', course_code)
            
        sections = [section.to_dict() for section in sections_query.stream()]
        
        # Filter sections for the two specific instructors
        instructor1_sections = [s for s in sections if s.get('instructorId') == instructor1_id]
        instructor2_sections = [s for s in sections if s.get('instructorId') == instructor2_id]
        
        # Function to calculate metrics for an instructor
        def calculate_instructor_metrics(instructor_sections):
            if not instructor_sections:
                return {
                    "student_count": 0,
                    "pass_rate": 0.0,
                    "average_grade": 0.0,
                    "quiz_average": 0.0,
                    "midterm_average": 0.0,
                    "final_average": 0.0
                }
            
            # Calculate total student count and pass/fail counts
            total_students = 0
            total_pass_grades = 0
            total_grades = 0
            
            # Calculate assessment averages
            quiz_scores = []
            midterm_scores = []
            final_scores = []
            section_average_grades = []
            
            for section in instructor_sections:
                # Get assessment data to calculate student counts and pass/fail rates
                assessments = section.get('assessments', {})
                if assessments:
                    # Process each assessment to get grade breakdowns
                    for assessment_name, assessment_data in assessments.items():
                        grade_breakdown = assessment_data.get('gradeBreakdown', {})
                        if grade_breakdown:
                            # Count grades A, B, C, D, F
                            a_count = grade_breakdown.get('A', 0)
                            b_count = grade_breakdown.get('B', 0)
                            c_count = grade_breakdown.get('C', 0)
                            d_count = grade_breakdown.get('D', 0)
                            f_count = grade_breakdown.get('F', 0)
                            
                            section_total_students = a_count + b_count + c_count + d_count + f_count
                            # Only add to totals once per section (not per assessment)
                            if assessment_name == list(assessments.keys())[0]:  # First assessment
                                total_students += section_total_students
                                # Count pass grades (A, B, C, D)
                                pass_grades = a_count + b_count + c_count + d_count
                                total_pass_grades += pass_grades
                                total_grades += section_total_students
                
                # Get assessment scores
                if assessments:
                    for assessment_name, assessment_data in assessments.items():
                        average_score = assessment_data.get('averageScore')
                        if average_score is not None:
                            # Categorize assessments by type
                            if 'Quiz' in assessment_name:
                                quiz_scores.append(average_score)
                            elif 'Midterm' in assessment_name:
                                midterm_scores.append(average_score)
                            elif 'Final' in assessment_name:
                                final_scores.append(average_score)
                
                # Collect section average grades
                if 'averageGrade' in section:
                    section_average_grades.append(section['averageGrade'])
            
            # Calculate pass rate
            pass_rate = 0.0
            if total_grades > 0:
                pass_rate = (total_pass_grades / total_grades) * 100
            
            # Calculate assessment averages
            quiz_average = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0.0
            midterm_average = sum(midterm_scores) / len(midterm_scores) if midterm_scores else 0.0
            final_average = sum(final_scores) / len(final_scores) if final_scores else 0.0
            
            # Calculate average grade across sections
            average_grade = sum(section_average_grades) / len(section_average_grades) if section_average_grades else 0.0
            
            return {
                "student_count": total_students,
                "pass_rate": round(pass_rate, 2),
                "average_grade": round(average_grade, 2),
                "quiz_average": round(quiz_average, 2),
                "midterm_average": round(midterm_average, 2),
                "final_average": round(final_average, 2)
            }
        
        # Calculate metrics for both instructors
        instructor1_metrics = calculate_instructor_metrics(instructor1_sections)
        instructor2_metrics = calculate_instructor_metrics(instructor2_sections)
        
        # Get instructor names from instructors collection
        instructor1_doc = db.collection('instructors').document(instructor1_id).get()
        instructor2_doc = db.collection('instructors').document(instructor2_id).get()
        
        # Handle potential None values from to_dict()
        instructor1_data = instructor1_doc.to_dict() if instructor1_doc.exists else {}
        instructor2_data = instructor2_doc.to_dict() if instructor2_doc.exists else {}
        
        instructor1_name = instructor1_data.get('name', instructor1_id) if instructor1_data else instructor1_id
        instructor2_name = instructor2_data.get('name', instructor2_id) if instructor2_data else instructor2_id
        
        # Return comparison data
        return {
            "comparison_data": {
                "instructor1": {
                    "id": instructor1_id,
                    "name": instructor1_name,
                    "metrics": instructor1_metrics
                },
                "instructor2": {
                    "id": instructor2_id,
                    "name": instructor2_name,
                    "metrics": instructor2_metrics
                },
                "course_code": course_code,
                "department": department_name,
                "campus": campus_name
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching department head instructor comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching department head instructor comparison: {str(e)}")

@router.get("/department-head/instructor-options")
async def get_department_head_instructor_options(current_user: dict = Depends(verify_token)):
    """Get list of instructors for the current department head's department and campus.
    
    This endpoint:
    1. Gets the campus and department information for the current department head
    2. Queries sections that belong to that campus and department
    3. Extracts unique instructor IDs and names
    4. Returns a list of instructor options for dropdown selection
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get department head information from the current user
        department_name = current_user.get('department')
        campus_name = current_user.get('campus')
        
        if not department_name or not campus_name:
            raise HTTPException(status_code=400, detail="Department or Campus information not found for department head")
        
        # Query sections that belong to this campus and department
        sections_query = db.collection('sections').where('campus', '==', campus_name).where('department', '==', department_name).stream()
        sections = [section.to_dict() for section in sections_query]
        
        # Extract unique instructor IDs
        unique_instructors = {}
        for section in sections:
            instructor_id = section.get('instructorId')
            if instructor_id:
                unique_instructors[instructor_id] = True
        
        # Get instructor names from instructors collection
        instructor_options = []
        for instructor_id in unique_instructors.keys():
            instructor_doc = db.collection('instructors').document(instructor_id).get()
            # Handle potential None values from to_dict()
            instructor_data = instructor_doc.to_dict() if instructor_doc.exists else {}
            instructor_name = instructor_data.get('name', instructor_id) if instructor_data else instructor_id
            instructor_options.append({
                "id": instructor_id,
                "name": instructor_name
            })
        
        # Sort by name
        instructor_options.sort(key=lambda x: x['name'])
        
        return {
            "instructor_options": instructor_options,
            "department": department_name,
            "campus": campus_name
        }
        
    except Exception as e:
        logger.error(f"Error fetching department head instructor options: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching department head instructor options: {str(e)}")

@router.get("/department-head/course-options")
async def get_department_head_course_options(current_user: dict = Depends(verify_token)):
    """Get list of courses for the current department head's department and campus.
    
    This endpoint:
    1. Gets the campus and department information for the current department head
    2. Queries sections that belong to that campus and department
    3. Extracts unique course codes
    4. Returns a list of course options for dropdown selection
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get department head information from the current user
        department_name = current_user.get('department')
        campus_name = current_user.get('campus')
        
        if not department_name or not campus_name:
            raise HTTPException(status_code=400, detail="Department or Campus information not found for department head")
        
        # Query sections that belong to this campus and department
        sections_query = db.collection('sections').where('campus', '==', campus_name).where('department', '==', department_name).stream()
        sections = [section.to_dict() for section in sections_query]
        
        # Extract unique course codes
        unique_courses = set()
        for section in sections:
            course_code = section.get('courseCode')
            if course_code:
                unique_courses.add(course_code)
        
        # Convert to sorted list
        course_options = sorted(list(unique_courses))
        
        return {
            "course_options": [{"code": code} for code in course_options],
            "department": department_name,
            "campus": campus_name
        }
        
    except Exception as e:
        logger.error(f"Error fetching department head course options: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching department head course options: {str(e)}")

@router.get("/department-head/performance-trends")
async def get_department_head_performance_trends(current_user: dict = Depends(verify_token)):
    """Calculate department-level performance trends across multiple semesters.
    
    The API queries the sections collection filtered by the selected department and campus.
    Then, it groups data by semesterId, calculates the average averageGrade and overall pass rate 
    for each semester, and returns it as a sorted list (ascending by semester).
    
    This endpoint:
    1. Gets the campus and department information for the current department head
    2. Queries all sections that belong to that campus and department
    3. Groups sections by semesterId
    4. Calculates average grade and pass rate for each semester
    5. Returns sorted trend data
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get department head information from the current user
        department_name = current_user.get('department')
        campus_name = current_user.get('campus')
        
        if not department_name or not campus_name:
            raise HTTPException(status_code=400, detail="Department or Campus information not found for department head")
        
        # Query sections that belong to this campus and department
        sections_query = db.collection('sections').where('campus', '==', campus_name).where('department', '==', department_name).stream()
        sections = [section.to_dict() for section in sections_query]
        
        if not sections:
            return {
                "trend_data": [],
                "department": department_name,
                "campus": campus_name
            }
        
        # Group sections by semesterId
        semesters_data = {}
        for section in sections:
            semester_id = section.get('semesterId')
            if semester_id:
                if semester_id not in semesters_data:
                    semesters_data[semester_id] = {
                        'total_grades': 0,
                        'pass_grades': 0,
                        'average_grades': []
                    }
                
                # Add average grade
                if 'averageGrade' in section:
                    semesters_data[semester_id]['average_grades'].append(section['averageGrade'])
                
                # Calculate pass/fail rates from assessments
                assessments = section.get('assessments', {})
                for assessment_name, assessment_data in assessments.items():
                    grade_breakdown = assessment_data.get('gradeBreakdown', {})
                    if grade_breakdown:
                        # Count grades A, B, C, D, F
                        a_count = grade_breakdown.get('A', 0)
                        b_count = grade_breakdown.get('B', 0)
                        c_count = grade_breakdown.get('C', 0)
                        d_count = grade_breakdown.get('D', 0)
                        f_count = grade_breakdown.get('F', 0)
                        
                        # Count pass grades (A, B, C, D)
                        pass_grades = a_count + b_count + c_count + d_count
                        total_grades = a_count + b_count + c_count + d_count + f_count
                        
                        semesters_data[semester_id]['pass_grades'] += pass_grades
                        semesters_data[semester_id]['total_grades'] += total_grades
        
        # Calculate trend data for each semester
        trend_data = []
        for semester_id, data in semesters_data.items():
            # Calculate average grade for the semester
            avg_grade = 0.0
            if data['average_grades']:
                avg_grade = sum(data['average_grades']) / len(data['average_grades'])
            
            # Calculate pass rate for the semester
            pass_rate = 0.0
            if data['total_grades'] > 0:
                pass_rate = (data['pass_grades'] / data['total_grades']) * 100
            
            trend_data.append({
                'semester_id': semester_id,
                'average_grade': round(avg_grade, 2),
                'pass_rate': round(pass_rate, 2),
                'total_sections': len(data['average_grades'])
            })
        
        # Sort by semester_id
        trend_data.sort(key=lambda x: x['semester_id'])
        
        # Return the trend data
        return {
            "trend_data": trend_data,
            "department": department_name,
            "campus": campus_name
        }
        
    except Exception as e:
        logger.error(f"Error calculating department head performance trends: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating department head performance trends: {str(e)}")

@router.get("/department-head/grade-trends")
async def get_department_head_grade_trends(current_user: dict = Depends(verify_token)):
    """Get semester-wise average grade trends for a department.
    
    When the department head logs in, the API filters all section records by the 
    specific department and campus. Then, it groups these sections by semesterId 
    to calculate the overall performance trend. For each semester group, the API 
    sums all averageGrade values and divides by the total number of sections to 
    find the semester's average grade. After that, it retrieves the corresponding 
    semester name from the semesters collection using the semesterId. Finally, 
    the API returns a sorted list of objects containing the semester name and 
    its calculated average grade.
    
    This endpoint:
    1. Gets the campus and department information for the current department head
    2. Queries all sections that belong to that campus and department
    3. Groups sections by semesterId
    4. Calculates average grade for each semester
    5. Retrieves semester names from semesters collection
    6. Returns sorted trend data
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get department head information from the current user
        department_name = current_user.get('department')
        campus_name = current_user.get('campus')
        
        if not department_name or not campus_name:
            raise HTTPException(status_code=400, detail="Department or Campus information not found for department head")
        
        # Query sections that belong to this campus and department
        sections_query = db.collection('sections').where('campus', '==', campus_name).where('department', '==', department_name).stream()
        sections = [section.to_dict() for section in sections_query]
        
        if not sections:
            return {
                "trend_data": [],
                "department": department_name,
                "campus": campus_name
            }
        
        # Group sections by semesterId and calculate average grades
        semesters_data = {}
        for section in sections:
            semester_id = section.get('semesterId')
            average_grade = section.get('averageGrade')
            
            if semester_id and average_grade is not None:
                if semester_id not in semesters_data:
                    semesters_data[semester_id] = {
                        'grades': [],
                        'total_grade': 0,
                        'count': 0
                    }
                
                semesters_data[semester_id]['grades'].append(average_grade)
                semesters_data[semester_id]['total_grade'] += average_grade
                semesters_data[semester_id]['count'] += 1
        
        # Calculate average grade for each semester
        trend_data = []
        for semester_id, data in semesters_data.items():
            if data['count'] > 0:
                avg_grade = data['total_grade'] / data['count']
                
                # Get semester name from semesters collection
                semester_doc = db.collection('semesters').document(semester_id).get()
                semester_data = semester_doc.to_dict() if semester_doc.exists else {}
                semester_name = semester_data.get('name', semester_id) if semester_data else semester_id
                
                trend_data.append({
                    'semester_id': semester_id,
                    'semester_name': semester_name,
                    'average_grade': round(avg_grade, 2)
                })
        
        # Sort by semester_id
        trend_data.sort(key=lambda x: x['semester_id'])
        
        # Return the trend data
        return {
            "trend_data": trend_data,
            "department": department_name,
            "campus": campus_name
        }
        
    except Exception as e:
        logger.error(f"Error fetching department head grade trends: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching department head grade trends: {str(e)}")

@router.get("/department-head/all-instructors-performance")
async def get_department_head_all_instructors_performance(current_user: dict = Depends(verify_token)):
    """Get performance data for all instructors in a department for a department head's dashboard.
    
    When the department head logs in, the API uses their campus and department values 
    to filter all relevant sections from the sections collection in Firestore. Then, 
    the API groups these sections by instructorId to handle instructors teaching multiple courses/sections. 
    For each unique instructor, it calculates performance metrics including student count, pass rate, 
    and average grade across all their sections.
    
    This endpoint:
    1. Gets the campus and department information for the current department head
    2. Queries all sections that belong to that campus and department
    3. Groups sections by instructorId
    4. Calculates performance metrics for each instructor
    5. Returns structured performance data for all instructors
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get department head information from the current user
        department_name = current_user.get('department')
        campus_name = current_user.get('campus')
        
        if not department_name or not campus_name:
            raise HTTPException(status_code=400, detail="Department or Campus information not found for department head")
        
        # Query sections that belong to this campus and department
        sections_query = db.collection('sections').where('campus', '==', campus_name).where('department', '==', department_name).stream()
        sections = [section.to_dict() for section in sections_query]
        
        if not sections:
            return {
                "instructors": [],
                "department": department_name,
                "campus": campus_name
            }
        
        # Group sections by instructorId
        instructors_data = {}
        for section in sections:
            instructor_id = section.get('instructorId')
            course_code = section.get('courseCode')
            course_name = section.get('courseName', 'Unknown Course')
            average_grade = section.get('averageGrade', 0)
            assessments = section.get('assessments', {})
            
            if instructor_id:
                if instructor_id not in instructors_data:
                    instructors_data[instructor_id] = {
                        'courses': set(),
                        'total_students': 0,
                        'total_pass_grades': 0,
                        'total_grades': 0,
                        'grades': []
                    }
                
                # Add course to instructor's course set (only course code)
                if course_code:
                    instructors_data[instructor_id]['courses'].add(course_code)
                
                # Calculate student counts and pass/fail rates from assessments
                if assessments:
                    for assessment_name, assessment_data in assessments.items():
                        grade_breakdown = assessment_data.get('gradeBreakdown', {})
                        if grade_breakdown:
                            # Count grades A, B, C, D, F
                            a_count = grade_breakdown.get('A', 0)
                            b_count = grade_breakdown.get('B', 0)
                            c_count = grade_breakdown.get('C', 0)
                            d_count = grade_breakdown.get('D', 0)
                            f_count = grade_breakdown.get('F', 0)
                            
                            section_total_students = a_count + b_count + c_count + d_count + f_count
                            # Only add to totals once per section (not per assessment)
                            if assessment_name == list(assessments.keys())[0]:  # First assessment
                                instructors_data[instructor_id]['total_students'] += section_total_students
                                # Count pass grades (A, B, C, D)
                                pass_grades = a_count + b_count + c_count + d_count
                                instructors_data[instructor_id]['total_pass_grades'] += pass_grades
                                instructors_data[instructor_id]['total_grades'] += section_total_students
                
                # Collect section average grades
                if isinstance(average_grade, (int, float)):
                    instructors_data[instructor_id]['grades'].append(average_grade)
        
        # Calculate performance metrics for each instructor
        instructors_performance = []
        for instructor_id, data in instructors_data.items():
            # Get instructor name
            instructor_doc = db.collection('instructors').document(instructor_id).get()
            if instructor_doc and instructor_doc.exists:
                instructor_data = instructor_doc.to_dict()
                instructor_name = instructor_data.get('name', instructor_id) if instructor_data else instructor_id
            else:
                instructor_name = instructor_id
            
            # Calculate pass rate
            pass_rate = 0.0
            if data['total_grades'] > 0:
                pass_rate = (data['total_pass_grades'] / data['total_grades']) * 100
            
            # Calculate average grade across sections
            average_grade = 0.0
            if data['grades']:
                average_grade = sum(data['grades']) / len(data['grades'])
            
            instructors_performance.append({
                'instructor_id': instructor_id,
                'instructor_name': instructor_name,
                'courses_taught': list(data['courses']),
                'total_students': data['total_students'],
                'pass_rate': round(pass_rate, 2),
                'average_grade': round(average_grade, 2),
                'sections_count': len(data['grades'])
            })
        
        # Sort by average grade (descending)
        instructors_performance.sort(key=lambda x: x['average_grade'], reverse=True)
        
        # Return the instructors performance data
        return {
            "instructors": instructors_performance,
            "department": department_name,
            "campus": campus_name,
            "total_instructors": len(instructors_performance)
        }
        
    except Exception as e:
        logger.error(f"Error fetching department head all instructors performance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching department head all instructors performance: {str(e)}")
