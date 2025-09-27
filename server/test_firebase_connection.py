#!/usr/bin/env python3
"""
Firebase Connection Test Script
Tests Firebase configuration and Firestore connectivity
"""

import sys
import os
import json
from pathlib import Path

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """Test if all required modules can be imported"""
    print("🧪 Testing imports...")
    
    try:
        import firebase_admin
        print("✅ firebase_admin imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import firebase_admin: {e}")
        return False
    
    try:
        from firebase_admin import credentials, firestore
        print("✅ Firebase credentials and firestore imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import Firebase modules: {e}")
        return False
    
    return True

def test_key_file():
    """Test if the Firebase service account key file exists and is valid"""
    print("\n🔑 Testing Firebase service account key file...")
    
    key_file_path = "course-performance-analytic-firebase-adminsdk-fbsvc-9d575fb1d3.json"
    
    if not os.path.exists(key_file_path):
        print(f"❌ Firebase key file not found: {key_file_path}")
        return False
    
    try:
        with open(key_file_path, 'r') as f:
            key_data = json.load(f)
        
        required_fields = ['type', 'project_id', 'private_key', 'client_email']
        for field in required_fields:
            if field not in key_data:
                print(f"❌ Missing required field in key file: {field}")
                return False
        
        print(f"✅ Firebase key file is valid")
        print(f"   Project ID: {key_data.get('project_id')}")
        print(f"   Client Email: {key_data.get('client_email')}")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in key file: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading key file: {e}")
        return False

def test_firebase_initialization():
    """Test Firebase initialization"""
    print("\n🔥 Testing Firebase initialization...")
    
    try:
        from app.firebase_config import initialize_firebase, test_firestore_connection
        
        # Initialize Firebase
        db = initialize_firebase()
        if db is None:
            print("❌ Firebase initialization returned None")
            return False
        
        print("✅ Firebase initialized successfully")
        
        # Test Firestore connection
        success, message = test_firestore_connection()
        if success:
            print(f"✅ Firestore connection test passed: {message}")
            return True
        else:
            print(f"❌ Firestore connection test failed: {message}")
            return False
            
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

def test_collections():
    """Test access to Firestore collections"""
    print("\n📚 Testing Firestore collections...")
    
    try:
        from app.firebase_config import get_firestore_client
        
        db = get_firestore_client()
        if not db:
            print("❌ Could not get Firestore client")
            return False
        
        collections = ['instructors', 'admins', 'students', 'courses', 'sections', 'campuses']
        
        for collection_name in collections:
            try:
                # Try to get document count
                docs = list(db.collection(collection_name).limit(5).stream())
                print(f"✅ Collection '{collection_name}': {len(docs)} documents found")
            except Exception as e:
                print(f"⚠️  Collection '{collection_name}': {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Collection test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Firebase Connection Test Suite")
    print("=" * 50)
    
    tests = [
        ("Import Test", test_imports),
        ("Key File Test", test_key_file),
        ("Firebase Initialization Test", test_firebase_initialization),
        ("Collections Test", test_collections),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        print("-" * 30)
        
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print("\n" + "=" * 50)
    print(f"🎯 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Firebase is configured correctly.")
        print("\n🚀 You can now start the server:")
        print("   python3 main.py")
        return True
    else:
        print("❌ Some tests failed. Please check the configuration.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)