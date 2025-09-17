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
        
        # Get Firebase credentials from environment variables
        firebase_credentials = {
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL")
        }
        
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate(firebase_credentials)
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
