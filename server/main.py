from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.routes import firebase_auth, firebase_dashboard, firebase_auth_updated, instructor_dashboard, admin_report, instructor_courses, instructor_report, department_head_dashboard, admin_predict, deptheadpredictives

app = FastAPI(
    title="Multi-Dimensional Course Performance Analytics API",
    description="Firebase-based Backend API for Course Performance Analytics Dashboard",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Firebase routes only
app.include_router(firebase_auth.router, prefix="/api/firebase/auth/v1", tags=["Firebase Authentication V1"])
app.include_router(firebase_auth_updated.router, prefix="/api/firebase/auth/v2", tags=["Firebase Authentication V2"])
app.include_router(firebase_dashboard.router, prefix="/api/firebase/dashboard", tags=["Firebase Dashboard"])
app.include_router(instructor_dashboard.router, prefix="/api/instructor/dashboard", tags=["Instructor Dashboard"])
app.include_router(admin_report.router, prefix="/api/admin/report", tags=["Admin Reports"])
app.include_router(instructor_courses.router, prefix="/api/instructor/courses", tags=["Instructor Courses"])
app.include_router(instructor_report.router, prefix="/api/instructor/report", tags=["Instructor Reports"])
app.include_router(department_head_dashboard.router, prefix="/api/department-head/dashboard", tags=["Department Head Dashboard"])
app.include_router(admin_predict.router, prefix="/api/admin/predict", tags=["Admin Predictions"])
app.include_router(deptheadpredictives.router, prefix="/api/department-head", tags=["Department Head Predictives"])


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Multi-Dimensional Course Performance Analytics API",
        "version": "2.0.0",
        "description": "Firebase-based Backend API",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "firebase_auth_v1": "/api/firebase/auth/v1",
            "firebase_auth_v2": "/api/firebase/auth/v2", 
            "firebase_dashboard": "/api/firebase/dashboard",
            "instructor_dashboard": "/api/instructor/dashboard",
            "admin_reports": "/api/admin/report",
            "instructor_reports": "/api/instructor/report",
            "department_head_dashboard": "/api/department-head/dashboard",
            "admin_predictions": "/api/admin/predict",
            "department_head_predictives": "/api/department-head/predictive-analytics"
        }
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "course-analytics-api"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)