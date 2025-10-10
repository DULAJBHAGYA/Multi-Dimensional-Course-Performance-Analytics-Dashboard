# 📚 **Multi-Dimensional Course Performance Analytics Dashboard - API Documentation**

## 🚀 **Overview**

This document provides comprehensive documentation for all APIs developed in the Multi-Dimensional Course Performance Analytics Dashboard server. The API is built using FastAPI and provides endpoints for authentication, dashboard data, analytics, and admin management.

**Base URL:** `http://localhost:8000`  
**API Version:** 1.0.0  
**Authentication:** JWT Bearer Token

---

## 🔐 **Authentication APIs** (`/api/auth`)

### **1. User Login**
- **Endpoint:** `POST /api/auth/login`
- **Description:** Authenticate user with email and password
- **Request Body:**
  ```json
  {
    "email": "instructor@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "user_id": 1,
      "name": "John Doe",
      "email": "instructor@example.com",
      "role": "instructor",
      "status": "active",
      "department": "Computer Science"
    }
  }
  ```

### **2. Get Current User**
- **Endpoint:** `GET /api/auth/me`
- **Description:** Get current authenticated user information
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "id": 1,
    "user_id": 1,
    "name": "John Doe",
    "email": "instructor@example.com",
    "role": "instructor",
    "status": "active",
    "department": "Computer Science"
  }
  ```

### **3. User Logout**
- **Endpoint:** `POST /api/auth/logout`
- **Description:** Logout current user
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "message": "Successfully logged out"
  }
  ```

