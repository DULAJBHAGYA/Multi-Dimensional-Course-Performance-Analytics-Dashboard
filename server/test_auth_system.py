"""
Test script to verify the updated authentication system with separate collections
"""
import sys
import os

# Add the server directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.firebase_config import get_firestore_client
import json

def test_auth_system():
    """Test the authentication system with separate collections"""
    print("Testing authentication system with separate collections...")
    
    # Initialize Firestore
    db = get_firestore_client()
    if not db:
        print("Failed to initialize Firestore")
        return False
    
    print("Firestore initialized successfully")
    
    # Test accessing instructors collection
    try:
        instructors_docs = list(db.collection('instructors').limit(1).stream())
        print(f"Found {len(instructors_docs)} instructors in the database")
        if instructors_docs:
            instructor_data = instructors_docs[0].to_dict()
            print(f"Sample instructor: {instructor_data}")
    except Exception as e:
        print(f"Error accessing instructors collection: {e}")
    
    # Test accessing admins collection
    try:
        admins_docs = list(db.collection('admins').limit(1).stream())
        print(f"Found {len(admins_docs)} admins in the database")
        if admins_docs:
            admin_data = admins_docs[0].to_dict()
            print(f"Sample admin: {admin_data}")
    except Exception as e:
        print(f"Error accessing admins collection: {e}")
    
    # Test accessing students collection
    try:
        students_docs = list(db.collection('students').limit(1).stream())
        print(f"Found {len(students_docs)} students in the database")
        if students_docs:
            student_data = students_docs[0].to_dict()
            print(f"Sample student: {student_data}")
    except Exception as e:
        print(f"Error accessing students collection: {e}")
    
    print("Authentication system test completed")
    return True

if __name__ == "__main__":
    test_auth_system()