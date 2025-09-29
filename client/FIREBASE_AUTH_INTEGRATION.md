# Firebase Authentication Integration

This document provides a comprehensive overview of the Firebase authentication system integrated into the Multi-Dimensional Course Performance Analytics Dashboard.

## 🚀 Features

### Authentication & Security
- **JWT Token-based Authentication** with automatic token refresh
- **Role-based Access Control** (Admin, Instructor, Student)
- **Session Management** with expiration warnings
- **Secure Token Storage** with automatic cleanup
- **Password Validation** and strength checking
- **Email Validation** and formatting

### User Management
- **User Profile Management** with editable information
- **User Session Tracking** with login time and duration
- **Automatic User Data Refresh** to keep information current
- **Multiple User Role Support** with different permissions

### User Experience
- **Real-time Notifications** for auth events
- **Session Expiration Warnings** with extension options
- **Loading States** for all authentication operations
- **Error Handling** with user-friendly messages
- **Test Credentials** for easy development testing

## 📁 File Structure

```
client/src/
├── components/common/
│   ├── AuthStatusIndicator.jsx    # Shows current auth status
│   ├── AuthTestPanel.jsx          # Development testing panel
│   ├── SessionManager.jsx         # Handles session expiration
│   ├── UserProfile.jsx           # User profile management
│   ├── ProtectedRoute.jsx        # Route protection
│   ├── Sidebar.jsx               # Navigation with user info
│   ├── DashboardLayout.jsx       # Layout with auth features
│   └── LogoutModal.jsx           # Logout confirmation
├── context/
│   ├── AuthContext.jsx           # Main auth state management
│   └── NotificationContext.jsx   # Notification system
├── hooks/
│   └── useAuth.js                # Enhanced auth hooks
├── services/
│   └── api.js                    # API service with auth
├── utils/
│   └── authUtils.js              # Auth utility functions
└── pages/auth/
    └── Login.jsx                 # Login page with test credentials
```

## 🔧 API Integration

### Authentication Endpoints
- `POST /api/firebase/auth/v2/login` - User login with email/password
- `POST /api/firebase/auth/v2/logout` - User logout
- `GET /api/firebase/auth/v2/me` - Get current user info
- `GET /api/firebase/auth/v2/users` - Get all users (admin only)
- `GET /api/firebase/auth/v2/test-login` - Get test credentials

### Dashboard Endpoints
- `GET /api/firebase/dashboard/instructor` - Instructor dashboard data
- `GET /api/firebase/dashboard/admin` - Admin dashboard data
- `GET /api/firebase/dashboard/instructor/courses` - Instructor courses
- `GET /api/firebase/dashboard/instructor/students` - Instructor students
- `GET /api/firebase/dashboard/instructor/assignments` - Instructor assignments

## 🛠️ Setup & Configuration

### 1. Environment Variables
Create a `.env` file in the client directory:
```env
VITE_API_URL=http://localhost:8000/api
```

### 2. Firebase Configuration
The system connects to Firebase through the backend API. Ensure your server is configured with:
- Firebase Admin SDK credentials
- Firestore database setup
- Proper CORS configuration

### 3. Installation
```bash
cd client
npm install
```

## 🎯 Usage Examples

### Basic Authentication
```jsx
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginComponent />;
  }
  
  return <UserDashboard user={user} />;
}
```

### Role-based Access Control
```jsx
import { useAuthExtended } from './hooks/useAuth';

function AdminPanel() {
  const { requireRole } = useAuthExtended();
  
  useEffect(() => {
    requireRole('admin'); // Redirects if not admin
  }, []);
  
  return <AdminContent />;
}
```

### Permission Checking
```jsx
import { hasPermission } from './utils/authUtils';

function FeatureButton({ user }) {
  if (!hasPermission(user.role, 'manage_users')) {
    return null;
  }
  
  return <ManageUsersButton />;
}
```

### Notifications
```jsx
import { useNotification } from './context/NotificationContext';

function MyComponent() {
  const { success, error, info } = useNotification();
  
  const handleAction = async () => {
    try {
      await someAsyncOperation();
      success('Operation completed successfully!');
    } catch (err) {
      error('Operation failed: ' + err.message);
    }
  };
}
```

## 🔐 Security Features

### Token Management
- Automatic token refresh on API calls
- Secure token storage in localStorage
- Token expiration handling
- Automatic logout on token failure

### Session Security
- Session duration tracking
- Automatic session extension
- Warning notifications before expiration
- Secure logout with cleanup