### **4. Get All Users (Admin Only)**
- **Endpoint:** `GET /api/auth/users`
- **Description:** Get all users in the system
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Admin
- **Response:**
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "name": "John Doe",
      "email": "instructor@example.com",
      "role": "instructor",
      "status": "active",
      "department": "Computer Science"
    }
  ]
  ```

---

## 📊 **Dashboard APIs** (`/api/dashboard`)

### **5. Instructor Dashboard**
- **Endpoint:** `GET /api/dashboard/instructor`
- **Description:** Get comprehensive instructor dashboard data
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Instructor
- **Response:**
  ```json
  {
    "kpis": {
      "total_students": 156,
      "active_courses": 8,
      "avg_performance": 87.5,
      "completion_rate": 87.5,
      "total_revenue": 45600.00,
      "monthly_growth": 12.5,
      "at_risk_students": 23,
      "pending_assignments": 24
    },
    "courses": [
      {
        "id": 1,
        "name": "Mathematics 101",
        "students": 45,
        "performance": 85.5,
        "status": "active",
        "last_activity": "2 hours ago",
        "upcoming_deadlines": 2,
        "average_rating": 4.2
      }
    ],
    "performance_trend": [
      {
        "month": "Jan",
        "performance": 85,
        "students": 120,
        "assignments": 45
      }
    ],
    "recent_activity": [
      {
        "type": "submission",
        "course": "Mathematics 101",
        "student": "John Doe",
        "time": "2 hours ago",
        "details": "Assignment 3 submitted",
        "score": null
      }
    ],
    "upcoming_events": [
      {
        "title": "Mathematics 101 - Midterm Exam",
        "date": "2024-01-15",
        "time": "10:00 AM",
        "type": "exam",
        "course": "Mathematics 101"
      }
    ],
    "quick_stats": {
      "total_assignments": 156,
      "graded_assignments": 142,
      "pending_grades": 14,
      "student_questions": 23,
      "announcements_sent": 8,
      "office_hours_attended": 45
    }
  }
  ```

### **6. Instructor Courses**
- **Endpoint:** `GET /api/dashboard/instructor/courses`
- **Description:** Get all courses assigned to the instructor
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Instructor
- **Response:**
  ```json
  [
    {
      "id": 1,
      "course_code": "MATH101",
      "course_name": "Mathematics 101",
      "course_credits": 3,
      "crn_code": "12345",
      "semester_name": "Fall 2024",
      "campus_name": "Main Campus",
      "total_enrollments": 45,
      "active_students": 42,
      "completion_rate": 85.5,
      "average_rating": 4.2,
      "revenue": 13500.00,
      "created_at": "2024-01-01T00:00:00"
    }
  ]
  ```

### **7. Instructor Assignments**
- **Endpoint:** `GET /api/dashboard/instructor/assignments`
- **Description:** Get assignments for instructor's courses
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Instructor
- **Query Parameters:**
  - `course_id` (optional): Filter by specific course
- **Response:**
  ```json
  [
    {
      "id": 1,
      "title": "Mathematics 101 - Assignment 1",
      "course": "Mathematics 101",
      "due_date": "2024-01-15T23:59:00",
      "total_submissions": 45,
      "graded_submissions": 42,
      "pending_grades": 3,
      "average_score": 87.5,
      "status": "active"
    }
  ]
  ```

### **8. Instructor Students**
- **Endpoint:** `GET /api/dashboard/instructor/students`
- **Description:** Get students enrolled in instructor's courses
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Instructor
- **Query Parameters:**
  - `course_id` (optional): Filter by specific course
- **Response:**
  ```json
  [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@university.edu",
      "course": "Mathematics 101",
      "enrollment_date": "2024-01-10",
      "progress": 85.5,
      "last_activity": "2 hours ago",
      "assignments_submitted": 8,
      "average_grade": 87.2,
      "status": "active"
    }
  ]
  ```

### **9. Instructor Announcements**
- **Endpoint:** `GET /api/dashboard/instructor/announcements`
- **Description:** Get announcements created by instructor
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Instructor
- **Response:**
  ```json
  [
    {
      "id": 1,
      "title": "Midterm Exam Schedule",
      "content": "The midterm exam for Mathematics 101 will be held on January 15th at 10:00 AM in Room 201.",
      "course": "Mathematics 101",
      "created_at": "2024-01-10T09:00:00",
      "priority": "high",
      "read_count": 45,
      "status": "active"
    }
  ]
  ```

### **10. Admin Dashboard**
- **Endpoint:** `GET /api/dashboard/admin`
- **Description:** Get admin dashboard data
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Admin
- **Response:**
  ```json
  {
    "kpis": {
      "total_students": 1247,
      "total_courses": 45,
      "total_instructors": 23,
      "overall_completion_rate": 78.5,
      "at_risk_students": 150,
      "total_campuses": 3,
      "active_semesters": 2
    },
    "campus_breakdown": {
      "Main Campus": {
        "total_courses": 25,
        "total_students": 800,
        "average_performance": 82.3
      }
    },
    "course_distribution": [
      {
        "department": "Mathematics 101",
        "average_performance": 85.5,
        "total_courses": 1,
        "students": 45
      }
    ],
    "campus_performance": [
      {
        "campus": "Main Campus",
        "pass_rate": 82.3,
        "students": 800,
        "courses": 25,
        "instructors": 15
      }
    ]
  }
  ```

---

## 📈 **Analytics APIs** (`/api/analytics`)

### **11. Course Analytics**
- **Endpoint:** `GET /api/analytics/course`
- **Description:** Get comprehensive course analytics data
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `course_id` (optional): Filter by specific course
  - `date_range` (default: "30d"): Time period filter
  - `cohort` (default: "all"): Student cohort filter
- **Response:**
  ```json
  {
    "kpis": {
      "total_enrollments": 156,
      "active_students": 142,
      "completion_rate": 78.5,
      "average_progress": 78.5,
      "average_rating": 4.2,
      "revenue": 45600.00,
      "engagement_score": 87.5,
      "satisfaction_score": 4.2
    },
    "enrollment_trend": [
      {
        "month": "Jan",
        "enrollments": 45
      }
    ],
    "progress_distribution": [
      {
        "range": "0-20%",
        "students": 5,
        "percentage": 18.5
      }
    ],
    "drop_off_points": [
      {
        "lesson": "Introduction",
        "completion_rate": 95,
        "drop_off": 5
      }
    ],
    "ratings_breakdown": [
      {
        "stars": 5,
        "count": 45,
        "percentage": 60.0
      }
    ],
    "most_viewed_lessons": [
      {
        "lesson": "Introduction to Programming",
        "views": 156,
        "completion_rate": 95
      }
    ],
    "least_viewed_lessons": [
      {
        "lesson": "Advanced Topics",
        "views": 45,
        "completion_rate": 65
      }
    ],
    "recent_reviews": [
      {
        "student": "John Doe",
        "rating": 5,
        "comment": "Excellent course!",
        "date": "2 days ago"
      }
    ],
    "engagement_metrics": {
      "daily_active_users": 45,
      "weekly_active_users": 156,
      "average_session_duration": 32.5,
      "page_views_per_session": 8.7,
      "bounce_rate": 12.3,
      "return_visitor_rate": 78.9
    },
    "attendance_data": [
      {
        "week": "Week 1",
        "attendance_rate": 95.2,
        "total_students": 45
      }
    ],
    "grade_distribution": [
      {
        "grade_range": "90-100",
        "count": 12,
        "percentage": 30.0
      }
    ],
    "time_spent_analysis": [
      {
        "lesson": "Introduction",
        "avg_time": 45,
        "completion_rate": 95
      }
    ],
    "discussion_forum_stats": {
      "total_posts": 234,
      "total_replies": 567,
      "active_discussions": 23,
      "instructor_participation": 89.2,
      "average_response_time": 4.5,
      "most_active_topic": "Assignment Help"
    }
  }
  ```

### **12. Predictive Analytics**
- **Endpoint:** `GET /api/analytics/predictive`
- **Description:** Get AI-powered predictive analytics
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "predicted_completion_rate": 82.5,
    "predicted_dropout_rate": 17.5,
    "future_enrollment_forecast": [
      {
        "month": "Jul",
        "predicted_enrollments": 145
      }
    ],
    "at_risk_students": [
      {
        "student_id": "S001",
        "name": "John Doe",
        "risk_score": 0.85,
        "reasons": ["Low engagement", "Missing assignments"]
      }
    ],
    "engagement_scores": [
      {
        "student_id": "S001",
        "name": "John Doe",
        "score": 45
      }
    ],
    "predicted_engaging_lessons": [
      {
        "lesson": "Interactive Coding",
        "predicted_engagement": 92,
        "confidence": 0.87
      }
    ],
    "predicted_drop_off_points": [
      {
        "lesson": "Advanced Algorithms",
        "predicted_drop_off": 25,
        "confidence": 0.91
      }
    ],
    "content_improvement_suggestions": [
      {
        "area": "Module 3",
        "suggestion": "Add more visual examples",
        "priority": "High"
      }
    ],
    "ai_recommendations": [
      {
        "type": "tip",
        "message": "Consider adding more interactive elements to Module 2",
        "priority": "high"
      }
    ],
    "performance_predictions": [
      {
        "student_id": "S001",
        "predicted_final_grade": 78.5,
        "confidence": 0.85,
        "key_factors": ["attendance", "assignment_submission"]
      }
    ],
    "resource_utilization_forecast": [
      {
        "resource": "Video Lectures",
        "current_usage": 85,
        "predicted_peak": 95,
        "recommended_capacity": 100
      }
    ],
    "intervention_recommendations": [
      {
        "student_id": "S001",
        "intervention_type": "tutoring",
        "urgency": "high",
        "expected_impact": 0.15
      }
    ],
    "success_probability": {
      "course_completion": 0.82,
      "student_satisfaction": 0.89,
      "instructor_rating": 0.91,
      "revenue_target": 0.76,
      "retention_rate": 0.85
    }
  }
  ```

