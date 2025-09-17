# Multi-Dimensional Course Performance Analytics - Backend API

FastAPI backend for the Course Performance Analytics Dashboard.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip

### Installation

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Create a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env file with your configuration
   ```

5. **Seed the database with sample data:**
   ```bash
   python seed_data.py
   ```

6. **Run the development server:**
   ```bash
   python main.py
   ```

The API will be available at `http://localhost:8000`

## 📚 API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `GET /api/auth/users` - Get all users (Admin only)

### Dashboard
- `GET /api/dashboard/instructor` - Instructor dashboard data
- `GET /api/dashboard/admin` - Admin dashboard data

### Analytics
- `GET /api/analytics/course` - Course analytics data
- `GET /api/analytics/predictive` - Predictive analytics data
- `GET /api/analytics/reports` - Report generation

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/{user_id}` - Update user
- `DELETE /api/admin/users/{user_id}` - Delete user
- `GET /api/admin/metrics` - Platform metrics
- `GET /api/admin/courses` - Get all courses
- `POST /api/admin/courses/{course_id}/assign/{user_id}` - Assign course to user

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `user_id` - External user ID from dataset
- `name` - User's full name
- `email` - User's email address
- `role` - User role (admin/instructor)
- `status` - User status (active/inactive)
- `department` - User's department
- `password_hash` - Hashed password
- `created_at` - Account creation timestamp
- `last_login` - Last login timestamp

### Courses Table
- `id` - Primary key
- `course_code` - Course code (e.g., CIA4303)
- `course_name` - Course name
- `course_credits` - Number of credits
- `crn_code` - Course Reference Number
- `semester_name` - Semester name
- `campus_name` - Campus name
- `total_enrollments` - Total student enrollments
- `active_students` - Currently active students
- `completion_rate` - Course completion rate
- `average_rating` - Average student rating
- `revenue` - Course revenue
- `created_at` - Course creation timestamp

### Course Assignments Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `course_id` - Foreign key to courses table
- `assigned_at` - Assignment timestamp

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🌐 CORS Configuration

The API is configured to allow requests from:
- `http://localhost:3000` (React development server)
- `http://localhost:5173` (Vite development server)

## 📊 Sample Data

The database is seeded with real data from your dataset:
- **23 unique users** (4 Admins, 19 Faculty)
- **5 distinct courses** (CIA4303, CIA3305, CIA2102, CIA1101, CIA3201)
- **Course assignments** linking users to courses
- **Realistic performance metrics** calculated from the data

## 🚀 Production Deployment

For production deployment:

1. **Use a production database** (PostgreSQL, MySQL)
2. **Set secure JWT secrets**
3. **Configure proper CORS origins**
4. **Use environment variables for configuration**
5. **Set up proper logging and monitoring**

## 🔧 Development

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Database Migrations
```bash
# Install Alembic
pip install alembic

# Create migration
alembic revision --autogenerate -m "Description"

# Apply migration
alembic upgrade head
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./course_analytics.db` |
| `SECRET_KEY` | JWT secret key | `your-secret-key-change-in-production` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `30` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000,http://localhost:5173` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `DEBUG` | Debug mode | `True` |
