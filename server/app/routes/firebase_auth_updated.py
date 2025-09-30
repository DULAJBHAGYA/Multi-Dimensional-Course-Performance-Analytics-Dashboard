"""
Updated Firebase-based authentication routes that work with Firestore collections
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.firebase_config import get_firestore_client, test_firestore_connection
from pydantic import BaseModel
from typing import Optional
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

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

# New Pydantic model for creating users
class CreateUserRequest(BaseModel):
    name: str
    email: str
    role: str  # "admin" or "instructor"
    password: str
    department: str
    campus: str
    username: Optional[str] = None

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
                instructor_data = instructor_doc.to_dict() or {}
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
                admin_data = admin_doc.to_dict() or {}
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
                student_data = student_doc.to_dict() or {}
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
    """Login with Firestore authentication - checks both instructors and admins collections"""
    try:
        logger.info(f"Login attempt for email: {login_data.email}")
        
        db = get_firestore_client()
        if not db:
            logger.error("Database connection failed during login")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed. Please check server configuration."
            )
        
        logger.info("Database connection successful")
        
        # Search for user in instructors collection first
        instructors_query = db.collection('instructors').where('email', '==', login_data.email).stream()
        user = None
        for doc in instructors_query:
            instructor_data = doc.to_dict() or {}
            if instructor_data.get('password') == login_data.password:
                user = {
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
        if not user:
            admins_query = db.collection('admins').where('email', '==', login_data.email).stream()
            for doc in admins_query:
                admin_data = doc.to_dict() or {}
                if admin_data.get('password') == login_data.password:
                    user = {
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
        if not user:
            # For students, we assume the email format is studentId@domain
            student_id = login_data.email.split('@')[0]
            students_query = db.collection('students').where('studentId', '==', student_id).stream()
            for doc in students_query:
                student_data = doc.to_dict() or {}
                user = {
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
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token with user type
        access_token = create_access_token(data={
            "sub": user["id"],
            "user_type": user["role"]  # This will be "instructor", "admin", or "student"
        })
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "status": user["status"],
                "department": user["department"],
                "campus": user.get("campus", ""),
                "username": user.get("username", ""),
                "students": user.get("students", 0)
            }
        )
        
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
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

@router.get("/test-connection")
async def test_firebase_connection():
    """Test Firebase/Firestore connection"""
    try:
        # Test the connection
        success, message = test_firestore_connection()
        
        if success:
            return {
                "status": "success",
                "message": message,
                "firebase_initialized": True,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "status": "error",
                "message": message,
                "firebase_initialized": False,
                "timestamp": datetime.utcnow().isoformat()
            }
        
    except Exception as e:
        logger.error(f"Connection test failed: {e}")
        return {
            "status": "error",
            "message": f"Connection test failed: {str(e)}",
            "firebase_initialized": False,
            "timestamp": datetime.utcnow().isoformat()
        }

def get_next_id(db, collection_name, prefix):
    """Generate the next sequential ID for a collection"""
    try:
        # Get all documents in the collection
        docs = db.collection(collection_name).stream()
        max_id = 0
        
        for doc in docs:
            doc_id = doc.id
            if doc_id.startswith(prefix):
                # Extract the numeric part
                try:
                    num_part = int(doc_id.replace(prefix, '').lstrip('_'))
                    max_id = max(max_id, num_part)
                except ValueError:
                    # If we can't parse the numeric part, skip this document
                    continue
        
        # Return the next ID
        next_id = max_id + 1
        return f"{prefix}_{next_id:03d}"
    except Exception as e:
        logger.error(f"Error generating next ID for {collection_name}: {e}")
        # Fallback to a default ID if there's an error
        return f"{prefix}_001"

@router.post("/users", response_model=UserInfo)
async def create_user(create_user_data: CreateUserRequest, current_user: dict = Depends(verify_token)):
    """Create a new user (admin or instructor) with auto-generated ID"""
    # Only admins can create users
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
        
        # Generate the appropriate ID based on role
        if create_user_data.role == "admin":
            user_id = get_next_id(db, "admins", "admin")
            collection_name = "admins"
            user_data = {
                "adminId": user_id,
                "name": create_user_data.name,
                "email": create_user_data.email,
                "password": create_user_data.password,
                "department": create_user_data.department,
                "campus": create_user_data.campus,
                "username": create_user_data.username or create_user_data.email.split('@')[0],
                "display_name": create_user_data.name
            }
        elif create_user_data.role == "instructor":
            user_id = get_next_id(db, "instructors", "instructor")
            collection_name = "instructors"
            user_data = {
                "instructorId": user_id,
                "name": create_user_data.name,
                "email": create_user_data.email,
                "password": create_user_data.password,
                "department": create_user_data.department,
                "campus": create_user_data.campus,
                "username": create_user_data.username or create_user_data.email.split('@')[0],
                "display_name": create_user_data.name,
                "students": 0  # Default value for instructors
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be 'admin' or 'instructor'"
            )
        
        # Add the user to the appropriate collection
        db.collection(collection_name).document(user_id).set(user_data)
        
        # Return the created user info
        return UserInfo(
            id=user_id,
            name=create_user_data.name,
            email=create_user_data.email,
            role=create_user_data.role,
            status="active",
            department=create_user_data.department,
            campus=create_user_data.campus
        )
        
    except Exception as e:
        logger.error(f"Failed to create user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.get("/campuses")
async def get_campuses(current_user: dict = Depends(verify_token)):
    """Get all unique campuses from admins and instructors collections"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        campuses = set()
        
        # Get campuses from instructors
        instructors_query = db.collection('instructors').stream()
        for doc in instructors_query:
            instructor_data = doc.to_dict()
            campus = instructor_data.get('campus')
            if campus:
                campuses.add(campus)
        
        # Get campuses from admins
        admins_query = db.collection('admins').stream()
        for doc in admins_query:
            admin_data = doc.to_dict()
            campus = admin_data.get('campus')
            if campus:
                campuses.add(campus)
        
        return sorted(list(campuses))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get campuses: {str(e)}"
        )

