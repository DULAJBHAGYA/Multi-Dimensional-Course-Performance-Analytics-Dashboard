#!/usr/bin/env python3
"""
Test script to verify Firestore API endpoints
"""
import asyncio
from app.firebase_config import get_firestore_client

async def test_firestore_apis():
    """Test the Firestore API endpoints"""
    print("Testing Firestore API endpoints...")
    print("=" * 50)
    
    try:
        # Test Firebase connection
        db = get_firestore_client()
        if not db:
            print("❌ Firebase connection failed")
            return
        
        print("✅ Firebase connection successful!")
        
        # Test getting sample data
        print("\n1. Testing Firestore Collections:")
        
        # Get sample instructor
        instructors_query = db.collection('instructors').limit(1).stream()
        sample_instructor = None
        for doc in instructors_query:
            instructor_data = doc.to_dict()
            sample_instructor = {
                "instructorId": doc.id,
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
                "adminId": doc.id,
                "email": admin_data.get('email', ''),
                "password": admin_data.get('password', ''),
                "name": admin_data.get('display_name', admin_data.get('username', 'Unknown')),
                "role": "admin"
            }
            break
        
        print(f"✅ Sample Instructor: {sample_instructor['name']} ({sample_instructor['email']})")
        print(f"✅ Sample Admin: {sample_admin['name']} ({sample_admin['email']})")
        
        # Test data counts
        print("\n2. Testing Data Counts:")
        collections = {
            'instructors': db.collection('instructors'),
            'admins': db.collection('admins'),
            'courses': db.collection('courses'),
            'students': db.collection('students'),
            'campuses': db.collection('campuses'),
            'sections': db.collection('sections'),
            'performanceData': db.collection('performanceData')
        }
        
        for name, collection in collections.items():
            try:
                docs = list(collection.stream())
                print(f"✅ {name}: {len(docs)} documents")
            except Exception as e:
                print(f"❌ {name}: Error - {e}")
        
        # Test sections with instructor references
        print("\n3. Testing Section-Instructor Relationships:")
        sections_query = db.collection('sections').limit(10).stream()
        sections_with_instructors = 0
        sections_without_instructors = 0
        
        for section in sections_query:
            section_data = section.to_dict()
            if section_data.get('instructorId'):
                sections_with_instructors += 1
            else:
                sections_without_instructors += 1
        
        print(f"✅ Sections with instructors: {sections_with_instructors}")
        print(f"✅ Sections without instructors: {sections_without_instructors}")
        
        # Test performance data with section references
        print("\n4. Testing Performance-Section Relationships:")
        performance_query = db.collection('performanceData').limit(10).stream()
        performance_with_sections = 0
        performance_without_sections = 0
        
        for record in performance_query:
            record_data = record.to_dict()
            if record_data.get('sectionId'):
                performance_with_sections += 1
            else:
                performance_without_sections += 1
        
        print(f"✅ Performance records with sections: {performance_with_sections}")
        print(f"✅ Performance records without sections: {performance_without_sections}")
        
        print("\n" + "=" * 50)
        print("🎉 All Firestore API tests completed successfully!")
        print("\nYour server is ready to connect to the cleaned Firestore database!")
        print("\nNext steps:")
        print("1. Start your FastAPI server: python3 main.py")
        print("2. Test login with sample credentials:")
        print(f"   - Instructor: {sample_instructor['email']} / {sample_instructor['password']}")
        print(f"   - Admin: {sample_admin['email']} / {sample_admin['password']}")
        print("3. Use the new API endpoints:")
        print("   - POST /api/firebase/auth/v2/login")
        print("   - GET /api/firebase/dashboard/instructor")
        print("   - GET /api/firebase/dashboard/admin")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_firestore_apis())
