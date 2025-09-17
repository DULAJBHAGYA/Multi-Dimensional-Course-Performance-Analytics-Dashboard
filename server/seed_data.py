"""
Data seeding script to populate the database with the provided dataset
"""
from sqlalchemy.orm import sessionmaker
from app.database import engine, Base
from app.models.user import User, UserRole, UserStatus
from app.models.course import Course, CourseAssignment
from app.models.analytics import AnalyticsData, PerformanceMetrics, StudentEngagement
from datetime import datetime

# Create tables
Base.metadata.create_all(bind=engine)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Real dataset from the provided data
dataset = [
    {"userID": 15, "userName": "Sheri Murra", "userRole": "Admin", "courseCode": "CIA4303", "courseName": "Application", "courseCredi": 3, "crnCode": 1015, "mesterNam": "Summer 2C", "campusName": "Sharjah Campus"},
    {"userID": 22, "userName": "Daniel Carl", "userRole": "Faculty", "courseCode": "CIA3305", "courseName": "AI & Machi", "courseCredi": 3, "crnCode": 1012, "mesterNam": "Spring 202", "campusName": "Dubai Campus"},
    {"userID": 43, "userName": "Lisa Williar", "userRole": "Faculty", "courseCode": "CIA2102", "courseName": "Computer I", "courseCredi": 3, "crnCode": 1010, "mesterNam": "Fall 2024", "campusName": "Abu Dhabi Campus"},
    {"userID": 34, "userName": "Joseph Vaz", "userRole": "Faculty", "courseCode": "CIA1101", "courseName": "Intro to Pro", "courseCredi": 3, "crnCode": 1027, "mesterNam": "Summer 2C", "campusName": "Sharjah Campus"},
    {"userID": 26, "userName": "Jean Martir", "userRole": "Faculty", "courseCode": "CIA3201", "courseName": "Database Sy", "courseCredi": 3, "crnCode": 1020, "mesterNam": "Spring 202", "campusName": "Dubai Campus"},
    {"userID": 29, "userName": "Eddie John", "userRole": "Faculty", "courseCode": "CIA4303", "courseName": "Application", "courseCredi": 3, "crnCode": 1004, "mesterNam": "Fall 2024", "campusName": "Abu Dhabi Campus"},
    {"userID": 5, "userName": "Tracy Perez", "userRole": "Admin", "courseCode": "CIA3305", "courseName": "AI & Machi", "courseCredi": 3, "crnCode": 1029, "mesterNam": "Summer 2C", "campusName": "Sharjah Campus"},
    {"userID": 18, "userName": "Benjamin L", "userRole": "Faculty", "courseCode": "CIA2102", "courseName": "Computer I", "courseCredi": 3, "crnCode": 1036, "mesterNam": "Spring 202", "campusName": "Dubai Campus"},
    {"userID": 11, "userName": "Valerie San", "userRole": "Faculty", "courseCode": "CIA1101", "courseName": "Intro to Pro", "courseCredi": 3, "crnCode": 1083, "mesterNam": "Fall 2024", "campusName": "Abu Dhabi Campus"},
    {"userID": 32, "userName": "Sean Tran", "userRole": "Faculty", "courseCode": "CIA3201", "courseName": "Database Sy", "courseCredi": 3, "crnCode": 1072, "mesterNam": "Summer 2C", "campusName": "Sharjah Campus"},
    {"userID": 31, "userName": "Sheila Casti", "userRole": "Faculty", "courseCode": "CIA4303", "courseName": "Application", "courseCredi": 3, "crnCode": 1064, "mesterNam": "Spring 202", "campusName": "Dubai Campus"},
    {"userID": 17, "userName": "Heather Tal", "userRole": "Faculty", "courseCode": "CIA3305", "courseName": "AI & Machi", "courseCredi": 3, "crnCode": 1057, "mesterNam": "Fall 2024", "campusName": "Abu Dhabi Campus"},
    {"userID": 41, "userName": "Margaret M", "userRole": "Admin", "courseCode": "CIA2102", "courseName": "Computer I", "courseCredi": 3, "crnCode": 1040, "mesterNam": "Summer 2C", "campusName": "Sharjah Campus"},
    {"userID": 28, "userName": "Logan Agui", "userRole": "Faculty", "courseCode": "CIA1101", "courseName": "Intro to Pro", "courseCredi": 3, "crnCode": 1001, "mesterNam": "Spring 202", "campusName": "Dubai Campus"},
    {"userID": 21, "userName": "James Jarvi", "userRole": "Faculty", "courseCode": "CIA3201", "courseName": "Database Sy", "courseCredi": 3, "crnCode": 1071, "mesterNam": "Fall 2024", "campusName": "Abu Dhabi Campus"},
    {"userID": 50, "userName": "Tony Gray", "userRole": "Faculty", "courseCode": "CIA4303", "courseName": "Application", "courseCredi": 3, "crnCode": 1080, "mesterNam": "Summer 2C", "campusName": "Sharjah Campus"},
    {"userID": 9, "userName": "Amanda Jo", "userRole": "Faculty", "courseCode": "CIA3305", "courseName": "AI & Machi", "courseCredi": 3, "crnCode": 1007, "mesterNam": "Spring 202", "campusName": "Dubai Campus"},
    {"userID": 4, "userName": "Mr. Christo", "userRole": "Admin", "courseCode": "CIA2102", "courseName": "Computer I", "courseCredi": 3, "crnCode": 1050, "mesterNam": "Fall 2024", "campusName": "Abu Dhabi Campus"},
    {"userID": 46, "userName": "Frank Woo", "userRole": "Faculty", "courseCode": "CIA1101", "courseName": "Intro to Pro", "courseCredi": 3, "crnCode": 1096, "mesterNam": "Summer 2C", "campusName": "Sharjah Campus"},
    {"userID": 13, "userName": "James Garc", "userRole": "Faculty", "courseCode": "CIA3201", "courseName": "Database Sy", "courseCredi": 3, "crnCode": 1048, "mesterNam": "Spring 202", "campusName": "Dubai Campus"},
    {"userID": 10, "userName": "Martha Har", "userRole": "Faculty", "courseCode": "CIA4303", "courseName": "Application", "courseCredi": 3, "crnCode": 1093, "mesterNam": "Fall 2024", "campusName": "Abu Dhabi Campus"},
    {"userID": 35, "userName": "Sierra Galle", "userRole": "Faculty", "courseCode": "CIA3305", "courseName": "AI & Machi", "courseCredi": 3, "crnCode": 1037, "mesterNam": "Summer 2C", "campusName": "Sharjah Campus"},
    {"userID": 30, "userName": "Dominique", "userRole": "Faculty", "courseCode": "CIA2102", "courseName": "Computer I", "courseCredi": 3, "crnCode": 1091, "mesterNam": "Spring 202", "campusName": "Dubai Campus"}
]

