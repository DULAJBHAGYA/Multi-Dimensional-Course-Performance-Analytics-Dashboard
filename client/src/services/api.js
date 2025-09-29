// API service for communicating with FastAPI backend
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';
    this.refreshPromise = null;
  }

  // Generic request method with enhanced error handling and token refresh
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    let config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Handle token expiration
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request with new token
          config.headers.Authorization = `Bearer ${this.getToken()}`;
          const retryResponse = await fetch(url, config);
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          return await retryResponse.json();
        } else {
          // Refresh failed, redirect to login
          this.handleAuthFailure();
          throw new Error('Authentication failed');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Firebase Authentication endpoints
  async login(email, password) {
    const response = await this.post('/firebase/auth/v2/login', { email, password });
    if (response.access_token) {
      this.setToken(response.access_token);
      this.setUser(response.user);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/firebase/auth/v2/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.clearAuth();
    }
  }

  async getCurrentUser() {
    return this.get('/firebase/auth/v2/me');
  }

  async getAllUsers() {
    return this.get('/firebase/auth/v2/users');
  }

  async getTestCredentials() {
    return this.get('/firebase/auth/v2/test-login');
  }

  // Firebase Dashboard endpoints
  async getInstructorDashboard() {
    return this.get('/firebase/dashboard/instructor');
  }

  async getAdminDashboard() {
    return this.get('/firebase/dashboard/admin');
  }

  async getInstructorCourses() {
    return this.get('/firebase/dashboard/instructor/courses');
  }

  async getInstructorStudents() {
    return this.get('/firebase/dashboard/instructor/students');
  }

  async getInstructorAssignments() {
    return this.get('/firebase/dashboard/instructor/assignments');
  }

  async getInstructorAnnouncements() {
    return this.get('/firebase/dashboard/instructor/announcements');
  }

  // Firebase Course Analytics endpoint
  async getInstructorCourseAnalytics(filters = {}) {
    return this.get('/firebase/dashboard/instructor/analytics', filters);
  }

  // Legacy endpoints (keeping for backward compatibility)
  async getCourseAnalytics(filters = {}) {
    return this.get('/analytics/courses', filters);
  }

  async getCoursePerformance(courseId) {
    return this.get(`/analytics/courses/${courseId}/performance`);
  }

  async getStudentAnalytics(filters = {}) {
    return this.get('/analytics/students', filters);
  }

  async getStudentPerformance(studentId) {
    return this.get(`/analytics/students/${studentId}/performance`);
  }

  async getPredictiveInsights(filters = {}) {
    return this.get('/analytics/predictive', filters);
  }

  async getRiskAssessment(studentId) {
    return this.get(`/analytics/predictive/risk/${studentId}`);
  }

  async generateReport(reportType, filters = {}) {
    return this.post('/reports/generate', { reportType, filters });
  }

  async getReportHistory() {
    return this.get('/reports/history');
  }

  async getUsers() {
    return this.get('/admin/users');
  }

  async createUser(userData) {
    return this.post('/admin/users', userData);
  }

  async updateUser(userId, userData) {
    return this.put(`/admin/users/${userId}`, userData);
  }

  async deleteUser(userId) {
    return this.delete(`/admin/users/${userId}`);
  }

  // Token and authentication management
  getToken() {
    return localStorage.getItem('authToken');
  }

  setToken(token) {
    localStorage.setItem('authToken', token);
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearAuth() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  async refreshToken() {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  async _performTokenRefresh() {
    try {
      // For Firebase Auth, we would typically use the refresh token
      // For now, we'll check if the current user is still valid
      const user = this.getUser();
      if (!user) return false;

      // Try to get current user info to validate token
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        return true; // Token is still valid
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  handleAuthFailure() {
    this.clearAuth();
    // Redirect to login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