### **13. Report Generation**
- **Endpoint:** `GET /api/analytics/reports`
- **Description:** Generate comprehensive reports
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `course_id` (optional): Filter by course
  - `date_range` (default: "30d"): Time period
  - `report_type` (default: "performance"): Report type (performance, engagement, financial)
- **Response Examples:**

#### Performance Report:
```json
{
  "report_id": "RPT_20240115_143022",
  "generated_at": "2024-01-15T14:30:22",
  "course_id": "MATH101",
  "date_range": "30d",
  "report_type": "performance",
  "summary": {
    "total_students": 156,
    "completion_rate": 78.5,
    "average_grade": 85.2,
    "active_students": 134,
    "at_risk_students": 12,
    "top_performers": 23,
    "improvement_areas": ["Module 3", "Final Project"]
  },
  "data": {
    "student_performance": [
      {
        "student_id": "S001",
        "name": "John Doe",
        "grade": 88,
        "status": "completed",
        "trend": "improving"
      }
    ],
    "engagement_metrics": {
      "daily_logins": 45,
      "average_session_time": 25.5,
      "quiz_attempts": 234,
      "forum_posts": 67,
      "assignment_submissions": 189,
      "video_watch_time": 156.7
    },
    "grade_distribution": [
      {
        "range": "90-100",
        "count": 23,
        "percentage": 14.7
      }
    ]
  }
}
```

#### Engagement Report:
```json
{
  "report_id": "RPT_20240115_143022",
  "generated_at": "2024-01-15T14:30:22",
  "course_id": "MATH101",
  "date_range": "30d",
  "report_type": "engagement",
  "summary": {
    "total_engagement_score": 87.3,
    "most_engaged_students": 34,
    "least_engaged_students": 12,
    "average_participation": 78.5
  },
  "data": {
    "engagement_breakdown": [
      {
        "activity": "Video Lectures",
        "engagement_rate": 89.2,
        "time_spent": 45.6
      }
    ],
    "participation_trends": [
      {
        "week": "Week 1",
        "participation": 95.2
      }
    ]
  }
}
```