### Role-based Permissions
```javascript
// Defined in utils/authUtils.js
const permissions = {
  admin: [
    'manage_users', 'view_all_analytics', 'manage_courses',
    'manage_system', 'view_reports', 'manage_settings'
  ],
  instructor: [
    'view_own_analytics', 'manage_own_courses', 'view_students',
    'create_assignments', 'view_reports'
  ],
  student: [
    'view_own_progress', 'submit_assignments', 'view_grades'
  ]
};
```

## 🧪 Testing

### Test Credentials
The system provides automatic test credential loading for development:
- Instructor account with sample data
- Admin account with full permissions
- Automatic credential population in login form

### Auth Test Panel
Use the `AuthTestPanel` component for comprehensive testing:
```jsx
import AuthTestPanel from './components/common/AuthTestPanel';

// Include in development builds
{process.env.NODE_ENV === 'development' && <AuthTestPanel />}
```

### Testing Features
- Login/logout functionality
- Token refresh mechanisms
- Permission checking
- Notification system
- Session management

## 📱 Components Usage

### Protected Routes
```jsx
<Route 
  path="/admin" 
  element={
    <ProtectedRoute>
      <AdminPanel />
    </ProtectedRoute>
  } 
/>
```

### User Profile
```jsx
import UserProfile from './components/common/UserProfile';

function Sidebar() {
  const [showProfile, setShowProfile] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowProfile(true)}>
        Edit Profile
      </button>
      <UserProfile 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </>
  );
}
```

### Session Manager
Automatically included in App.jsx - handles session warnings and expiration.

## 🔄 State Management

### AuthContext Structure
```javascript
{
  user: {
    id: string,
    name: string,
    email: string,
    role: 'admin' | 'instructor' | 'student',
    department: string,
    campus: string,
    loginTime: string,
    token: string
  },
  loading: boolean,
  error: string | null,
  isAuthenticated: boolean,
  // Methods
  login: (email, password) => Promise,
  logout: () => Promise,
  updateUser: (userData) => void,
  refreshUser: () => Promise,
  clearError: () => void
}
```

## 🚨 Error Handling

### API Errors
- Network connection issues
- Authentication failures
- Authorization errors
- Token expiration
- Server errors

### User-Friendly Messages
- Clear error descriptions
- Actionable error messages
- Automatic error recovery
- Fallback UI states

## 🎨 UI/UX Features

### Loading States
- Login form loading spinner
- API request indicators
- Component-level loading states
- Skeleton screens where appropriate

### Notifications
- Success notifications for positive actions
- Error notifications with clear descriptions
- Info notifications for neutral updates
- Warning notifications for attention items

### Visual Feedback
- Auth status indicators
- Session time remaining
- User avatar with initials
- Role-based UI elements

## 🔧 Customization

### Extending Permissions
Add new permissions to `utils/authUtils.js`:
```javascript
const permissions = {
  admin: [...existing, 'new_permission'],
  instructor: [...existing, 'instructor_permission']
};
```

### Adding New User Roles
1. Update `permissions` object in `authUtils.js`
2. Add role-specific routes in navigation
3. Update API endpoints to handle new role
4. Add role-specific dashboard components

### Custom Notifications
```jsx
const { addNotification } = useNotification();

addNotification({
  type: 'custom',
  title: 'Custom Title',
  message: 'Custom message',
  duration: 10000, // 10 seconds
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Login fails with valid credentials**
   - Check API URL in environment variables
   - Verify server is running on correct port
   - Check browser console for CORS errors

2. **Token refresh not working**
   - Verify API endpoint is available
   - Check localStorage for token presence
   - Ensure proper error handling in API service

3. **Notifications not showing**
   - Verify NotificationProvider wraps the app
   - Check for console errors in notification context
   - Ensure proper import of notification hooks

4. **Session warnings not appearing**
   - Check user.loginTime is being set correctly
   - Verify SessionManager is included in ProtectedRoute.jsx
   - Check localStorage for user data persistence

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('authDebug', 'true');
```

## 📈 Performance Considerations

### Optimization Features
- Lazy loading of auth components
- Memoized auth state calculations
- Efficient token refresh logic
- Minimal re-renders on auth state changes

### Best Practices
- Use `useAuthExtended` only when needed
- Implement proper cleanup in useEffect hooks
- Avoid unnecessary API calls
- Cache user permissions when possible

## 🔄 Migration Guide

### From Legacy Auth
1. Replace old auth context with new AuthProvider
2. Update component imports to use new auth hooks
3. Replace old API calls with new service methods
4. Update route protection to use new ProtectedRoute

### Breaking Changes
- Auth context structure has changed
- New notification system required
- Enhanced error handling needed
- Session management is now automatic

This comprehensive Firebase authentication integration provides a robust, secure, and user-friendly authentication system for the course performance analytics dashboard.