def seed_database():
    """Seed the database with the provided dataset"""
    
    # Clear existing data
    db.query(CourseAssignment).delete()
    db.query(Course).delete()
    db.query(User).delete()
    db.commit()
    
    # Create users (unique by userID)
    unique_users = {}
    for record in dataset:
        user_id = record["userID"]
        if user_id not in unique_users:
            unique_users[user_id] = {
                "userID": user_id,
                "userName": record["userName"],
                "userRole": record["userRole"],
                "email": f"{record['userName'].lower().replace(' ', '.')}@university.edu"
            }
    
    # Insert users
    user_objects = {}
    for user_data in unique_users.values():
        user = User(
            user_id=user_data["userID"],
            name=user_data["userName"],
            email=user_data["email"],
            role=UserRole.ADMIN if user_data["userRole"] == "Admin" else UserRole.INSTRUCTOR,
            status=UserStatus.ACTIVE,
            department="Computer Science",
            password_hash="hashed_password_placeholder"  # In production, hash actual passwords
        )
        db.add(user)
        db.flush()  # Flush to get the ID
        user_objects[user_data["userID"]] = user
    
    # Create courses (unique by courseCode)
    unique_courses = {}
    for record in dataset:
        course_code = record["courseCode"]
        if course_code not in unique_courses:
            # Generate realistic performance data
            total_enrollments = len([r for r in dataset if r["courseCode"] == course_code])
            active_students = int(total_enrollments * 0.85)  # 85% active
            completion_rate = 78 + (hash(course_code) % 20)  # 78-98% completion rate
            average_rating = 4.0 + (hash(course_code) % 10) / 10  # 4.0-4.9 rating
            revenue = total_enrollments * 500  # $500 per enrollment
            
            unique_courses[course_code] = {
                "courseCode": course_code,
                "courseName": record["courseName"],
                "courseCredi": record["courseCredi"],
                "totalEnrollments": total_enrollments,
                "activeStudents": active_students,
                "completionRate": completion_rate,
                "averageRating": average_rating,
                "revenue": revenue
            }
    
    # Insert courses
    course_objects = {}
    for course_data in unique_courses.values():
        course = Course(
            course_code=course_data["courseCode"],
            course_name=course_data["courseName"],
            course_credits=course_data["courseCredi"],
            crn_code=1000 + hash(course_data["courseCode"]) % 1000,  # Generate CRN
            semester_name="Fall 2024",  # Default semester
            campus_name="Main Campus",  # Default campus
            total_enrollments=course_data["totalEnrollments"],
            active_students=course_data["activeStudents"],
            completion_rate=course_data["completionRate"],
            average_rating=course_data["averageRating"],
            revenue=course_data["revenue"]
        )
        db.add(course)
        db.flush()  # Flush to get the ID
        course_objects[course_data["courseCode"]] = course
    
    # Create course assignments
    for record in dataset:
        user_id = record["userID"]
        course_code = record["courseCode"]
        
        user = user_objects[user_id]
        course = course_objects[course_code]
        
        # Check if assignment already exists
        existing_assignment = db.query(CourseAssignment).filter(
            CourseAssignment.user_id == user.id,
            CourseAssignment.course_id == course.id
        ).first()
        
        if not existing_assignment:
            assignment = CourseAssignment(
                user_id=user.id,
                course_id=course.id
            )
            db.add(assignment)
    
    db.commit()
    print("Database seeded successfully!")
    print(f"Created {len(user_objects)} users")
    print(f"Created {len(course_objects)} courses")
    print(f"Created course assignments")

if __name__ == "__main__":
    seed_database()
