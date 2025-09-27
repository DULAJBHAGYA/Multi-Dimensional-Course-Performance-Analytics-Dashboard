import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import AuthStatusIndicator from '../common/AuthStatusIndicator';

const AuthTestPanel = () => {
  const { user, login, logout, refreshUser, isAuthenticated } = useAuth();
  const { success, error, info } = useNotification();
  const [testCredentials, setTestCredentials] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTestCredentials();
  }, []);

  const loadTestCredentials = async () => {
    try {
      const { default: apiService } = await import('../../services/api');
      const response = await apiService.getTestCredentials();
      setTestCredentials(response);
    } catch (error) {
      console.error('Failed to load test credentials:', error);
    }
  };

  const testLogin = async (userType) => {
    if (!testCredentials) return;
    
    setLoading(true);
    const credentials = userType === 'instructor' 
      ? testCredentials.sample_instructor 
      : testCredentials.sample_admin;
    
    if (credentials) {
      const result = await login(credentials.email, credentials.password);
      if (result.success) {
        success(`Successfully logged in as ${userType}!`);
      } else {
        error(`Failed to login as ${userType}: ${result.error}`);
      }
    } else {
      error(`No test credentials available for ${userType}`);
    }
    setLoading(false);
  };

  const testLogout = async () => {
    setLoading(true);
    await logout();
    info('Logged out successfully');
    setLoading(false);
  };

  const testRefreshUser = async () => {
    setLoading(true);
    const result = await refreshUser();
    if (result.success) {
      success('User data refreshed successfully');
    } else {
      error('Failed to refresh user data');
    }
    setLoading(false);
  };

  const testNotifications = () => {
    success('This is a success notification');
    setTimeout(() => error('This is an error notification'), 1000);
    setTimeout(() => info('This is an info notification'), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Authentication Test Panel</h2>
      
      {/* Auth Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Authentication Status</h3>
        <AuthStatusIndicator />
        {user && (
          <div className="mt-3 text-sm text-gray-600">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Department:</strong> {user.department}</p>
            <p><strong>Campus:</strong> {user.campus}</p>
            {user.loginTime && (
              <p><strong>Login Time:</strong> {new Date(user.loginTime).toLocaleString()}</p>
            )}
          </div>
        )}
      </div>

      {/* Test Credentials */}
      {testCredentials && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Available Test Credentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testCredentials.sample_instructor && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium text-blue-900">Instructor Account</h4>
                <p className="text-sm text-gray-600">Email: {testCredentials.sample_instructor.email}</p>
                <p className="text-sm text-gray-600">Password: {testCredentials.sample_instructor.password}</p>
              </div>
            )}
            {testCredentials.sample_admin && (
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium text-blue-900">Admin Account</h4>
                <p className="text-sm text-gray-600">Email: {testCredentials.sample_admin.email}</p>
                <p className="text-sm text-gray-600">Password: {testCredentials.sample_admin.password}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Test Actions</h3>
        
        {!isAuthenticated ? (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => testLogin('instructor')}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Test Instructor Login'}
            </button>
            <button
              onClick={() => testLogin('admin')}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Test Admin Login'}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testLogout}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Test Logout'}
            </button>
            <button
              onClick={testRefreshUser}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh User Data'}
            </button>
          </div>
        )}
        
        <button
          onClick={testNotifications}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Test Notifications
        </button>
      </div>

      {/* API Endpoints */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Available API Endpoints</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Authentication</h4>
            <ul className="space-y-1 text-gray-600">
              <li>POST /api/firebase/auth/v2/login</li>
              <li>POST /api/firebase/auth/v2/logout</li>
              <li>GET /api/firebase/auth/v2/me</li>
              <li>GET /api/firebase/auth/v2/users</li>
              <li>GET /api/firebase/auth/v2/test-login</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Dashboard</h4>
            <ul className="space-y-1 text-gray-600">
              <li>GET /api/firebase/dashboard/instructor</li>
              <li>GET /api/firebase/dashboard/admin</li>
              <li>GET /api/firebase/dashboard/instructor/courses</li>
              <li>GET /api/firebase/dashboard/instructor/students</li>
              <li>GET /api/firebase/dashboard/instructor/assignments</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTestPanel;