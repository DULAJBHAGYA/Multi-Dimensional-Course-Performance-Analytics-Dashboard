# Multi-Dimensional Course Performance Analytics Dashboard

A comprehensive analytics dashboard for tracking course performance across multiple dimensions including students, instructors, courses, and campuses. Built with React.js frontend and FastAPI backend with Firebase integration.

## Features

### Frontend (React.js)
- **Interactive Dashboards**: Real-time analytics with Chart.js visualizations
- **User Management**: Admin panel for managing users, roles, and permissions
- **Course Analytics**: Detailed course performance tracking and insights
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Authentication**: Secure login system with role-based access control
- **Data Visualization**: Bar charts, line charts, pie charts with custom styling

### Backend (FastAPI + Firebase)
- **RESTful API**: FastAPI-based backend with comprehensive endpoints
- **Firebase Integration**: Firestore database for scalable data storage
- **Authentication**: JWT-based authentication system
- **Real-time Data**: Firebase real-time database capabilities
- **Analytics Processing**: Advanced data processing and aggregation

## 📋 Prerequisites

Before setting up this project, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://python.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Firebase Account** - [Sign up here](https://firebase.google.com/)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Multi-Dimensional-Course-Performance-Analytics-Dashboard.git
cd Multi-Dimensional-Course-Performance-Analytics-Dashboard
```

### 2. Frontend Setup (React.js)

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Backend Setup (FastAPI + Firebase)

#### Step 1: Create Python Virtual Environment

```bash
# Navigate to server directory
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### Step 2: Install Python Dependencies

```bash
# Install required packages
pip install -r requirements.txt
```

#### Step 3: Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" or "Create a project"
   - Project Name: `Course-Analytics-Dashboard` (or your preferred name)
   - Choose location: `us-central1` (recommended)
   - Click "Create project"

2. **Enable Firestore Database**:
   - In Firebase Console, go to "Firestore Database"
   - Click "Create database"
   - Select "Start in test mode" (for development)
   - Choose location: `us-central1`
   - Click "Enable"

3. **Create Service Account**:
   - Go to "Project settings" → "Service accounts"
   - Click "Manage service account permissions"
   - In Google Cloud Console, go to "IAM & Admin" → "Service Accounts"
   - Click "+ CREATE SERVICE ACCOUNT"
   - Name: `firebase-admin-sdk`
   - Role: `Firebase Admin SDK Administrator Service Agent`
   - Click "DONE"

4. **Generate Service Account Key**:
   - Click on the service account email
   - Go to "Keys" tab
   - Click "ADD KEY" → "Create new key"
   - Select "JSON" format
   - Download the JSON file
   - Rename it to `firebase-service-account.json`
   - Move it to the `server` directory

#### Step 4: Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env file with your Firebase credentials
nano .env  # or use your preferred editor
```

**Update `.env` file with your Firebase credentials:**

```env
# FastAPI Configuration
APP_NAME="Course Analytics API"
DEBUG=True

# Database Configuration
DATABASE_URL="sqlite:///./sql_app.db"

# JWT Secret
SECRET_KEY="your-long-random-secret-key-for-jwt"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Firebase Configuration
FIREBASE_PROJECT_ID="your-project-id-from-json"
FIREBASE_PRIVATE_KEY_ID="your-private-key-id-from-json"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_ACTUAL_PRIVATE_KEY_WITH_ESCAPED_NEWLINES\\n-----END PRIVATE KEY-----\\n"
FIREBASE_CLIENT_EMAIL="your-client-email-from-json"
FIREBASE_CLIENT_ID="your-client-id-from-json"
FIREBASE_CLIENT_X509_CERT_URL="your-client-x509-cert-url-from-json"
```

**Important**: Replace `\\n` with actual newlines in the `FIREBASE_PRIVATE_KEY` when copying from the JSON file.

#### Step 5: Start Backend Server

```bash
# Make sure virtual environment is activated
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate     # On Windows

# Start FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be available at `http://localhost:8000`

### 4. Verify Installation

1. **Frontend**: Open `http://localhost:5173` in your browser
2. **Backend**: Open `http://localhost:8000/docs` for API documentation
3. **Firebase**: Check Firebase Console for data collections

## 📁 Project Structure

```
Multi-Dimensional-Course-Performance-Analytics-Dashboard/
├── client/                          # React.js Frontend
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   └── common/             # Common components (Sidebar, Layout, etc.)
│   │   ├── pages/                  # Page components
│   │   │   ├── admin/              # Admin-specific pages
│   │   │   ├── dashboard/          # Dashboard pages
│   │   │   └── courseAnalytics/    # Course analytics pages
│   │   ├── context/                # React Context (Auth, etc.)
│   │   ├── data/                   # Mock data and data processing
│   │   ├── utils/                  # Utility functions (Chart.js helpers)
│   │   └── index.css               # Global styles
│   ├── package.json
│   └── vite.config.js
├── server/                          # FastAPI Backend
│   ├── app/
│   │   ├── models/                 # Database models
│   │   ├── routes/                 # API routes
│   │   ├── services/               # Business logic
│   │   └── firebase_config.py      # Firebase configuration
│   ├── main.py                     # FastAPI application entry point
│   ├── requirements.txt            # Python dependencies
│   ├── env.example                 # Environment variables template
│   └── firebase-service-account.json # Firebase credentials (not in repo)
├── README.md
└── FIREBASE_SETUP.md              # Detailed Firebase setup guide
```

## Configuration

### Frontend Configuration
- **Port**: 5173 (Vite default)
- **API Base URL**: `http://localhost:8000`
- **Chart Library**: Chart.js with react-chartjs-2
- **Styling**: Tailwind CSS with custom color scheme

### Backend Configuration
- **Port**: 8000
- **Database**: Firebase Firestore
- **Authentication**: JWT tokens
- **CORS**: Enabled for frontend communication

## Customization

### Color Scheme
The project uses a custom purple color scheme:
- **Primary**: `#6e63e5`
- **Secondary**: `#4c46a0`
- **Light**: `#D3CEFC`
- **Background**: `#f0f0ff`

### Chart Styling
All charts use Chart.js with custom styling:
- Rounded corners (`borderRadius: 12`)
- Alternating colors for bar charts
- Custom tooltips and legends
- Responsive design

## Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy the 'dist' folder
```

### Backend Deployment (Railway/Heroku)
```bash
cd server
# Set environment variables in your deployment platform
# Deploy the server directory
```

### Firebase Production Setup
1. Update Firebase security rules for production
2. Enable Firebase Authentication if needed
3. Set up proper user roles and permissions

## Data Structure

The dashboard works with the following data entities:
- **Users**: Instructors and Admins with roles and permissions
- **Courses**: Course information with performance metrics
- **Campuses**: Multiple campus locations
- **Analytics**: Performance data and insights

## Security

- JWT-based authentication
- Role-based access control
- Firebase security rules
- CORS configuration
- Environment variable protection

## Troubleshooting

### Common Issues

1. **Firebase Connection Error**:
   - Check your `.env` file configuration
   - Verify service account JSON file is in the correct location
   - Ensure Firebase project is properly set up

2. **Port Already in Use**:
   - Change ports in configuration files
   - Kill existing processes using the ports

3. **Python Dependencies Issues**:
   - Ensure Python 3.8+ is installed
   - Use virtual environment
   - Update pip: `pip install --upgrade pip`

4. **Node.js Dependencies Issues**:
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

## License

This project is licensed under the MIT License - see the LICENSE file for details.

