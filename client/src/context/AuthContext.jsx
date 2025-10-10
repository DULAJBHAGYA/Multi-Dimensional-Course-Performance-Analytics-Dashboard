import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotification } from './NotificationContext';

const AuthContext = createContext();

// Export the context for use in other components
export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { success, error: notifyError, info } = useNotification();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check if user is logged in on app load
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('authToken');
      
      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Instead of importing apiService which might cause circular dependency,
          // we'll make a direct fetch request to validate the token
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/firebase/auth/v2/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            setUser(userData);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.error('Error validating stored auth:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Make direct fetch request instead of importing apiService
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/firebase/auth/v2/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.access_token) {
        const userData = {
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          id: data.user.id,
          token: data.access_token,
          campus: data.user.campus,
          department: data.user.department,
          username: data.user.username,
          students: data.user.students,
          loginTime: new Date().toISOString()
        };
        
        console.log('Setting user data:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', data.access_token);
        console.log('User set in context and localStorage');
        
        // Show success notification
        success(`Welcome back, ${userData.name}!`, 'Login Successful');
        
        return { success: true, user: userData };
      } else {
        const errorMsg = data.detail || 'Login failed';
        setError(errorMsg);
        notifyError(errorMsg, 'Login Failed');
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.message || 'Login failed. Please try again.';
      setError(errorMsg);
      notifyError(errorMsg, 'Login Error');
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Make direct fetch request instead of importing apiService
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/firebase/auth/v2/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      setLoading(false);
      
      // Show logout notification
      info('You have been logged out successfully', 'Logged Out');
    }
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const clearError = () => {
    setError(null);
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/firebase/auth/v2/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const currentUser = await response.json();
        const updatedUser = { ...user, ...currentUser };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      return { success: false, error: 'Failed to refresh user data' };
    } catch (error) {
      console.error('Refresh user error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    refreshUser,
    clearError,
    loading,
    error,
    isAuthenticated: !!user
  };

  console.log('AuthProvider rendering with value:', value);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Enhanced auth hook with additional utilities
export const useAuthExtended = () => {
  const auth = useAuth();
  
  // Define role-based permissions
  const permissions = {
    admin: [
      'manage_users',
      'view_all_analytics', 
      'manage_courses',
      'manage_system',
      'view_reports',
      'manage_settings'
    ],
    instructor: [
      'view_own_analytics',
      'manage_own_courses',
      'view_students', 
      'create_assignments',
      'view_reports'
    ],
    student: [
      'view_own_progress',
      'submit_assignments',
      'view_grades'
    ],
    department_head: [
      'view_department_analytics',
      'view_instructor_performance',
      'view_predictive_insights',
      'manage_department_courses',
      'approve_course_materials',
      'view_reports'
    ]
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!auth.user) return false;
    const userPermissions = permissions[auth.user.role] || [];
    return userPermissions.includes(permission);
  };

  // Get user's dashboard route based on role
  const getDashboardRoute = () => {
    if (!auth.user) return '/login';
    
    switch (auth.user.role) {
      case 'admin':
        return '/admin-dashboard';
      case 'instructor':
        return '/dashboard';
      case 'department_head':
        return '/department-head-dashboard';
      case 'student':
        return '/student-dashboard';
      default:
        return '/dashboard';
    }
  };

  // Format user display name
  const getDisplayName = () => {
    if (!auth.user) return 'User';
    return auth.user.name || auth.user.username || auth.user.email?.split('@')[0] || 'User';
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Check if user session is close to expiry
  const isSessionExpiring = () => {
    if (!auth.user?.loginTime) return false;
    
    const loginTime = new Date(auth.user.loginTime);
    const now = new Date();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    const expiryTime = new Date(loginTime.getTime() + sessionDuration);
    const warningTime = 30 * 60 * 1000; // 30 minutes before expiry
    
    return (expiryTime.getTime() - now.getTime()) < warningTime;
  };

  return {
    ...auth,
    hasPermission,
    getDashboardRoute,
    getDisplayName,
    getUserInitials,
    isSessionExpiring
  };
};