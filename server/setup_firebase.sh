#!/bin/bash

# Firebase Setup and Installation Script
echo "🔥 Setting up Firebase dependencies for Course Performance Analytics Dashboard"

# Check if we're in the server directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found. Please run this script from the server directory."
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Check if Firebase key file exists
if [ ! -f "course-performance-analytic-firebase-adminsdk-fbsvc-9d575fb1d3.json" ]; then
    echo "⚠️  Warning: Firebase service account key file not found."
    echo "   Make sure 'course-performance-analytic-firebase-adminsdk-fbsvc-9d575fb1d3.json' is in the server directory."
else
    echo "✅ Firebase service account key file found."
fi

# Set environment variable for Google Application Credentials
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/course-performance-analytic-firebase-adminsdk-fbsvc-9d575fb1d3.json"
echo "🔧 Set GOOGLE_APPLICATION_CREDENTIALS environment variable"

# Test Python imports
echo "🧪 Testing Python imports..."
python3 -c "
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    print('✅ Firebase Admin SDK imported successfully')
except ImportError as e:
    print(f'❌ Import error: {e}')
    exit(1)
"

echo "🎉 Setup complete! You can now start the server with:"
echo "   python3 main.py"
echo ""
echo "🔗 Test endpoints:"
echo "   - GET /api/firebase/auth/v2/test-connection (Test Firebase connection)"
echo "   - GET /api/firebase/auth/v2/test-login (Get sample credentials)"
echo "   - POST /api/firebase/auth/v2/login (Login endpoint)"