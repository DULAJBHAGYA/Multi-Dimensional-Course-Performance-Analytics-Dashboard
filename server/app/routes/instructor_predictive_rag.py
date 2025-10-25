"""
Instructor Predictive RAG Routes
Retrieval-Augmented Generation for instructor performance predictions
"""
from fastapi import APIRouter, Depends, HTTPException, Response
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

@router.get("/chat-rag", response_model=dict)
async def get_chat_rag_response(
    question: str,
    current_user: dict = Depends(verify_token)
):
    """
    Get RAG-based response for chat questions using instructor performance data.
    
    This endpoint provides context-aware responses based on the instructor's:
    1. Performance metrics
    2. Course data
    3. Risk assessments
    4. Predictive analytics
    
    The response is generated using Retrieval-Augmented Generation approach.
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
            return {"response": "I don't have enough data about your courses to provide a detailed response. Please make sure your course data is up to date."}
        
        # Pre-fetch course details to reduce database calls
        course_details = {}
        course_ids = set(section.get('courseId') for section in sections_data if section.get('courseId'))
        for course_id in course_ids:
            try:
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict()
                    course_details[course_id] = {
                        'courseCode': course_data.get('courseCode', 'Unknown'),
                        'courseName': course_data.get('courseName', 'Unknown Course')
                    }
            except Exception as e:
                logger.error(f"Error fetching course details for {course_id}: {str(e)}")
                course_details[course_id] = {
                    'courseCode': 'Unknown',
                    'courseName': 'Unknown Course'
                }
        
        # Calculate performance metrics
        average_grades = [s.get('averageGrade', 0) for s in sections_data if s.get('averageGrade') is not None]
        instructor_avg_grade = sum(average_grades) / len(average_grades) if average_grades else 0
        
        # Calculate pass rates
        total_pass = 0
        total_grades = 0
        
        for section in sections_data:
            assessments = section.get('assessments', {})
            if assessments:
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
        
        instructor_pass_rate = (total_pass / total_grades * 100) if total_grades > 0 else 0
        
        # Calculate at-risk sections
        at_risk_sections = [s for s in sections_data if s.get('averageGrade', 0) < 70]
        at_risk_count = len(at_risk_sections)
        
        # Group data by course
        course_metrics = {}
        
        for section in sections_data:
            course_id = section.get('courseId', 'unknown')
            if course_id not in course_metrics:
                course_metrics[course_id] = {
                    'grades': [],
                    'course_code': course_details.get(course_id, {}).get('courseCode', 'Unknown'),
                    'course_name': course_details.get(course_id, {}).get('courseName', 'Unknown Course')
                }
            
            if section.get('averageGrade') is not None:
                course_metrics[course_id]['grades'].append(section['averageGrade'])
        
        # Calculate course-level metrics
        course_performances = []
        for course_id, metrics in course_metrics.items():
            if metrics['grades']:
                avg_grade = sum(metrics['grades']) / len(metrics['grades'])
                course_performances.append({
                    'course_code': metrics['course_code'],
                    'course_name': metrics['course_name'],
                    'average_grade': round(avg_grade, 2),
                    'section_count': len(metrics['grades'])
                })
        
        # Sort courses by performance
        best_performing = sorted(course_performances, key=lambda x: x['average_grade'], reverse=True)[:3]
        worst_performing = sorted(course_performances, key=lambda x: x['average_grade'])[:3]
        
        # Generate context-aware response based on the question
        question_lower = question.lower()
        
        # Debug logging to help identify issues
        logger.debug(f"Question: {question}")
        logger.debug(f"Question lower: {question_lower}")
        logger.debug(f"Total sections: {len(sections_data)}, Total courses: {len(course_performances)}")
        logger.debug(f"At-risk count: {at_risk_count}")
        
        # Check for course-specific questions in all cases, not just specific categories
        import re
        
        # Look for course codes in the question (e.g., CIS005, ET&S014, etc.)
        course_code_pattern = r'\b[A-Z0-9&]+[0-9]{3,}\b'
        specific_courses = re.findall(course_code_pattern, question)
        
        # If we found course codes, handle them specifically
        if specific_courses:
            # Handle specific course questions
            response = ""
            for course_code in specific_courses:
                # Find this course in the course_performances
                matching_courses = [c for c in course_performances if course_code in c['course_code']]
                if matching_courses:
                    course = matching_courses[0]  # Take the first match
                    response += f"Course {course['course_code']} has an average grade of {course['average_grade']}% "
                    if course['average_grade'] >= 90:
                        response += "(Excellent performance). "
                    elif course['average_grade'] >= 80:
                        response += "(Good performance). "
                    elif course['average_grade'] >= 70:
                        response += "(Acceptable performance). "
                    else:
                        response += "(Needs improvement). "
                else:
                    response += f"I don't have specific data for course {course_code}. "
        else:
            # Log what keywords we're checking for
            logger.debug(f"Checking keywords - recommend: {'recommend' in question_lower}, improve: {'improve' in question_lower}")
            logger.debug(f"Checking keywords - hello/hi/hey: {('hello' in question_lower or 'hi' in question_lower or 'hey' in question_lower)}")
            logger.debug(f"Checking keywords - performance/grade: {('performance' in question_lower or 'grade' in question_lower)}")
            logger.debug(f"Checking keywords - pass/rate: {('pass' in question_lower or 'rate' in question_lower)}")
            logger.debug(f"Checking keywords - risk-related: {('risk' in question_lower or 'at-risk' in question_lower or 'danger' in question_lower or 'dangerous' in question_lower or 'problem' in question_lower or 'trouble' in question_lower or 'failing' in question_lower or 'poor' in question_lower or 'warning' in question_lower or 'concern' in question_lower or 'issue' in question_lower or 'in danger' in question_lower or 'attention' in question_lower or 'sections' in question_lower or 'need' in question_lower)}")
            logger.debug(f"Checking keywords - course/teach: {('course' in question_lower or 'teach' in question_lower)}")
            logger.debug(f"Checking specific question: {'which sections need attention' in question_lower}")
            
            # Handle pass rate questions specifically (prioritize this over general topics)
            if 'pass' in question_lower and 'rate' in question_lower:
                logger.debug("Matched pass/rate condition")
                response = f"Your overall pass rate is {instructor_pass_rate:.1f}%. "
                if instructor_pass_rate >= 90:
                    response += "This is an excellent pass rate. "
                elif instructor_pass_rate >= 80:
                    response += "This is a good pass rate. "
                elif instructor_pass_rate >= 70:
                    response += "This is an acceptable pass rate, but could be improved. "
                else:
                    response += "This pass rate indicates issues that need to be addressed. "
            
            # Handle recommendation/improvement questions
            elif 'recommend' in question_lower or 'improve' in question_lower:
                response = "Based on your performance data, here are some recommendations: "
                
                if instructor_avg_grade < 70:
                    response += "Focus on improving student engagement and providing additional support resources. "
                    response += "Consider reviewing course content and teaching methodologies. "
                elif instructor_avg_grade < 80:
                    response += "Monitor student performance closely and provide timely feedback. "
                    response += "Consider offering review sessions before major assessments. "
                else:
                    response += "Maintain your current teaching approach and continue monitoring performance. "
                    response += "Share best practices with other instructors. "
                
                if at_risk_count > 0:
                    response += "Implement regular check-ins with students in at-risk sections. "
            
            # Handle greeting messages
            elif 'hello' in question_lower or 'hi' in question_lower or 'hey' in question_lower:
                # Handle greeting messages specifically
                response = "Hello! I'm here to help you make sense of your predictive analytics. "
                response += "I can explain any of the predictions, suggest improvements, or help you understand what the data means for your course. "
                response += "What would you like to explore?"
            
            # Handle questions about courses with highest grades
            elif 'highest' in question_lower and 'grade' in question_lower and 'course' in question_lower:
                if best_performing:
                    response = "Your courses with the highest grades are: "
                    best_courses = []
                    for c in best_performing[:3]:  # Show top 3 courses
                        best_courses.append(f"{c['course_code']} with an average grade of {c['average_grade']}%")
                    response += ", ".join(best_courses) + ". "
                    
                    # Add performance context
                    if best_performing[0]['average_grade'] >= 90:
                        response += "These are excellent results! "
                    elif best_performing[0]['average_grade'] >= 80:
                        response += "These are strong results. "
                    else:
                        response += "These courses are performing well. "
                else:
                    response = "I don't have enough data to determine your courses with the highest grades. "
            
            # Handle performance/grade questions
            elif 'performance' in question_lower or 'grade' in question_lower:
                response = f"Based on your performance data, your overall average grade is {instructor_avg_grade:.1f}%. "
                if instructor_avg_grade >= 90:
                    response += "This is excellent performance! "
                elif instructor_avg_grade >= 80:
                    response += "This is good performance. "
                elif instructor_avg_grade >= 70:
                    response += "This is acceptable performance, but there's room for improvement. "
                else:
                    response += "This indicates performance issues that need attention. "
                
                if best_performing:
                    best_courses = []
                    for c in best_performing[:2]:
                        best_courses.append(f"{c['course_code']} ({c['average_grade']}%)")
                    response += f"Your best performing courses include {', '.join(best_courses)}. "
                
                if worst_performing:
                    worst_courses = []
                    for c in worst_performing[:2]:
                        worst_courses.append(f"{c['course_code']} ({c['average_grade']}%)")
                    response += f"Courses that need attention include {', '.join(worst_courses)}. "
            
            # Handle specific risk-related questions
            elif 'which sections need attention' in question_lower:
                # Direct handling for this specific question
                response_parts = []
                response_parts.append(f"You currently have {at_risk_count} sections identified as at-risk (average grade < 70%).")
                
                if at_risk_count == 0:
                    response_parts.append("This is excellent - no at-risk sections were identified.")
                elif at_risk_count <= 2:
                    response_parts.append("This is a manageable number of at-risk sections.")
                else:
                    response_parts.append("This indicates several sections need attention.")
                
                # Provide specific information about at-risk courses
                if at_risk_count > 0 and worst_performing:
                    at_risk_courses = [c for c in worst_performing if c['average_grade'] < 70][:3]  # Increase to 3 courses
                    if at_risk_courses:
                        course_descriptions = []
                        for course in at_risk_courses:
                            course_descriptions.append(f"{course['course_code']} (avg. grade: {course['average_grade']}%)")
                        course_info = f"The courses with the lowest performance are: {', '.join(course_descriptions)}."
                        response_parts.append(course_info)
                
                # Add more specific information about sections
                if at_risk_count > 0:
                    response_parts.append(f"The specific sections that need attention are those with average grades below 70%. You should review the teaching materials and provide additional support to students in these sections.")
                
                # Add recommendations for at-risk courses
                if at_risk_count > 0:
                    response_parts.append("Consider reviewing the content and teaching methods for these courses, providing additional support to struggling students, and offering review sessions before major assessments.")
                
                response = " ".join(response_parts)
            elif 'risk' in question_lower or 'at-risk' in question_lower or 'danger' in question_lower:
                response_parts = []
                response_parts.append(f"You currently have {at_risk_count} sections identified as at-risk (average grade < 70%).")
                
                if at_risk_count == 0:
                    response_parts.append("This is excellent - no at-risk sections were identified.")
                elif at_risk_count <= 2:
                    response_parts.append("This is a manageable number of at-risk sections.")
                else:
                    response_parts.append("This indicates several sections need attention.")
                
                # Provide specific information about at-risk courses
                if at_risk_count > 0 and worst_performing:
                    at_risk_courses = [c for c in worst_performing if c['average_grade'] < 70][:3]  # Increase to 3 courses
                    if at_risk_courses:
                        course_descriptions = []
                        for course in at_risk_courses:
                            course_descriptions.append(f"{course['course_code']} (avg. grade: {course['average_grade']}%)")
                        course_info = f"The courses with the lowest performance are: {', '.join(course_descriptions)}."
                        response_parts.append(course_info)
                
                # Add more specific information about sections
                if at_risk_count > 0:
                    response_parts.append(f"The specific sections that need attention are those with average grades below 70%. You should review the teaching materials and provide additional support to students in these sections.")
                
                # Add recommendations for at-risk courses
                if at_risk_count > 0:
                    response_parts.append("Consider reviewing the content and teaching methods for these courses, providing additional support to struggling students, and offering review sessions before major assessments.")
                
                response = " ".join(response_parts)
            elif 'course' in question_lower or 'teach' in question_lower:
                # General course information (no specific course codes found)
                total_courses = len(course_performances)
                total_sections = len(sections_data)
                
                # More comprehensive calculation of unique courses
                unique_course_ids = set()
                for section in sections_data:
                    course_id = section.get('courseId')
                    if course_id and course_id != 'unknown':
                        unique_course_ids.add(course_id)
                
                # Use the more accurate count if it's different
                if len(unique_course_ids) > 0 and len(unique_course_ids) != total_courses:
                    total_courses = len(unique_course_ids)
                
                # Ensure we have a valid number for display
                try:
                    total_courses = int(total_courses)
                except (ValueError, TypeError):
                    total_courses = len(unique_course_ids)
                    
                # Additional safeguard to ensure we have a valid positive number
                if total_courses <= 0:
                    total_courses = len(unique_course_ids)
                    
                # Make sure we're displaying a valid number
                total_courses_display = max(1, total_courses) if isinstance(total_courses, int) else len(course_performances) or 1
                
                response = f"You are currently teaching {total_sections} sections across {total_courses_display} courses. "
                
                if total_courses_display > 0:
                    avg_sections_per_course = total_sections / total_courses_display
                    response += f"On average, you teach {avg_sections_per_course:.1f} sections per course. "
                
                # Add information about best and worst performing courses
                if best_performing:
                    best_courses = []
                    for c in best_performing[:2]:
                        best_courses.append(f"{c['course_code']} ({c['average_grade']}%)")
                    response += f"Your best performing courses include {', '.join(best_courses)}. "
                
                if worst_performing:
                    worst_courses = []
                    for c in worst_performing[:2]:
                        worst_courses.append(f"{c['course_code']} ({c['average_grade']}%)")
                    response += f"Courses that need attention include {', '.join(worst_courses)}. "
            else:
                # General response - changed to prompt for more specific questions
                logger.debug("Fell through to general response")
                response = "I cannot give a detailed response at the moment. Please specify your question related to course performance, student grades, at-risk courses, or teaching recommendations, and I'll be happy to help."
        
        # Ensure proper string formatting and return
        final_response = response.strip()
        # Make sure we're returning a clean string without encoding issues
        final_response = final_response.replace('\u2039', '<').replace('\u203a', '>')
        # Ensure the response isn't too long (safeguard against truncation issues)
        if len(final_response) > 1000:
            final_response = final_response[:997] + "..."
        return {"response": final_response}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat RAG response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing your question: {str(e)}")

# New data model for predictive analytics report
class PredictiveAnalyticsReportResponse(BaseModel):
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

@router.get("/predictive-analytics/report", response_model=PredictiveAnalyticsReportResponse)
async def get_instructor_predictive_analytics_report(
    current_user: dict = Depends(verify_token)
):
    """
    Get predictive analytics report for an instructor (excluding risk matrix data).
    
    This endpoint provides all predictive analytics data except the risk matrix for report generation.
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
        
        return PredictiveAnalyticsReportResponse(
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
        logger.error(f"Error getting instructor predictive analytics report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting instructor predictive analytics report: {str(e)}")

@router.get("/predictive-analytics/report/download/{format}")
async def download_instructor_predictive_analytics_report(
    format: str,
    current_user: dict = Depends(verify_token)
):
    """
    Download predictive analytics report in specified format (PDF or Excel).
    """
    try:
        # Check if user is an instructor
        if current_user.get('role') != 'instructor':
            raise HTTPException(status_code=403, detail="Access denied. User is not an instructor.")
        
        # Get report data
        report_data = await get_instructor_predictive_analytics_report(current_user)
        
        if format.lower() == "pdf":
            # Create PDF report
            from app.routes.firebase_dashboard import create_pdf_report
            pdf_buffer = create_pdf_report(report_data, "predictive-analytics")
            
            headers = {
                "Content-Disposition": "attachment; filename=predictive-analytics-report.pdf",
                "Content-Type": "application/pdf"
            }
            return Response(content=pdf_buffer.getvalue(), headers=headers)
            
        elif format.lower() in ["xlsx", "excel"]:
            # Create Excel report
            from app.routes.firebase_dashboard import create_excel_report
            excel_buffer = create_excel_report(report_data, "predictive-analytics")
            
            headers = {
                "Content-Disposition": "attachment; filename=predictive-analytics-report.xlsx",
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
            return Response(content=excel_buffer.getvalue(), headers=headers)
            
        else:
            raise HTTPException(status_code=400, detail="Invalid format. Supported formats: pdf, xlsx")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading predictive analytics report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error downloading predictive analytics report: {str(e)}")
