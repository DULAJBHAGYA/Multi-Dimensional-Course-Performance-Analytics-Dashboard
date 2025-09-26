// API service for communicating with FastAPI backend
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
    return this.post('/firebase/auth/v2/login', { email, password });
  }

  async logout() {
    return this.post('/firebase/auth/v2/logout');
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
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
