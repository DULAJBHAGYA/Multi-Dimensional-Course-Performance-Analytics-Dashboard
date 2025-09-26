"""
Firebase configuration and initialization
"""
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin SDK
def initialize_firebase():
    """
    Initialize Firebase Admin SDK with service account credentials
    """
    try:
        # Check if Firebase is already initialized
        if firebase_admin._apps:
            return firestore.client()
        
        # Use the Firebase private key JSON file directly
        key_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'course-performance-analytic-firebase-adminsdk-fbsvc-9d575fb1d3.json')
        
        if not os.path.exists(key_file_path):
            print(f"Firebase key file not found at: {key_file_path}")
            return None
        
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate(key_file_path)
        firebase_admin.initialize_app(cred)
        
        # Return Firestore client
        return firestore.client()
        
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None

# Global Firestore client
db = initialize_firebase()

def get_firestore_client():
    """
    Get Firestore client instance
    """
    return db
