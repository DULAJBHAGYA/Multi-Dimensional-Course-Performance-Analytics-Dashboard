# Firebase Firestore Setup Guide

## Prerequisites
1. Google Cloud Platform account
2. Firebase project created
3. Firestore database enabled

## Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `course-performance-analytics`
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firestore Database
1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database
5. Click "Done"

## Step 3: Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "IAM & Admin" > "Service Accounts"
4. Click "Create Service Account"
5. Enter name: `firebase-admin-sdk`
6. Click "Create and Continue"
7. Add role: "Firebase Admin SDK Administrator Service Agent"
8. Click "Done"

## Step 4: Generate Service Account Key
1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create"
6. Download the JSON file

## Step 5: Configure Environment Variables
1. Copy the downloaded JSON file to your server directory
2. Rename it to `firebase-service-account.json`
3. Update your `.env` file with the following variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project-id.iam.gserviceaccount.com

# JWT Secret
SECRET_KEY=your-secret-key-here
```

## Step 6: Test Firebase Connection
1. Start your FastAPI server:
```bash
cd server
source venv/bin/activate
python main.py
```

2. Test the Firebase endpoints:
```bash
# Test login
curl -X POST "http://localhost:8000/api/firebase/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "password"}'

# Test dashboard
curl -X GET "http://localhost:8000/api/firebase/dashboard/admin" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Firestore Collections Structure

The following collections will be created automatically:

### Users Collection
```json
{
  "id": "auto-generated-id",
  "name": "User Name",
  "email": "user@example.com",
  "role": "admin" | "instructor",
  "status": "active" | "inactive",
  "department": "Computer Science",
  "password_hash": "hashed_password",
  "created_at": "2024-01-01T00:00:00Z",
  "last_login": "2024-01-01T00:00:00Z"
}
```

### Courses Collection
```json
{
  "id": "auto-generated-id",
  "code": "CIA4303",
  "name": "Application Development",
  "credits": 3,
  "crn": "1001",
  "semester": "Fall 2024",
  "campus": "Sharjah",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Analytics Collection
```json
{
  "id": "auto-generated-id",
  "user_id": "instructor-id",
  "course_id": "course-id",
  "total_enrollments": 50,
  "active_students": 45,
  "completion_rate": 85.5,
  "average_progress": 78.2,
  "average_rating": 4.2,
  "revenue": 5000.0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Course Assignments Collection
```json
{
  "id": "auto-generated-id",
  "instructor_id": "instructor-id",
  "course_id": "course-id",
  "assigned_at": "2024-01-01T00:00:00Z"
}
```

## Security Rules (Optional)

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admins can read all data
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Troubleshooting

### Common Issues:
1. **Permission Denied**: Check service account permissions
2. **Invalid Credentials**: Verify environment variables
3. **Project Not Found**: Ensure project ID is correct
4. **Database Not Found**: Enable Firestore in Firebase Console

### Debug Mode:
Add this to your `.env` file for detailed logging:
```env
FIREBASE_DEBUG=true
```

## Next Steps
1. Implement proper password hashing
2. Add Firebase Authentication for frontend
3. Set up Firestore security rules
4. Implement data validation
5. Add error handling and logging
