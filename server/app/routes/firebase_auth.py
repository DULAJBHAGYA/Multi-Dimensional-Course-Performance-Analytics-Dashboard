"""
Firebase-based authentication routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.firebase_service import firebase_service
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
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user from Firebase
        user = await firebase_service.get_user(user_id)
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
    """Login with Firebase authentication"""
    try:
        # For development, we'll create users if they don't exist
        # In production, implement proper Firebase Auth integration
        
        # Check if user exists in Firebase
        user = await firebase_service.get_user_by_email(login_data.email)
        
        if not user:
            # Create a new user for development
            user_data = {
                "name": login_data.email.split('@')[0].title(),
                "email": login_data.email,
                "role": "admin" if "admin" in login_data.email.lower() else "instructor",
                "status": "active",
                "department": "Computer Science",
                "password_hash": "hashed_password_here",  # In production, hash the password
                "created_at": datetime.utcnow().isoformat(),
                "last_login": datetime.utcnow().isoformat()
            }
            
            user_id = await firebase_service.create_user(user_data)
            user_data["id"] = user_id
            user = user_data
        else:
            # Update last login
            await firebase_service.update_user(user["id"], {
                "last_login": datetime.utcnow().isoformat()
            })
        
        # Create access token
        access_token = create_access_token(data={"sub": user["id"]})
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "status": user["status"],
                "department": user["department"]
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
        department=current_user["department"]
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
        users = await firebase_service.get_all_users()
        return [
            UserInfo(
                id=user["id"],
                name=user["name"],
                email=user["email"],
                role=user["role"],
                status=user["status"],
                department=user["department"]
            ) for user in users
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get users: {str(e)}"
        )
