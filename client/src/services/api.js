// API service for communicating with FastAPI backend
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';
    console.log('ApiService initialized with baseURL:', this.baseURL);
    console.log('VITE_API_URL from env:', import.meta.env.VITE_API_URL);
    this.refreshPromise = null;
  }

  // Generic request method with enhanced error handling and token refresh
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`API Request to ${url}`, options);
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
      
      console.log(`API Response for ${url}:`, response.status, response.statusText);
      
      // Handle token expiration
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request with new token
          config.headers.Authorization = `Bearer ${this.getToken()}`;
          const retryResponse = await fetch(url, config);
          console.log(`API Retry Response for ${url}:`, retryResponse.status, retryResponse.statusText);
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
    console.log(`GET request to ${endpoint} with params:`, params);
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

  async getCampuses() {
    return this.get('/firebase/auth/v2/campuses');
  }

  async getDepartments() {
    return this.get('/firebase/auth/v2/departments');
  }

  async createUser(userData) {
    return this.post('/firebase/auth/v2/users', userData);
  }

  async updateUser(userId, userData) {
    return this.put(`/firebase/auth/v2/users/${userId}`, userData);
  }

  async deleteUser(userId) {
    return this.delete(`/firebase/auth/v2/users/${userId}`);
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

  async getAdminPlatformMetrics() {
    return this.get('/firebase/dashboard/admin/metrics');
  }

  async getAdminCoursePopularity() {
    return this.get('/firebase/dashboard/admin/course-popularity');
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

  // New endpoints for CRN comparison and semester performance
  async getInstructorCrnComparison(crn1, crn2) {
    return this.get('/firebase/dashboard/instructor/crn-comparison', { crn1, crn2 });
  }

  async getInstructorSemesterPerformance() {
    return this.get('/firebase/dashboard/instructor/semester-performance');
  }

  // New instructor dashboard endpoints
  async getInstructorKPIs() {
    return this.get('/instructor/dashboard/instructor/kpis');
  }

  async getInstructorFilters() {
    return this.get('/instructor/dashboard/instructor/filters');
  }

  async getInstructorCRNComparison(crn1, crn2) {
    return this.get('/instructor/dashboard/instructor/crn-comparison', { crn1, crn2 });
  }

  async getInstructorPerformanceTrend() {
    return this.get('/instructor/dashboard/instructor/performance-trend');
  }

  async getInstructorCourseOverviews() {
    return this.get('/instructor/dashboard/instructor/course-overviews');
  }

  async getInstructorStudentCount() {
    console.log('Calling getInstructorStudentCount API...');
    const result = await this.get('/instructor/dashboard/instructor/student-count');
    console.log('getInstructorStudentCount API result:', result);
    return result;
  }

  // Firebase Instructor Reports endpoints
  async getInstructorCoursePerformanceReport() {
    return this.get('/firebase/dashboard/instructor/reports/course-performance');
  }

  async getInstructorStudentAnalyticsReport(courseId) {
    const params = courseId ? { course_id: courseId } : {};
    return this.get('/firebase/dashboard/instructor/reports/student-analytics', params);
  }

  async getInstructorPredictiveRiskReport() {
    return this.get('/firebase/dashboard/instructor/reports/predictive-risk');
  }

  async getInstructorSemesterComparisonReport() {
    return this.get('/firebase/dashboard/instructor/reports/semester-comparison');
  }

  async getInstructorDetailedAssessmentReport(courseId) {
    const params = courseId ? { course_id: courseId } : {};
    return this.get('/firebase/dashboard/instructor/reports/detailed-assessment', params);
  }

  // Firebase Instructor Report Download endpoints
  async downloadInstructorReport(reportType, format = 'pdf', courseId = null) {
    let endpoint = '';
    const params = { format };
    
    switch (reportType) {
      case 'course-performance':
        endpoint = '/firebase/dashboard/instructor/reports/course-performance/download';
        break;
      case 'student-analytics':
        endpoint = '/firebase/dashboard/instructor/reports/student-analytics/download';
        if (courseId) params.course_id = courseId;
        break;
      case 'predictive-risk':
        endpoint = '/firebase/dashboard/instructor/reports/predictive-risk/download';
        break;
      case 'semester-comparison':
        endpoint = '/firebase/dashboard/instructor/reports/semester-comparison/download';
        break;
      case 'detailed-assessment':
        endpoint = '/firebase/dashboard/instructor/reports/detailed-assessment/download';
        if (courseId) params.course_id = courseId;
        break;
      default:
        throw new Error('Unknown report type');
    }
    
    return this.download(endpoint, params);
  }

  // Download method that returns blob
  async download(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${this.baseURL}${endpoint}?${queryString}` : `${this.baseURL}${endpoint}`;
    
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response;
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