#### Financial Report:
```json
{
  "report_id": "RPT_20240115_143022",
  "generated_at": "2024-01-15T14:30:22",
  "course_id": "MATH101",
  "date_range": "30d",
  "report_type": "financial",
  "summary": {
    "total_revenue": 45600.00,
    "enrollment_fee": 300.00,
    "total_enrollments": 152,
    "revenue_growth": 12.5,
    "projected_revenue": 51200.00
  },
  "data": {
    "revenue_breakdown": [
      {
        "source": "Course Fees",
        "amount": 45600.00,
        "percentage": 100.0
      }
    ],
    "monthly_revenue": [
      {
        "month": "Jan",
        "revenue": 12500.00,
        "enrollments": 42
      }
    ]
  }
}
```

---

## 👥 **Admin Management APIs** (`/api/admin`)

### **14. Get All Users**
- **Endpoint:** `GET /api/admin/users`
- **Description:** Get all users with filtering options
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Admin
- **Query Parameters:**
  - `search` (optional): Search by name or email
  - `role_filter` (default: "all"): Filter by role (instructor, admin, all)
- **Response:**
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "name": "John Doe",
      "email": "instructor@example.com",
      "role": "instructor",
      "status": "active",
      "department": "Computer Science",
      "courses": 3,
      "students": 45,
      "last_login": "2024-01-15T10:30:00",
      "created_at": "2024-01-01T00:00:00"
    }
  ]
  ```

### **15. Create User**
- **Endpoint:** `POST /api/admin/users`
- **Description:** Create a new user
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Admin
- **Request Body:**
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "instructor",
    "department": "Mathematics"
  }
  ```
- **Response:**
  ```json
  {
    "id": 2,
    "user_id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "instructor",
    "status": "active",
    "department": "Mathematics",
    "courses": 0,
    "students": 0,
    "last_login": null,
    "created_at": "2024-01-15T14:30:00"
  }
  ```

### **16. Update User**
- **Endpoint:** `PUT /api/admin/users/{user_id}`
- **Description:** Update user information
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Admin
- **Request Body:**
  ```json
  {
    "name": "John Updated",
    "email": "john.updated@example.com",
    "role": "instructor",
    "department": "Computer Science",
    "status": "active"
  }
  ```
- **Response:**
  ```json
  {
    "id": 1,
    "user_id": 1,
    "name": "John Updated",
    "email": "john.updated@example.com",
    "role": "instructor",
    "status": "active",
    "department": "Computer Science",
    "courses": 3,
    "students": 45,
    "last_login": "2024-01-15T10:30:00",
    "created_at": "2024-01-01T00:00:00"
  }
  ```

### **17. Delete User**
- **Endpoint:** `DELETE /api/admin/users/{user_id}`
- **Description:** Delete a user
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Admin
- **Response:**
  ```json
  {
    "message": "User deleted successfully"
  }
  ```

### **18. Get All Courses**
- **Endpoint:** `GET /api/admin/courses`
- **Description:** Get all courses in the system
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Admin
- **Response:**
  ```json
  [
    {
      "id": 1,
      "course_code": "MATH101",
      "course_name": "Mathematics 101",
      "course_credits": 3,
      "crn_code": "12345",
      "semester_name": "Fall 2024",
      "campus_name": "Main Campus",
      "total_enrollments": 45,
      "active_students": 42,
      "completion_rate": 85.5,
      "average_rating": 4.2,
      "revenue": 13500.00,
      "created_at": "2024-01-01T00:00:00"
    }
  ]
  ```

### **19. Assign Course to User**
- **Endpoint:** `POST /api/admin/courses/{course_id}/assign/{user_id}`
- **Description:** Assign a course to a user
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Admin
- **Response:**
  ```json
  {
    "message": "Course Mathematics 101 assigned to John Doe successfully"
  }
  ```

### **20. Get Platform Metrics**
- **Endpoint:** `GET /api/admin/metrics`
- **Description:** Get platform-wide metrics
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Admin
- **Response:**
  ```json
  {
    "total_instructors": 23,
    "total_courses": 45,
    "total_students": 1247,
    "overall_completion_rate": 78.5,
    "dropout_rate": 21.5,
    "active_users": 1156,
    "inactive_users": 91,
    "daily_logins": 234,
    "weekly_logins": 1647
  }
  ```

---

## 🔥 **Firebase APIs** (`/api/firebase`)

