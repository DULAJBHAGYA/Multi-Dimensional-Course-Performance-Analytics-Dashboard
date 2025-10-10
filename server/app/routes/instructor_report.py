"""
Instructor Report Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from app.firebase_config import get_firestore_client
from typing import List, Dict, Any
import logging
from app.routes.firebase_auth_updated import verify_token

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/sections")
async def get_instructor_sections_report(current_user: dict = Depends(verify_token)):
    """Get all sections data for a specific instructor.
    
    This endpoint provides detailed information about all sections taught by an instructor
    including CRN, course details, semester, campus, average grade, and status.
    
    The endpoint:
    1. Queries all sections where instructorId matches the selected instructor
    2. Joins with courses collection to get course names
    3. Joins with campuses collection to get campus names
    4. Joins with semesters collection to get semester names
    5. Calculates status based on average grade
    6. Returns structured data for section analysis report
    """
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        instructor_id = current_user.get('instructorId') or current_user.get('id')
        if not instructor_id:
            raise HTTPException(status_code=400, detail="Instructor ID not found")
        
        # Get sections assigned to this instructor
        sections_query = db.collection('sections').where('instructorId', '==', instructor_id).stream()
        instructor_sections = [section.to_dict() for section in sections_query]
        
        # Process sections data
        sections_data = []
        
        for section in instructor_sections:
            course_id = section.get('courseId')
            course_code = section.get('courseCode', 'Unknown Course')
            campus_id = section.get('campusId')
            semester_id = section.get('semesterId')
            average_grade = section.get('averageGrade', 0)
            crn = section.get('crn', 'N/A')
            
            # Get course name
            course_name = 'Unknown Course'
            if course_id:
                course_doc = db.collection('courses').document(course_id).get()
                if course_doc.exists:
                    course_data = course_doc.to_dict()
                    if course_data:
                        course_name = course_data.get('courseName', course_code)
            
            # Get campus name
            campus_name = 'Unknown Campus'
            if campus_id:
                campus_doc = db.collection('campuses').document(campus_id).get()
                if campus_doc.exists:
                    campus_data = campus_doc.to_dict()
                    if campus_data:
                        campus_name = campus_data.get('campusName', campus_data.get('campus', 'Unknown Campus'))
            
            # Get semester information
            semester_name = 'Unknown Semester'
            semester_id_value = semester_id  # Store the semester ID
            if semester_id:
                semester_doc = db.collection('semesters').document(semester_id).get()
                if semester_doc.exists:
                    semester_data = semester_doc.to_dict()
                    if semester_data:
                        semester_name = semester_data.get('semesterName', 'Unknown Semester')
            
            # Determine status based on average grade
            if average_grade >= 90:
                status = 'Excellent'
            elif average_grade >= 70:
                status = 'Good'
            elif average_grade >= 40:
                status = 'Fair'
            else:
                status = 'Needs Improvement'
            
            sections_data.append({
                'crn': crn,
                'course_code': course_code,
                'course_name': course_name,
                'semester': semester_id_value,  # Use semester ID instead of name
                'campus': campus_name,
                'avg_grade': round(average_grade, 2),
                'status': status
            })
        
        return {
            "sections": sections_data,
            "generatedAt": __import__('datetime').datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching instructor sections report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching instructor sections report: {str(e)}")