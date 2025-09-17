from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole, UserStatus
from app.services.auth_service import AuthService
from pydantic import BaseModel
from typing import Optional
import jwt
from datetime import datetime, timedelta

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
    id: int
    user_id: int
    name: str
    email: str
    role: str
    status: str
    department: str

# JWT Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = db.query(User).filter(User.id == user_id).first()
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
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    # For development, accept any email/password combination
    # In production, implement proper password hashing and verification
    
    # Check if user exists
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        # Create a new user for development
        user = User(
            user_id=1,  # You can implement auto-increment logic
            name=login_data.email.split('@')[0].title(),
            email=login_data.email,
            role=UserRole.ADMIN if "admin" in login_data.email.lower() else UserRole.INSTRUCTOR,
            status=UserStatus.ACTIVE,
            department="Computer Science"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value,
            "status": user.status.value,
            "department": user.department
        }
    )

@router.get("/me", response_model=UserInfo)
async def get_current_user(current_user: User = Depends(verify_token)):
    return UserInfo(
        id=current_user.id,
        user_id=current_user.user_id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role.value,
        status=current_user.status.value,
        department=current_user.department
    )

@router.post("/logout")
async def logout():
    # In a real application, you might want to blacklist the token
    return {"message": "Successfully logged out"}

@router.get("/users", response_model=list[UserInfo])
async def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(verify_token)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    users = db.query(User).all()
    return [
        UserInfo(
            id=user.id,
            user_id=user.user_id,
            name=user.name,
            email=user.email,
            role=user.role.value,
            status=user.status.value,
            department=user.department
        ) for user in users
    ]