### **21. Firebase Login**
- **Endpoint:** `POST /api/firebase/auth/login`
- **Description:** Firebase-based user authentication
- **Request Body:**
  ```json
  {
    "email": "instructor@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "user": {
      "id": "firebase_user_id",
      "name": "John Doe",
      "email": "instructor@example.com",
      "role": "instructor",
      "status": "active",
      "department": "Computer Science"
    }
  }
  ```

### **22. Firebase User Info**
- **Endpoint:** `GET /api/firebase/auth/me`
- **Description:** Get current Firebase user information
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "id": "firebase_user_id",
    "name": "John Doe",
    "email": "instructor@example.com",
    "role": "instructor",
    "status": "active",
    "department": "Computer Science"
  }
  ```

### **23. Firebase Logout**
- **Endpoint:** `POST /api/firebase/auth/logout`
- **Description:** Firebase user logout
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "message": "Successfully logged out"
  }
  ```

### **24. Firebase Users**
- **Endpoint:** `GET /api/firebase/auth/users`
- **Description:** Get all Firebase users
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Admin
- **Response:**
  ```json
  [
    {
      "id": "firebase_user_id",
      "name": "John Doe",
      "email": "instructor@example.com",
      "role": "instructor",
      "status": "active",
      "department": "Computer Science"
    }
  ]
  ```

### **25. Firebase Instructor Dashboard**
- **Endpoint:** `GET /api/firebase/dashboard/instructor`
- **Description:** Firebase instructor dashboard
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "message": "Welcome to instructor dashboard, John Doe!",
    "metrics": {
      "total_students": 156,
      "active_courses": 8,
      "completion_rate": 87.5
    }
  }
  ```

### **26. Firebase Admin Dashboard**
- **Endpoint:** `GET /api/firebase/dashboard/admin`
- **Description:** Firebase admin dashboard
- **Headers:** `Authorization: Bearer <token>`
- **Role Required:** Admin
- **Response:**
  ```json
  {
    "message": "Welcome to admin dashboard, Admin User!",
    "metrics": {
      "total_students": 1247,
      "total_courses": 45,
      "total_instructors": 23
    }
  }
  ```

### **27. Firebase Dashboard Metrics**
- **Endpoint:** `GET /api/firebase/dashboard/metrics`
- **Description:** Get Firebase dashboard metrics
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "total_students": 156,
    "active_courses": 8,
    "completion_rate": 87.5,
    "engagement_score": 89.2
  }
  ```

---

## 🏥 **System APIs**

### **28. Root Endpoint**
- **Endpoint:** `GET /`
- **Description:** API information and status
- **Response:**
  ```json
  {
    "message": "Multi-Dimensional Course Performance Analytics API",
    "status": "running"
  }
  ```

### **29. Health Check**
- **Endpoint:** `GET /health`
- **Description:** API health status
- **Response:**
  ```json
  {
    "status": "healthy",
    "message": "API is running"
  }
  ```

---

## 🔧 **Error Handling**

### **Common Error Responses:**

#### 401 Unauthorized:
```json
{
  "detail": "Could not validate credentials"
}
```

#### 403 Forbidden:
```json
{
  "detail": "Access denied. Admin role required."
}
```

#### 404 Not Found:
```json
{
  "detail": "User not found"
}
```

#### 400 Bad Request:
```json
{
  "detail": "User with this email already exists"
}
```

#### 500 Internal Server Error:
```json
{
  "detail": "Internal server error"
}
```

---

## 📝 **Usage Examples**

### **Authentication Flow:**
```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'instructor@example.com',
    password: 'password123'
  })
});
const { access_token } = await loginResponse.json();

// 2. Use token for authenticated requests
const dashboardResponse = await fetch('/api/dashboard/instructor', {
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  }
});
const dashboardData = await dashboardResponse.json();
```

### **Query Parameters Example:**
```javascript
// Get course analytics with filters
const analyticsResponse = await fetch('/api/analytics/course?course_id=MATH101&date_range=90d&cohort=all', {
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 📊 **API Summary**

- **Total Endpoints:** 29
- **Authentication Required:** 27 endpoints
- **Public Endpoints:** 2 (root, health)
- **Role-based Access:** 15 endpoints
- **Query Parameters:** 6 endpoints
- **Request/Response Formats:** JSON
- **Authentication Method:** JWT Bearer Token

---

## 🚀 **Getting Started**

1. **Start the server:**
   ```bash
   cd server
   python main.py
   ```

2. **Access API documentation:**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

3. **Test endpoints:**
   - Use the interactive documentation
   - Or make HTTP requests with tools like Postman/curl

---

*This documentation covers all APIs developed in the Multi-Dimensional Course Performance Analytics Dashboard server. For additional support or questions, please refer to the source code or contact the development team.*