@router.get("/departments")
async def get_departments(current_user: dict = Depends(verify_token)):
    """Get all unique departments from admins and instructors collections"""
    try:
        db = get_firestore_client()
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        departments = set()
        
        # Get departments from instructors
        instructors_query = db.collection('instructors').stream()
        for doc in instructors_query:
            instructor_data = doc.to_dict()
            department = instructor_data.get('department')
            if department:
                departments.add(department)
        
        # Get departments from admins
        admins_query = db.collection('admins').stream()
        for doc in admins_query:
            admin_data = doc.to_dict()
            department = admin_data.get('department')
            if department:
                departments.add(department)
        
        return sorted(list(departments))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get departments: {str(e)}"
        )

# New Pydantic model for updating users
class UpdateUserRequest(BaseModel):
    name: str
    email: str
    role: str  # "admin" or "instructor"
    department: str
    campus: str

@router.put("/users/{user_id}", response_model=UserInfo)
async def update_user(user_id: str, update_user_data: UpdateUserRequest, current_user: dict = Depends(verify_token)):
    """Update an existing user (admin or instructor)"""
    # Only admins can update users
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
        
        # Determine which collection to update based on role
        if update_user_data.role == "admin":
            collection_name = "admins"
            user_data = {
                "name": update_user_data.name,
                "email": update_user_data.email,
                "department": update_user_data.department,
                "campus": update_user_data.campus,
                "display_name": update_user_data.name
            }
        elif update_user_data.role == "instructor":
            collection_name = "instructors"
            user_data = {
                "name": update_user_data.name,
                "email": update_user_data.email,
                "department": update_user_data.department,
                "campus": update_user_data.campus,
                "display_name": update_user_data.name
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be 'admin' or 'instructor'"
            )
        
        # Update the user in the appropriate collection
        user_ref = db.collection(collection_name).document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_ref.update(user_data)
        
        # Return the updated user info
        return UserInfo(
            id=user_id,
            name=update_user_data.name,
            email=update_user_data.email,
            role=update_user_data.role,
            status="active",
            department=update_user_data.department,
            campus=update_user_data.campus
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Failed to update user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(verify_token)):
    """Delete a user (admin or instructor)"""
    # Only admins can delete users
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
        
        # Try to delete from admins collection first
        admin_ref = db.collection('admins').document(user_id)
        admin_doc = admin_ref.get()
        
        if admin_doc.exists:
            admin_ref.delete()
            return {"message": "Admin user deleted successfully"}
        
        # If not found in admins, try instructors collection
        instructor_ref = db.collection('instructors').document(user_id)
        instructor_doc = instructor_ref.get()
        
        if instructor_doc.exists:
            instructor_ref.delete()
            return {"message": "Instructor user deleted successfully"}
        
        # If not found in either collection
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Failed to delete user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )
