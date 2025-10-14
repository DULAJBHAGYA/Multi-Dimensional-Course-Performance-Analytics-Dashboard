"""
Instructor Predictive RAG Routes
Retrieval-Augmented Generation for instructor performance predictions
"""
from fastapi import APIRouter, Depends, HTTPException
from app.firebase_config import get_firestore_client
from app.routes.firebase_auth_updated import verify_token
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
import numpy as np

router = APIRouter()
logger = logging.getLogger(__name__)

# Data models
class CoursePredictionData(BaseModel):
    course_code: str
    course_name: str
    predicted_average_grade: float
    predicted_pass_rate: float
    confidence: float

class InstructorPredictionResponse(BaseModel):
    generated_at: str
    instructor_id: str
    instructor_name: str
    predicted_average_grade: float
    predicted_pass_rate: float
    at_risk_courses_count: int
    total_courses: int
    courses: List[CoursePredictionData]
    risk_level: str
    recommendations: List[str]

class RiskMatrixPoint(BaseModel):
    course_code: str
    num_sections: int
    predicted_at_risk_sections: int
    average_grade: float

class RiskMatrixResponse(BaseModel):
    generated_at: str
    risk_points: List[RiskMatrixPoint]

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

def calculate_risk_score(average_grade: float, pass_rate: float) -> float:
    """Calculate risk score based on performance metrics (simplified to 2 parameters)"""
    # Risk score formula: Higher risk for lower grades and lower pass rates
    # Normalize values to 0-100 scale
    grade_risk = max(0, (100 - average_grade) * 0.6)  # 60% weight for grades
    pass_rate_risk = max(0, (100 - pass_rate) * 0.4)  # 40% weight for pass rates
    
    return grade_risk + pass_rate_risk

@router.get("/predictive-analytics", response_model=InstructorPredictionResponse)
async def get_instructor_predictive_analytics(
    current_user: dict = Depends(verify_token)
):
    """
    Get predictive analytics for an instructor using RAG approach.
    
    This endpoint provides predictions for:
    1. Instructor predicted average grade
    2. Instructor predicted pass rate
    3. Number of at-risk courses
    4. Course-level predictions
    5. Risk assessment and recommendations
    
    The predictions are based on historical section data and machine learning models.
    """
    try:
        # Check if user is an instructor
        if current_user.get('role') != 'instructor':
            raise HTTPException(status_code=403, detail="Access denied. User is not an instructor.")
        
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('id')
        instructor_name = current_user.get('name', 'Unknown Instructor')
        
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found for user")
        
        # Get all sections for this instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id)
        sections_docs = list(sections_query.limit(1000).stream())
        sections_data = []
        
        # Process sections data
        for doc in sections_docs:
            section_data = doc.to_dict()
            section_data['id'] = doc.id
            sections_data.append(section_data)
        
        if not sections_data:
            raise HTTPException(status_code=404, detail="No sections found for instructor")
        
        # Pre-fetch course details to reduce database calls
        course_details = {}
        course_ids = set(section.get('courseId') for section in sections_data if section.get('courseId'))
        for course_id in course_ids:
            course_code, course_name = get_course_details(db, course_id)
            course_details[course_id] = (course_code, course_name)
        
        # Calculate metrics
        total_sections = len(sections_data)
        average_grades = [s.get('averageGrade', 0) for s in sections_data if s.get('averageGrade') is not None]
        
        # Calculate instructor average grade
        instructor_avg_grade = sum(average_grades) / len(average_grades) if average_grades else 0
        
        # Calculate pass rates for each section
        section_pass_rates = []
        at_risk_sections = []
        
        # Group data by course
        course_metrics = {}
        
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
                course_metrics[course_id] = {
                    'grades': [],
                    'pass_rates': [],
                    'course_code': course_details.get(course_id, ('Unknown', 'Unknown Course'))[0],
                    'course_name': course_details.get(course_id, ('Unknown', 'Unknown Course'))[1],
                    'enrollment': 0
                }
            
            if section.get('averageGrade') is not None:
                course_metrics[course_id]['grades'].append(section['averageGrade'])
                course_metrics[course_id]['pass_rates'].append(pass_rate)
            
            # Add enrollment count (assuming each section has studentCount)
            course_metrics[course_id]['enrollment'] += section.get('studentCount', 0)
        
        # Calculate course-level predictions
        course_predictions = []
        at_risk_courses_count = 0
        risk_points = []
        
        for course_id, metrics in course_metrics.items():
            if metrics['grades']:
                avg_grade = sum(metrics['grades']) / len(metrics['grades'])
                avg_pass_rate = sum(metrics['pass_rates']) / len(metrics['pass_rates'])
                
                # Determine if course is at risk
                is_at_risk = avg_grade < 70
                if is_at_risk:
                    at_risk_courses_count += 1
                
                # Calculate confidence based on data points
                confidence = min(100, len(metrics['grades']) * 10)  # Simple confidence calculation
                
                course_predictions.append(CoursePredictionData(
                    course_code=metrics['course_code'],
                    course_name=metrics['course_name'],
                    predicted_average_grade=round(avg_grade, 2),
                    predicted_pass_rate=round(avg_pass_rate, 2),
                    confidence=round(confidence, 2)
                ))
                
                # Add to risk matrix data
                num_sections = len(metrics['grades'])
                predicted_at_risk_sections = sum(1 for grade in metrics['grades'] if grade < 70)
                
                # Calculate average grade for the course
                avg_grade = sum(metrics['grades']) / len(metrics['grades'])
                
                risk_points.append(RiskMatrixPoint(
                    course_code=metrics['course_code'],
                    num_sections=num_sections,
                    predicted_at_risk_sections=predicted_at_risk_sections,
                    average_grade=round(avg_grade, 2)
                ))
        
        # Calculate instructor pass rate
        instructor_avg_pass_rate = sum(section_pass_rates) / len(section_pass_rates) if section_pass_rates else 0
        
        # Determine risk level (only Good and At Risk, no Medium)
        if instructor_avg_grade >= 70:
            risk_level = "Low"  # Will be displayed as "Good" in frontend
        else:
            risk_level = "High"  # Will be displayed as "At Risk" in frontend
        
        # Generate recommendations based on performance (only Good and At Risk)
        recommendations = []
        if risk_level == "High":  # At Risk
            recommendations.append("Focus on improving student engagement and providing additional support resources")
            recommendations.append("Consider reviewing course content and teaching methodologies")
            recommendations.append("Implement regular check-ins with at-risk students")
        else:  # Good (Low risk)
            recommendations.append("Maintain current teaching approach and continue monitoring performance")
            recommendations.append("Share best practices with other instructors")
            recommendations.append("Consider mentoring other instructors")
        
        return InstructorPredictionResponse(
            generated_at=datetime.now().isoformat(),
            instructor_id=instructor_id,
            instructor_name=instructor_name,
            predicted_average_grade=round(instructor_avg_grade, 2),
            predicted_pass_rate=round(instructor_avg_pass_rate, 2),
            at_risk_courses_count=at_risk_courses_count,
            total_courses=len(course_metrics),
            courses=course_predictions,
            risk_level=risk_level,
            recommendations=recommendations
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting instructor predictive analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting instructor predictive analytics: {str(e)}")

@router.get("/risk-matrix", response_model=RiskMatrixResponse)
async def get_instructor_risk_matrix(
    current_user: dict = Depends(verify_token)
):
    """
    Get risk matrix data for an instructor's courses.
    
    This endpoint provides risk assessment data for visualization in a scatter plot.
    """
    try:
        # Check if user is an instructor
        if current_user.get('role') != 'instructor':
            raise HTTPException(status_code=403, detail="Access denied. User is not an instructor.")
        
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('id')
        
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found for user")
        
        # Get all sections for this instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id)
        sections_docs = list(sections_query.limit(1000).stream())
        sections_data = []
        
        # Process sections data
        for doc in sections_docs:
            section_data = doc.to_dict()
            section_data['id'] = doc.id
            sections_data.append(section_data)
        
        if not sections_data:
            return RiskMatrixResponse(
                generated_at=datetime.now().isoformat(),
                risk_points=[]
            )
        
        # Pre-fetch course details to reduce database calls
        course_details = {}
        course_ids = set(section.get('courseId') for section in sections_data if section.get('courseId'))
        for course_id in course_ids:
            course_code, course_name = get_course_details(db, course_id)
            course_details[course_id] = (course_code, course_name)
        
        # Calculate risk matrix points
        risk_points = []
        course_metrics = {}
        
        for section in sections_data:
            # Calculate pass rate from grade breakdown
            pass_rate = calculate_pass_rate_from_grades(section.get('assessments', {}))
            
            # Group by course
            course_id = section.get('courseId', 'unknown')
            if course_id not in course_metrics:
                course_metrics[course_id] = {
                    'grades': [],
                    'pass_rates': [],
                    'course_code': course_details.get(course_id, ('Unknown', 'Unknown Course'))[0],
                    'enrollment': 0
                }
            
            if section.get('averageGrade') is not None:
                course_metrics[course_id]['grades'].append(section['averageGrade'])
                course_metrics[course_id]['pass_rates'].append(pass_rate)
            
            # Add enrollment count
            course_metrics[course_id]['enrollment'] += section.get('studentCount', 0)
        
        # Generate risk matrix points
        for course_id, metrics in course_metrics.items():
            if metrics['grades']:
                # Calculate average grade for the course
                avg_grade = sum(metrics['grades']) / len(metrics['grades'])
                
                # Add to risk matrix data
                num_sections = len(metrics['grades'])
                predicted_at_risk_sections = sum(1 for grade in metrics['grades'] if grade < 70)
                avg_grade = sum(metrics['grades']) / len(metrics['grades'])
                
                risk_points.append(RiskMatrixPoint(
                    course_code=metrics['course_code'],
                    num_sections=num_sections,
                    predicted_at_risk_sections=predicted_at_risk_sections,
                    average_grade=round(avg_grade, 2)
                ))
        
        return RiskMatrixResponse(
            generated_at=datetime.now().isoformat(),
            risk_points=risk_points
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting instructor risk matrix: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting instructor risk matrix: {str(e)}")