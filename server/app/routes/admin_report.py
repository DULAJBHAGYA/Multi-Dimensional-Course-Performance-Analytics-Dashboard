"""
Admin Report API Routes
This module provides API endpoints for generating and managing admin reports.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime, timedelta
import io
import tempfile
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import pandas as pd

from app.firebase_config import get_firestore_client
from app.routes.firebase_auth_updated import get_current_user, UserInfo

# Initialize router
router = APIRouter(prefix="/admin/report", tags=["admin-reports"])

# Configure logging
logger = logging.getLogger(__name__)

def create_pdf_report(report_data: Dict[str, Any], report_type: str) -> io.BytesIO:
    """Create a PDF report from data"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = styles['Title']
    
    # Add title
    elements.append(Paragraph(f"{report_type.replace('-', ' ').title()} Report", title_style))
    elements.append(Spacer(1, 12))
    
    # Add generation date
    elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # Add summary data if available
    if 'data' in report_data and isinstance(report_data['data'], list):
        data = report_data['data']
        if data:
            # Create table headers
            headers = list(data[0].keys())
            table_data = [headers]
            
            # Add data rows
            for item in data:
                row = [str(item.get(header, '')) for header in headers]
                table_data.append(row)
            
            # Create table
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
            
            elements.append(table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

def create_excel_report(report_data: Dict[str, Any], report_type: str) -> io.BytesIO:
    """Create an Excel report from data"""
    # Create a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
    temp_file.close()
    
    try:
        # Create Excel writer with temporary file path
        writer = pd.ExcelWriter(temp_file.name, engine='openpyxl')
        
        # Add data sheet
        if 'data' in report_data and isinstance(report_data['data'], list):
            data = report_data['data']
            if data:
                df = pd.DataFrame(data)
                sheet_name = report_type.replace('_', ' ').title()[:31]
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

@router.get("/user-analytics")
async def get_user_analytics(
    current_user: UserInfo = Depends(get_current_user),
    time_range: str = Query("30d", description="Time range for analytics (7d, 30d, 90d, 1y)")
):
    """
    Get user analytics data for admin reports.
    
    Args:
        current_user: Authenticated user
        time_range: Time range for the analytics data
        
    Returns:
        Dict containing user analytics data
    """
    try:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
        
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Calculate date range
        end_date = datetime.now()
        if time_range == "7d":
            start_date = end_date - timedelta(days=7)
        elif time_range == "30d":
            start_date = end_date - timedelta(days=30)
        elif time_range == "90d":
            start_date = end_date - timedelta(days=90)
        elif time_range == "1y":
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)  # Default to 30 days
        
        # Get all users from different collections
        instructors_query = db.collection('instructors').stream()
        students_query = db.collection('students').stream()
        admins_query = db.collection('admins').stream()
        
        # Count users by role
        instructors = [doc.to_dict() for doc in instructors_query]
        students = [doc.to_dict() for doc in students_query]
        admins = [doc.to_dict() for doc in admins_query]
        
        # Calculate user analytics
        total_instructors = len(instructors)
        total_students = len(students)
        total_admins = len(admins)
        total_users = total_instructors + total_students + total_admins
        
        # Calculate percentages
        instructor_percentage = round((total_instructors / total_users) * 100, 1) if total_users > 0 else 0
        student_percentage = round((total_students / total_users) * 100, 1) if total_users > 0 else 0
        admin_percentage = round((total_admins / total_users) * 100, 1) if total_users > 0 else 0
        
        # Calculate growth (mock data for now)
        instructor_growth = "+12%"
        student_growth = "+8%"
        admin_growth = "+2%"
        
        # Prepare user analytics data
        user_data = [
            {
                "category": "Students",
                "count": total_students,
                "percentage": student_percentage,
                "growth": student_growth
            },
            {
                "category": "Instructors",
                "count": total_instructors,
                "percentage": instructor_percentage,
                "growth": instructor_growth
            },
            {
                "category": "Admins",
                "count": total_admins,
                "percentage": admin_percentage,
                "growth": admin_growth
            }
        ]
        
        return {
            "status": "success",
            "data": user_data,
            "time_range": time_range,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching user analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user analytics: {str(e)}")

@router.get("/course-analytics")
async def get_course_analytics(
    current_user: UserInfo = Depends(get_current_user),
    time_range: str = Query("30d", description="Time range for analytics (7d, 30d, 90d, 1y)")
):
    """
    Get course analytics data for admin reports.
    
    Args:
        current_user: Authenticated user
        time_range: Time range for the analytics data
        
    Returns:
        Dict containing course analytics data
    """
    try:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
        
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Calculate date range
        end_date = datetime.now()
        if time_range == "7d":
            start_date = end_date - timedelta(days=7)
        elif time_range == "30d":
            start_date = end_date - timedelta(days=30)
        elif time_range == "90d":
            start_date = end_date - timedelta(days=90)
        elif time_range == "1y":
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)  # Default to 30 days
        
        # Get all courses
        courses_query = db.collection('courses').stream()
        courses = [doc.to_dict() for doc in courses_query]
        
        # Group courses by subject/department
        subject_data = {}
        for course in courses:
            subject = course.get('department', 'Unknown')
            if subject not in subject_data:
                subject_data[subject] = {
                    "subject": subject,
                    "courses": 0,
                    "students": 0,
                    "completion": 0
                }
            subject_data[subject]["courses"] += 1
            subject_data[subject]["students"] += course.get('students', 0)
            subject_data[subject]["completion"] += course.get('completion_rate', 0)
        
        # Calculate average completion rate per subject
        for subject in subject_data:
            course_count = subject_data[subject]["courses"]
            if course_count > 0:
                subject_data[subject]["completion"] = round(subject_data[subject]["completion"] / course_count, 1)
        
        # Convert to list
        course_data = list(subject_data.values())
        
        return {
            "status": "success",
            "data": course_data,
            "time_range": time_range,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching course analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch course analytics: {str(e)}")

@router.get("/instructor-performance")
async def get_instructor_performance(
    current_user: UserInfo = Depends(get_current_user),
    time_range: str = Query("30d", description="Time range for analytics (7d, 30d, 90d, 1y)")
):
    """
    Get instructor performance data for admin reports.
    
    Args:
        current_user: Authenticated user
        time_range: Time range for the analytics data
        
    Returns:
        Dict containing instructor performance data
    """
    try:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
        
        db = get_firestore_client()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Calculate date range
        end_date = datetime.now()
        if time_range == "7d":
            start_date = end_date - timedelta(days=7)
        elif time_range == "30d":
            start_date = end_date - timedelta(days=30)
        elif time_range == "90d":
            start_date = end_date - timedelta(days=90)
        elif time_range == "1y":
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)  # Default to 30 days
        
        # Get all instructors
        instructors_query = db.collection('instructors').stream()
        instructors = []
        for doc in instructors_query:
            instructor_data = doc.to_dict() or {}
            instructor_data['id'] = doc.id
            instructors.append(instructor_data)
        
        # Prepare instructor performance data
        instructor_data = []
        for instructor in instructors:
            # Mock rating data - in a real implementation, this would come from actual performance metrics
            rating = round(4.0 + (len(instructor.get('courses', [])) * 0.1), 1)
            rating = min(rating, 5.0)  # Cap at 5.0
            
            status = "Excellent" if rating >= 4.5 else "Good" if rating >= 4.0 else "Normal"
            
            instructor_data.append({
                "name": instructor.get('display_name', instructor.get('username', 'Unknown Instructor')),
                "courses": len(instructor.get('courses', [])),
                "students": instructor.get('students', 0),
                "rating": rating,
                "status": status
            })
        
        return {
            "status": "success",
            "data": instructor_data,
            "time_range": time_range,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching instructor performance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch instructor performance: {str(e)}")

@router.get("/download-report")
async def download_admin_report(
    report_type: str = Query(..., description="Type of report to generate (user-analytics, course-analytics, instructor-performance)"),
    time_range: str = Query("30d", description="Time range for the report (7d, 30d, 90d, 1y)"),
    format: str = Query("pdf", description="Format of the report (pdf, csv)"),
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Download an admin report in PDF or CSV format.
    
    Args:
        report_type: Type of report to generate
        time_range: Time range for the report
        format: Format of the report (pdf, csv)
        current_user: Authenticated user
        
    Returns:
        File download response
    """
    try:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
        
        # Validate report type
        valid_report_types = ["user-analytics", "course-analytics", "instructor-performance"]
        if report_type not in valid_report_types:
            raise HTTPException(status_code=400, detail=f"Invalid report type. Valid types: {valid_report_types}")
        
        # Validate format
        valid_formats = ["pdf", "csv"]
        if format not in valid_formats:
            raise HTTPException(status_code=400, detail=f"Invalid format. Valid formats: {valid_formats}")
        
        # Get report data
        report_data = {}
        report_title = ""
        if report_type == "user-analytics":
            response = await get_user_analytics(current_user, time_range)
            report_data = response
            report_title = "user-analytics"
        elif report_type == "course-analytics":
            response = await get_course_analytics(current_user, time_range)
            report_data = response
            report_title = "course-analytics"
        elif report_type == "instructor-performance":
            response = await get_instructor_performance(current_user, time_range)
            report_data = response
            report_title = "instructor-performance"
        
        # Generate report based on format
        if format == "pdf":
            pdf_buffer = create_pdf_report(report_data, report_title)
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={report_type.replace('-', '_')}_report.pdf"}
            )
        
        elif format == "csv":
            excel_buffer = create_excel_report(report_data, report_title)
            return StreamingResponse(
                excel_buffer,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={report_type.replace('-', '_')}_report.xlsx"}
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating admin report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate admin report: {str(e)}")

@router.get("/generate-report")
async def generate_admin_report(
    report_type: str = Query(..., description="Type of report to generate (user-analytics, course-analytics, instructor-performance)"),
    time_range: str = Query("30d", description="Time range for the report (7d, 30d, 90d, 1y)"),
    format: str = Query("json", description="Format of the report (json, pdf, csv)"),
    current_user: UserInfo = Depends(get_current_user)
):
    """
    Generate a comprehensive admin report.
    
    Args:
        report_type: Type of report to generate
        time_range: Time range for the report
        format: Format of the report
        current_user: Authenticated user
        
    Returns:
        Dict containing the generated report or file download
    """
    try:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
        
        # Validate report type
        valid_report_types = ["user-analytics", "course-analytics", "instructor-performance"]
        if report_type not in valid_report_types:
            raise HTTPException(status_code=400, detail=f"Invalid report type. Valid types: {valid_report_types}")
        
        # Validate format
        valid_formats = ["json", "pdf", "csv"]
        if format not in valid_formats:
            raise HTTPException(status_code=400, detail=f"Invalid format. Valid formats: {valid_formats}")
        
        # If format is PDF or CSV, redirect to download endpoint
        if format in ["pdf", "csv"]:
            return await download_admin_report(report_type, time_range, format, current_user)
        
        # Generate report based on type
        report_data = {}
        
        if report_type == "user-analytics":
            response = await get_user_analytics(current_user, time_range)
            report_data = response
        elif report_type == "course-analytics":
            response = await get_course_analytics(current_user, time_range)
            report_data = response
        elif report_type == "instructor-performance":
            response = await get_instructor_performance(current_user, time_range)
            report_data = response
        
        return {
            "status": "success",
            "report_type": report_type,
            "format": format,
            "data": report_data,
            "generated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating admin report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate admin report: {str(e)}")