"""
Department Head Predictive Routes
Prediction model for analyzing department performance
"""
from fastapi import APIRouter, Depends, HTTPException
from app.firebase_config import get_firestore_client
from app.routes.firebase_auth_updated import verify_token
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from collections import defaultdict
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

# Data models
class CoursePredictionData(BaseModel):
    course_code: str
    course_name: str
    predicted_average_grade: float
    predicted_pass_rate: float

class InstructorPredictionData(BaseModel):
    instructor_name: str
    predicted_average_grade: float

class DepartmentPredictionResponse(BaseModel):
    generated_at: str
    department_id: str
    department_name: str
    predicted_average_grade: float
    predicted_pass_rate: float
    at_risk_crn_count: int
    low_performing_instructor_count: int
    courses: List[CoursePredictionData]
    instructors: List[InstructorPredictionData]

def calculate_pass_rate_from_grades(assessments: Dict) -> float:
    """Calculate pass rate from grade breakdown in assessments"""
    if not assessments:
        return 0.0
    
    total_pass = 0
    total_grades = 0
    
    for assessment_data in assessments.values():
        grade_breakdown = assessment_data.get('gradeBreakdown', {})
        if grade_breakdown:
            # Count pass grades (A, B, C, D)
            pass_grades = (
                grade_breakdown.get('A', 0) +
                grade_breakdown.get('B', 0) +
                grade_breakdown.get('C', 0) +
                grade_breakdown.get('D', 0)
            )
            total_pass += pass_grades
            
            # Count all grades
            total = (
                grade_breakdown.get('A', 0) +
                grade_breakdown.get('B', 0) +
                grade_breakdown.get('C', 0) +
                grade_breakdown.get('D', 0) +
                grade_breakdown.get('F', 0)
            )
            total_grades += total
    
    if total_grades == 0:
        return 0.0
    
    return (total_pass / total_grades) * 100

def get_course_details(db, course_id: str) -> tuple:
    """Get course code and name from course ID"""
    try:
        course_doc = db.collection('courses').document(course_id).get()
        if course_doc.exists:
            course_data = course_doc.to_dict()
            course_code = course_data.get('courseCode', 'Unknown')
            course_name = course_data.get('courseName', 'Unknown Course')
            return course_code, course_name
        return 'Unknown', 'Unknown Course'
    except Exception as e:
        logger.error(f"Error fetching course details for {course_id}: {str(e)}")
        return 'Unknown', 'Unknown Course'

def get_instructor_name(db, instructor_id: str) -> str:
    """Get instructor name from instructor ID"""
    try:
        instructor_doc = db.collection('instructors').document(instructor_id).get()
        if instructor_doc.exists:
            instructor_data = instructor_doc.to_dict()
            return instructor_data.get('display_name', instructor_data.get('username', 'Unknown Instructor'))
        return 'Unknown Instructor'
    except Exception as e:
        logger.error(f"Error fetching instructor name for {instructor_id}: {str(e)}")
        return 'Unknown Instructor'

def get_course_details_batch(db, course_ids: List[str]) -> Dict[str, tuple]:
    """Get course code and name for multiple course IDs in a single query"""
    if not course_ids:
        return {}
    
    try:
        # Batch get course documents
        course_refs = [db.collection('courses').document(course_id) for course_id in course_ids]
        course_docs = db.get_all(course_refs)
        
        course_details = {}
        for doc in course_docs:
            if doc.exists:
                course_data = doc.to_dict()
                course_code = course_data.get('courseCode', 'Unknown')
                course_name = course_data.get('courseName', 'Unknown Course')
                course_details[doc.id] = (course_code, course_name)
            else:
                course_details[doc.id] = ('Unknown', 'Unknown Course')
        
        return course_details
    except Exception as e:
        logger.error(f"Error batch fetching course details: {str(e)}")
        # Fallback to individual fetching
        course_details = {}
        for course_id in course_ids:
            course_code, course_name = get_course_details(db, course_id)
            course_details[course_id] = (course_code, course_name)
        return course_details

