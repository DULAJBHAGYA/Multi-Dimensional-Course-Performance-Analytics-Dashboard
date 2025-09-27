"""
Firebase configuration and initialization
"""
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global Firestore client
_db = None

def initialize_firebase():
    """
    Initialize Firebase Admin SDK with service account credentials
    """
    global _db
    
    try:
        # Check if Firebase is already initialized
        if firebase_admin._apps:
            logger.info("Firebase already initialized")
            if _db is None:
                _db = firestore.client()
            return _db
        
        # Try multiple possible locations for the key file
        possible_paths = [
            # In server directory
            os.path.join(os.path.dirname(os.path.dirname(__file__)), 'course-performance-analytic-firebase-adminsdk-fbsvc-9d575fb1d3.json'),
            # In current directory
            'course-performance-analytic-firebase-adminsdk-fbsvc-9d575fb1d3.json',
            # Using environment variable
            os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', ''),
            # In project root
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'course-performance-analytic-firebase-adminsdk-fbsvc-9d575fb1d3.json')
        ]
        
        key_file_path = None
        for path in possible_paths:
            if path and os.path.exists(path):
                key_file_path = path
                logger.info(f"Found Firebase key file at: {key_file_path}")
                break
        
        if not key_file_path:
            logger.error(f"Firebase key file not found. Tried paths: {possible_paths}")
            return None
        
        # Initialize Firebase Admin SDK
        logger.info(f"Initializing Firebase with key file: {key_file_path}")
        cred = credentials.Certificate(key_file_path)
        
        # Initialize with explicit project ID
        firebase_admin.initialize_app(cred, {
            'projectId': 'course-performance-analytic'
        })
        
        # Create Firestore client
        _db = firestore.client()
        logger.info("Firebase initialized successfully")
        
        # Test the connection
        test_collection = _db.collection('test').limit(1).stream()
        logger.info("Firestore connection test successful")
        
        return _db
        
    except Exception as e:
        logger.error(f"Error initializing Firebase: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None

def get_firestore_client():
    """
    Get Firestore client instance with lazy initialization
    """
    global _db
    
    if _db is None:
        logger.info("Firestore client not initialized, attempting to initialize...")
        _db = initialize_firebase()
    
    if _db is None:
        logger.error("Failed to get Firestore client")
        return None
        
    return _db

def test_firestore_connection():
    """
    Test Firestore connection
    """
    try:
        db = get_firestore_client()
        if not db:
            return False, "Database client is None"
        
        # Try to read from a collection
        collections = ['instructors', 'admins', 'students', 'courses']
        for collection_name in collections:
            try:
                # Try to get one document from each collection
                docs = list(db.collection(collection_name).limit(1).stream())
                logger.info(f"Collection '{collection_name}' accessible, found {len(docs)} documents")
                return True, f"Successfully connected to Firestore. Collection '{collection_name}' accessible."
            except Exception as e:
                logger.warning(f"Could not access collection '{collection_name}': {e}")
                continue
        
        return False, "Could not access any collections"
        
    except Exception as e:
        logger.error(f"Firestore connection test failed: {e}")
        return False, str(e)
