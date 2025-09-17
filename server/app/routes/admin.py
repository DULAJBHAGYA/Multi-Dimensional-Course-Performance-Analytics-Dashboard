from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole, UserStatus
from app.models.course import Course, CourseAssignment
from app.routes.auth import verify_token
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

router = APIRouter()

class UserCreateRequest(BaseModel):
    name: str
    email: str
    role: str
    department: str = "Computer Science"

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    role: str
    status: str
    department: str
    courses: int
    students: int
    last_login: Optional[datetime]
    created_at: datetime

class PlatformMetricsResponse(BaseModel):
    total_instructors: int
    total_courses: int
    total_students: int
    overall_completion_rate: float
    dropout_rate: float
    active_users: int
    inactive_users: int
    daily_logins: int
    weekly_logins: int

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    search: Optional[str] = Query(None),
    role_filter: str = Query("all"),
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
    
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.name.contains(search)) | 
            (User.email.contains(search))
        )
    
    if role_filter != "all":
        query = query.filter(User.role == UserRole(role_filter))
    
    users = query.all()
    
    # Calculate courses and students for each user
    user_responses = []
    for user in users:
        # Count courses assigned to this user
        course_count = db.query(CourseAssignment).filter(CourseAssignment.user_id == user.id).count()
        
        # Count total students across all courses assigned to this user
        student_count = 0
        if course_count > 0:
            course_ids = [ca.course_id for ca in db.query(CourseAssignment).filter(CourseAssignment.user_id == user.id).all()]
            student_count = db.query(Course).filter(Course.id.in_(course_ids)).with_entities(Course.total_enrollments).all()
            student_count = sum([s[0] for s in student_count]) if student_count else 0
        
        user_responses.append(UserResponse(
            id=user.id,
            user_id=user.user_id,
            name=user.name,
            email=user.email,
            role=user.role.value,
            status=user.status.value,
            department=user.department,
            courses=course_count,
            students=student_count,
            last_login=user.last_login,
            created_at=user.created_at
        ))
    
    return user_responses

@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreateRequest,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Create new user
    new_user = User(
        user_id=db.query(User).count() + 1,  # Simple auto-increment
        name=user_data.name,
        email=user_data.email,
        role=UserRole(user_data.role),
        department=user_data.department,
        status=UserStatus.ACTIVE
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        user_id=new_user.user_id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role.value,
        status=new_user.status.value,
        department=new_user.department,
        courses=0,
        students=0,
        last_login=new_user.last_login,
        created_at=new_user.created_at
    )

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdateRequest,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields
    if user_data.name is not None:
        user.name = user_data.name
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.role is not None:
        user.role = UserRole(user_data.role)
    if user_data.department is not None:
        user.department = user_data.department
    if user_data.status is not None:
        user.status = UserStatus(user_data.status)
    
    db.commit()
    db.refresh(user)
    
    # Calculate courses and students
    course_count = db.query(CourseAssignment).filter(CourseAssignment.user_id == user.id).count()
    student_count = 0
    if course_count > 0:
        course_ids = [ca.course_id for ca in db.query(CourseAssignment).filter(CourseAssignment.user_id == user.id).all()]
        student_count = db.query(Course).filter(Course.id.in_(course_ids)).with_entities(Course.total_enrollments).all()
        student_count = sum([s[0] for s in student_count]) if student_count else 0
    
    return UserResponse(
        id=user.id,
        user_id=user.user_id,
        name=user.name,
        email=user.email,
        role=user.role.value,
        status=user.status.value,
        department=user.department,
        courses=course_count,
        students=student_count,
        last_login=user.last_login,
        created_at=user.created_at
    )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow deleting the current user
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.get("/metrics", response_model=PlatformMetricsResponse)
async def get_platform_metrics(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
    
    # Get all users and courses
    all_users = db.query(User).all()
    all_courses = db.query(Course).all()
    
    # Calculate metrics
    total_instructors = len([user for user in all_users if user.role == UserRole.INSTRUCTOR])
    total_courses = len(all_courses)
    total_students = sum(course.total_enrollments for course in all_courses)
    overall_completion_rate = sum(course.completion_rate for course in all_courses) / len(all_courses) if all_courses else 0
    dropout_rate = 100 - overall_completion_rate
    active_users = len([user for user in all_users if user.status == UserStatus.ACTIVE])
    inactive_users = len([user for user in all_users if user.status == UserStatus.INACTIVE])
    
    # Mock data for login statistics
    daily_logins = 234
    weekly_logins = 1647
    
    return PlatformMetricsResponse(
        total_instructors=total_instructors,
        total_courses=total_courses,
        total_students=total_students,
        overall_completion_rate=round(overall_completion_rate, 1),
        dropout_rate=round(dropout_rate, 1),
        active_users=active_users,
        inactive_users=inactive_users,
        daily_logins=daily_logins,
        weekly_logins=weekly_logins
    )

@router.get("/courses", response_model=List[Dict[str, Any]])
async def get_all_courses(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
    
    courses = db.query(Course).all()
    
    return [
        {
            "id": course.id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "course_credits": course.course_credits,
            "crn_code": course.crn_code,
            "semester_name": course.semester_name,
            "campus_name": course.campus_name,
            "total_enrollments": course.total_enrollments,
            "active_students": course.active_students,
            "completion_rate": course.completion_rate,
            "average_rating": course.average_rating,
            "revenue": course.revenue,
            "created_at": course.created_at.isoformat()
        } for course in courses
    ]

@router.post("/courses/{course_id}/assign/{user_id}")
async def assign_course_to_user(
    course_id: int,
    user_id: int,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
    
    # Check if course and user exist
    course = db.query(Course).filter(Course.id == course_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if assignment already exists
    existing_assignment = db.query(CourseAssignment).filter(
        CourseAssignment.course_id == course_id,
        CourseAssignment.user_id == user_id
    ).first()
    
    if existing_assignment:
        raise HTTPException(status_code=400, detail="Course already assigned to this user")
    
    # Create assignment
    assignment = CourseAssignment(
        course_id=course_id,
        user_id=user_id
    )
    
    db.add(assignment)
    db.commit()
    
    return {"message": f"Course {course.course_name} assigned to {user.name} successfully"}
