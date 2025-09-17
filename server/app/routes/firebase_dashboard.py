"""
Firebase-based dashboard routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.services.firebase_service import firebase_service
from app.routes.firebase_auth import verify_token
from pydantic import BaseModel
from typing import Dict, Any, List

router = APIRouter()

class DashboardMetrics(BaseModel):
    total_students: int
    total_courses: int
    total_instructors: int
    overall_pass_rate: float
    at_risk_students: int
    analytics_data: List[Dict[str, Any]]

@router.get("/instructor")
async def get_instructor_dashboard(current_user: dict = Depends(verify_token)):
    """Get instructor dashboard data"""
    if current_user["role"] not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access instructor dashboard"
        )
    
    try:
        metrics = await firebase_service.get_dashboard_metrics(
            current_user["id"], 
            current_user["role"]
        )
        return {
            "message": f"Welcome to instructor dashboard, {current_user['name']}!",
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get instructor dashboard: {str(e)}"
        )

@router.get("/admin")
async def get_admin_dashboard(current_user: dict = Depends(verify_token)):
    """Get admin dashboard data"""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access admin dashboard"
        )
    
    try:
        metrics = await firebase_service.get_dashboard_metrics(
            current_user["id"], 
            current_user["role"]
        )
        return {
            "message": f"Welcome to admin dashboard, {current_user['name']}!",
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get admin dashboard: {str(e)}"
        )

@router.get("/metrics")
async def get_dashboard_metrics(current_user: dict = Depends(verify_token)):
    """Get dashboard metrics for current user"""
    try:
        metrics = await firebase_service.get_dashboard_metrics(
            current_user["id"], 
            current_user["role"]
        )
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard metrics: {str(e)}"
        )