def get_instructor_names_batch(db, instructor_ids: List[str], department_id: str) -> Dict[str, str]:
    """Get instructor names for multiple instructor IDs in a single query, filtered by department"""
    if not instructor_ids:
        return {}
    
    try:
        # Batch get instructor documents
        instructor_refs = [db.collection('instructors').document(instructor_id) for instructor_id in instructor_ids]
        instructor_docs = db.get_all(instructor_refs)
        
        instructor_names = {}
        for doc in instructor_docs:
            if doc.exists:
                instructor_data = doc.to_dict()
                # Only include instructors from this department
                if instructor_data.get('department') == department_id:
                    name = instructor_data.get('display_name', instructor_data.get('username', 'Unknown Instructor'))
                    instructor_names[doc.id] = name
        
        return instructor_names
    except Exception as e:
        logger.error(f"Error batch fetching instructor names: {str(e)}")
        # Fallback to individual fetching
        instructor_names = {}
        for instructor_id in instructor_ids:
            name = get_instructor_name(db, instructor_id)
            # We'll filter by department on the client side since we don't have access to db here
            instructor_names[instructor_id] = name
        return instructor_names

@router.get("/predictive-analytics", response_model=DepartmentPredictionResponse)
async def get_department_predictive_analytics(
    current_user: dict = Depends(verify_token)
):
    """
    Get predictive analytics for a department head's department.
    
    This endpoint provides predictions for:
    1. Department predicted average grade
    2. Department predicted pass rate
    3. Number of at-risk CRNs (course sections)
    4. Number of low-performing instructors
    5. Course-level predictions
    6. Instructor-level predictions
    
    The predictions are based on historical section data and machine learning models.
    """
    try:
        # Check if user is a department head
        if current_user.get('role') != 'department_head':
            raise HTTPException(status_code=403, detail="Access denied. User is not a department head.")
        
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        department_id = current_user.get('department')
        campus_id = current_user.get('campus')
        
        if not department_id:
            raise HTTPException(status_code=400, detail="Department not found for user")
        
        if not campus_id:
            raise HTTPException(status_code=400, detail="Campus not found for user")
        
        # Get department name
        department_doc = db.collection('departments').document(department_id).get()
        department_name = department_doc.to_dict().get('department', department_id) if department_doc.exists else department_id
        
        # Try to get sections for this department and campus with limit for performance
        sections_query = db.collection('sections')
        
        # Apply department filter
        sections_query = sections_query.where('department', '==', department_id)
        
        # Apply campus filter only if campus_id exists
        if campus_id:
            sections_query = sections_query.where('campusId', '==', campus_id)
        
        # Limit to 500 sections for performance (instead of 1000)
        sections_docs = list(sections_query.limit(500).stream())
        sections_data = []
        
        # Process sections data
        for doc in sections_docs:
            section_data = doc.to_dict()
            section_data['id'] = doc.id
            sections_data.append(section_data)
        
        # If no sections found with both filters, try just department
        if not sections_data and campus_id:
            logger.info("No sections found for both department and campus, trying department only")
            sections_query = db.collection('sections').where('department', '==', department_id)
            sections_docs = list(sections_query.limit(500).stream())  # Also limit here
            for doc in sections_docs:
                section_data = doc.to_dict()
                section_data['id'] = doc.id
                sections_data.append(section_data)
        
        if not sections_data:
            logger.warning("No sections found for department")
            # Return empty response instead of error
            return DepartmentPredictionResponse(
                generated_at=datetime.now().isoformat(),
                department_id=department_id,
                department_name=department_name,
                predicted_average_grade=0.0,
                predicted_pass_rate=0.0,
                at_risk_crn_count=0,
                low_performing_instructor_count=0,
                courses=[],
                instructors=[]
            )
        
        # Batch pre-fetch course details to reduce database calls
        course_ids = list(set(section.get('courseId') for section in sections_data if section.get('courseId')))
        course_details = get_course_details_batch(db, course_ids)
        
        # Batch pre-fetch instructor names - ONLY for instructors in this department
        instructor_ids = list(set(section.get('instructorId') for section in sections_data if section.get('instructorId')))
        instructor_names = get_instructor_names_batch(db, instructor_ids, department_id)
        
        # Calculate metrics
        total_sections = len(sections_data)
        average_grades = [s.get('averageGrade', 0) for s in sections_data if s.get('averageGrade') is not None]
        
        # Calculate department average grade
        dept_avg_grade = sum(average_grades) / len(average_grades) if average_grades else 0
        
        # Calculate pass rates for each section
        section_pass_rates = []
        at_risk_sections = []
        
        # Group data by course
        course_metrics = {}
        instructor_metrics = {}
        
        for section in sections_data:
            # Calculate pass rate from grade breakdown
            pass_rate = calculate_pass_rate_from_grades(section.get('assessments', {}))
            section_pass_rates.append(pass_rate)
            
            # Check if section is at risk (average grade < 70)
            is_at_risk = section.get('averageGrade', 0) < 70 if section.get('averageGrade') is not None else False
            
            if is_at_risk:
                at_risk_sections.append(section)
            
            # Group by course
            course_id = section.get('courseId', 'unknown')
            if course_id not in course_metrics:
                course_code, course_name = course_details.get(course_id, ('Unknown', 'Unknown Course'))
                course_metrics[course_id] = {
                    'grades': [],
                    'pass_rates': [],
                    'course_code': course_code,
                    'course_name': course_name
                }
            
            if section.get('averageGrade') is not None:
                course_metrics[course_id]['grades'].append(section['averageGrade'])
                course_metrics[course_id]['pass_rates'].append(pass_rate)
            
            # Group by instructor - ONLY for instructors in this department
            instructor_id = section.get('instructorId', 'unknown')
            # Only process instructors that belong to this department
            if instructor_id in instructor_names:
                if instructor_id not in instructor_metrics:
                    instructor_name = instructor_names.get(instructor_id, 'Unknown Instructor')
                    instructor_metrics[instructor_id] = {
                        'grades': [],
                        'instructor_name': instructor_name
                    }
                
                if section.get('averageGrade') is not None:
                    instructor_metrics[instructor_id]['grades'].append(section['averageGrade'])
        
        # Calculate course-level predictions
        course_predictions = []
        for course_id, metrics in course_metrics.items():
            if metrics['grades']:
                avg_grade = sum(metrics['grades']) / len(metrics['grades'])
                avg_pass_rate = sum(metrics['pass_rates']) / len(metrics['pass_rates'])
                
                course_predictions.append(CoursePredictionData(
                    course_code=metrics['course_code'],
                    course_name=metrics['course_name'],
                    predicted_average_grade=round(avg_grade, 2),
                    predicted_pass_rate=round(avg_pass_rate, 2)
                ))
        
        # Calculate instructor-level predictions - ONLY for instructors in this department
        instructor_predictions = []
        low_performing_instructors = 0
        
        for instructor_id, metrics in instructor_metrics.items():
            if metrics['grades']:
                avg_grade = sum(metrics['grades']) / len(metrics['grades'])
                
                # Count low-performing instructors (avg grade < 70)
                if avg_grade < 70:
                    low_performing_instructors += 1
                
                instructor_predictions.append(InstructorPredictionData(
                    instructor_name=metrics['instructor_name'],
                    predicted_average_grade=round(avg_grade, 2)
                ))
        
        # Calculate department pass rate
        dept_avg_pass_rate = sum(section_pass_rates) / len(section_pass_rates) if section_pass_rates else 0
        
        # Count at-risk CRNs
        at_risk_crn_count = len(at_risk_sections)
        
        return DepartmentPredictionResponse(
            generated_at=datetime.now().isoformat(),
            department_id=department_id,
            department_name=department_name,
            predicted_average_grade=round(dept_avg_grade, 2),
            predicted_pass_rate=round(dept_avg_pass_rate, 2),
            at_risk_crn_count=at_risk_crn_count,
            low_performing_instructor_count=low_performing_instructors,
            courses=course_predictions,
            instructors=instructor_predictions
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting department predictive analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting department predictive analytics: {str(e)}")