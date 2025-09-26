"""
Updated Firebase-based authentication routes that work with Firestore collections
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.firebase_config import get_firestore_client
from pydantic import BaseModel
from typing import Optional
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
security = HTTPBearer()

# Pydantic models for request/response
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserInfo(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str
    department: str
    campus: Optional[str] = None

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        user_type: str = payload.get("user_type", "instructor")  # instructor, admin, or student
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user from Firestore based on type
        db = get_firestore_client()
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        user = None
        if user_type == "instructor":
            instructor_doc = db.collection('instructors').document(user_id).get()
            if instructor_doc.exists:
                instructor_data = instructor_doc.to_dict()
                user = {
                    "id": user_id,
                    "instructorId": user_id,
                    "name": instructor_data.get('display_name', instructor_data.get('username', 'Unknown')),
                    "email": instructor_data.get('email', ''),
                    "role": "instructor",
                    "status": "active",
                    "department": instructor_data.get('department', ''),
                    "campus": instructor_data.get('campus', ''),
                    "username": instructor_data.get('username', ''),
                    "students": instructor_data.get('students', 0)
                }
        elif user_type == "admin":
            admin_doc = db.collection('admins').document(user_id).get()
            if admin_doc.exists:
                admin_data = admin_doc.to_dict()
                user = {
                    "id": user_id,
                    "adminId": user_id,
                    "name": admin_data.get('display_name', admin_data.get('username', 'Unknown')),
                    "email": admin_data.get('email', ''),
                    "role": "admin",
                    "status": "active",
                    "department": admin_data.get('department', ''),
                    "campus": admin_data.get('campus', ''),
                    "username": admin_data.get('username', ''),
                    "students": admin_data.get('students', 0)
                }
        elif user_type == "student":
            student_doc = db.collection('students').document(user_id).get()
            if student_doc.exists:
                student_data = student_doc.to_dict()
                user = {
                    "id": user_id,
                    "studentId": user_id,
                    "name": student_data.get('studentName', 'Unknown'),
                    "email": f"{user_id}@hct.ac.ae",
                    "role": "student",
                    "status": "active",
                    "department": "",
                    "campus": ""
                }
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """Login with Firestore authentication"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        # Search for user in instructors collection
        instructors_query = db.collection('instructors').where('email', '==', login_data.email).stream()
        instructor = None
        for doc in instructors_query:
            instructor_data = doc.to_dict()
            if instructor_data.get('password') == login_data.password:
                instructor = {
                    "id": doc.id,
                    "instructorId": doc.id,
                    "name": instructor_data.get('display_name', instructor_data.get('username', 'Unknown')),
                    "email": instructor_data.get('email', ''),
                    "role": "instructor",
                    "status": "active",
                    "department": instructor_data.get('department', ''),
                    "campus": instructor_data.get('campus', ''),
                    "username": instructor_data.get('username', ''),
                    "students": instructor_data.get('students', 0)
                }
                break
        
        # If not found in instructors, search in admins collection
        if not instructor:
            admins_query = db.collection('admins').where('email', '==', login_data.email).stream()
            for doc in admins_query:
                admin_data = doc.to_dict()
                if admin_data.get('password') == login_data.password:
                    instructor = {
                        "id": doc.id,
                        "adminId": doc.id,
                        "name": admin_data.get('display_name', admin_data.get('username', 'Unknown')),
                        "email": admin_data.get('email', ''),
                        "role": "admin",
                        "status": "active",
                        "department": admin_data.get('department', ''),
                        "campus": admin_data.get('campus', ''),
                        "username": admin_data.get('username', ''),
                        "students": admin_data.get('students', 0)
                    }
                    break
        
        # If not found in admins, search in students collection
        if not instructor:
            students_query = db.collection('students').where('studentId', '==', login_data.email.split('@')[0]).stream()
            for doc in students_query:
                student_data = doc.to_dict()
                instructor = {
                    "id": doc.id,
                    "studentId": doc.id,
                    "name": student_data.get('studentName', 'Unknown'),
                    "email": login_data.email,
                    "role": "student",
                    "status": "active",
                    "department": "",
                    "campus": ""
                }
                break
        
        if not instructor:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token
        access_token = create_access_token(data={
            "sub": instructor["id"],
            "user_type": instructor["role"]
        })
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": instructor["id"],
                "name": instructor["name"],
                "email": instructor["email"],
                "role": instructor["role"],
                "status": instructor["status"],
                "department": instructor["department"],
                "campus": instructor.get("campus", ""),
                "username": instructor.get("username", ""),
                "students": instructor.get("students", 0)
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/me", response_model=UserInfo)
async def get_current_user(current_user: dict = Depends(verify_token)):
    """Get current user information"""
    return UserInfo(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user["role"],
        status=current_user["status"],
        department=current_user["department"],
        campus=current_user.get("campus", "")
    )

@router.post("/logout")
async def logout():
    """Logout user"""
    # In a real application, you might want to blacklist the token
    return {"message": "Successfully logged out"}

@router.get("/users", response_model=list[UserInfo])
async def get_all_users(current_user: dict = Depends(verify_token)):
    """Get all users (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        users = []
        
        # Get all instructors
        instructors_query = db.collection('instructors').stream()
        for doc in instructors_query:
            instructor_data = doc.to_dict()
            users.append(UserInfo(
                id=doc.id,
                name=instructor_data.get('display_name', instructor_data.get('username', 'Unknown')),
                email=instructor_data.get('email', ''),
                role="instructor",
                status="active",
                department=instructor_data.get('department', ''),
                campus=instructor_data.get('campus', '')
            ))
        
        # Get all admins
        admins_query = db.collection('admins').stream()
        for doc in admins_query:
            admin_data = doc.to_dict()
            users.append(UserInfo(
                id=doc.id,
                name=admin_data.get('display_name', admin_data.get('username', 'Unknown')),
                email=admin_data.get('email', ''),
                role="admin",
                status="active",
                department=admin_data.get('department', ''),
                campus=admin_data.get('campus', '')
            ))
        
        return users
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get users: {str(e)}"
        )

@router.get("/test-login")
async def test_login():
    """Test endpoint to get sample login credentials"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        # Get sample instructor
        instructors_query = db.collection('instructors').limit(1).stream()
        sample_instructor = None
        for doc in instructors_query:
            instructor_data = doc.to_dict()
            sample_instructor = {
                "email": instructor_data.get('email', ''),
                "password": instructor_data.get('password', ''),
                "name": instructor_data.get('display_name', instructor_data.get('username', 'Unknown')),
                "role": "instructor"
            }
            break
        
        # Get sample admin
        admins_query = db.collection('admins').limit(1).stream()
        sample_admin = None
        for doc in admins_query:
            admin_data = doc.to_dict()
            sample_admin = {
                "email": admin_data.get('email', ''),
                "password": admin_data.get('password', ''),
                "name": admin_data.get('display_name', admin_data.get('username', 'Unknown')),
                "role": "admin"
            }
            break
        
        return {
            "message": "Sample login credentials from Firestore",
            "sample_instructor": sample_instructor,
            "sample_admin": sample_admin
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sample credentials: {str(e)}"
        )
