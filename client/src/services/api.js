// API service for communicating with FastAPI backend
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';
    console.log('ApiService initialized with baseURL:', this.baseURL);
    console.log('VITE_API_URL from env:', import.meta.env.VITE_API_URL);
    this.refreshPromise = null;
    // Add caching for filter options
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
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

  // GET request with caching support
  async get(endpoint, params = {}) {
    console.log(`GET request to ${endpoint} with params:`, params);
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    const cacheKey = `${url}_${JSON.stringify(params)}`;
    
    // Check cache for filter options
    if (endpoint.includes('filter-options') && this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < this.cacheTimeout) {
        console.log('Returning cached data for', cacheKey);
        return data;
      } else {
        // Remove expired cache
        this.cache.delete(cacheKey);
      }
    }
    
    const result = await this.request(url, { method: 'GET' });
    
    // Cache filter options
    if (endpoint.includes('filter-options')) {
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
    }
    
    return result;
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
      // Clear cache on logout
      this.cache.clear();
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

  async getAdminCampusPerformance() {
    return this.get('/firebase/dashboard/admin/campus-performance');
  }

  async getAdminCampusPerformanceTrend() {
    return this.get('/firebase/dashboard/admin/campus-performance-trend');
  }

  async getAdminDepartmentMetrics() {
    return this.get('/firebase/dashboard/admin/department-metrics');
  }

  async getAdminDepartmentInstructors() {
    return this.get('/firebase/dashboard/admin/department-instructors');
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

  // New endpoint to get instructor unique courses count
  async getInstructorUniqueCoursesCount() {
    return this.get('/instructor/dashboard/instructor/unique-courses-count');
  }

  // New endpoint to get instructor courses with department information
  async getInstructorCoursesWithDepartments() {
    return this.get('/instructor/dashboard/instructor/courses-with-departments');
  }

  async getInstructorGradeDistribution() {
    return this.get('/instructor/courses/instructor/grade-distribution');
  }

  // New endpoint to get instructor section-based performance average
  async getInstructorSectionBasedPerformanceAverage() {
    return this.get('/instructor/courses/instructor/section-based-performance-average');
  }

  // New endpoint to get instructor pass rate
  async getInstructorPassRate() {
    return this.get('/instructor/courses/instructor/pass-rate');
  }

  // New endpoint to get instructor at-risk rate
  async getInstructorAtRiskRate() {
    const response = await this.get('/instructor/courses/instructor/at-risk-rate');
    // Handle both old and new response formats
    if (response.hasOwnProperty('at_risk_courses_count')) {
      return { at_risk_rate: response.at_risk_courses_count };
    }
    return response;
  }

  // New endpoint to get instructor course performance data
  async getInstructorCoursePerformance() {
    return this.get('/instructor/courses/instructor/course-performance');
  }

  // New endpoint to get instructor at-risk courses data
  async getInstructorAtRiskCourses() {
    return this.get('/instructor/courses/instructor/at-risk-courses');
  }

  // New endpoint to get instructor semester comparison data
  async getInstructorSemesterComparison() {
    return this.get('/instructor/courses/instructor/semester-comparison');
  }

  // New endpoint to get instructor course performance comparison data
  async getInstructorCoursePerformanceComparison() {
    return this.get('/instructor/courses/instructor/course-performance-comparison');
  }

  // New endpoint to get instructor pass rate comparison data
  async getInstructorPassRateComparison() {
    return this.get('/instructor/courses/instructor/pass-rate-comparison');
  }

  // New endpoint to get all CRNs for a specific instructor
  async getInstructorCRNs() {
    return this.get('/instructor/dashboard/instructor/crns');
  }

  // New endpoint to get instructor section count
  async getInstructorSectionCount() {
    return this.get('/instructor/courses/instructor/section-count');
  }

  // New endpoint to get instructor course count
  async getInstructorCourseCount() {
    return this.get('/instructor/courses/instructor/course-count');
  }

  // New endpoint to get instructor course pass-fail summary
  async getInstructorCoursePassFailSummary() {
    return this.get('/instructor/courses/instructor/course-pass-fail-summary');
  }

  // New endpoint to get instructor filter options
  async getInstructorFilterOptions() {
    return this.get('/instructor/dashboard/instructor/filter-options');
  }

  // New endpoint to get filtered performance data
  async getFilteredPerformance(courseCode = null, campus = null, semester = null, department = null) {
    const params = {};
    if (courseCode) params.course_code = courseCode;
    if (campus) params.campus = campus;
    if (semester) params.semester = semester;
    if (department) params.department = department;
    
    return this.get('/instructor/dashboard/instructor/filtered-performance', params);
  }

  // New endpoint to get all sections grades for bar chart
  async getAllSectionsGrades() {
    return this.get('/instructor/dashboard/instructor/all-sections-grades');
  }

  // Firebase Instructor Reports endpoints
  async getInstructorCoursePerformanceReport() {
    return this.get('/firebase/dashboard/instructor/reports/course-performance');
  }

  async getInstructorCoursePerformanceAnalysis() {
    return this.get('/firebase/dashboard/instructor/reports/course-performance-analysis');
  }

  async getInstructorStudentAnalysisReport(courseId) {
    const params = courseId ? { course_id: courseId } : {};
    return this.get('/firebase/dashboard/instructor/reports/student-analysis', params);
  }

  async getInstructorSemesterComparisonReport() {
    return this.get('/firebase/dashboard/instructor/reports/semester-comparison');
  }

  // New function for downloading admin reports
  async downloadAdminReport(reportType, format = 'pdf') {
    // Map report types to match backend expectations
    const reportTypeMap = {
      'users': 'user-analytics',
      'courses': 'course-analytics',
      'instructors': 'instructor-performance'
    };
    
    const mappedReportType = reportTypeMap[reportType] || reportType;
    
    return this.download('/admin/report/download-report', { 
      report_type: mappedReportType, 
      format: format 
    });
  }

  // Firebase Instructor Report Download endpoints
  async downloadInstructorReport(reportType, format = 'pdf', courseId = null) {
    let endpoint = '';
    const params = { format };
    
    switch (reportType) {
      case 'course-performance':
        endpoint = '/firebase/dashboard/instructor/reports/course-performance/download';
        break;
      case 'course-performance-analysis':
        endpoint = '/firebase/dashboard/instructor/reports/course-performance-analysis/download';
        break;
      case 'student-analysis':
        endpoint = '/firebase/dashboard/instructor/reports/student-analysis/download';
        if (courseId) params.course_id = courseId;
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

  // Firebase Department Head endpoints
  async getDepartmentHeadCourseCount() {
    return this.get('/firebase/dashboard/department-head/course-count');
  }

  async getDepartmentHeadInstructorCount() {
    return this.get('/firebase/dashboard/department-head/instructor-count');
  }

  async getDepartmentHeadAveragePerformance() {
    return this.get('/firebase/dashboard/department-head/average-performance');
  }

  async getDepartmentHeadAtRiskCoursesCount() {
    return this.get('/firebase/dashboard/department-head/at-risk-courses-count');
  }

  async getDepartmentHeadPendingApprovalsCount() {
    return this.get('/firebase/dashboard/department-head/pending-approvals-count');
  }

  async getDepartmentHeadPerformanceAnalytics() {
    return this.get('/firebase/dashboard/department-head/performance-analytics');
  }

  async getDepartmentHeadRiskAnalysis() {
    return this.get('/firebase/dashboard/department-head/risk-analysis');
  }

  async getDepartmentHeadTrendAnalysis() {
    return this.get('/firebase/dashboard/department-head/trend-analysis');
  }

  async getDepartmentHeadInstructorsList() {
    return this.get('/firebase/dashboard/department-head/instructors-list');
  }

  async getDepartmentHeadInstructorPerformanceAnalysis() {
    return this.get('/firebase/dashboard/department-head/instructor-performance-analysis');
  }

  // New endpoint to get instructor at-risk courses count
  async getInstructorAtRiskCoursesCount() {
    const response = await this.get('/instructor/courses/instructor/at-risk-rate');
    // Handle both old and new response formats
    if (response.hasOwnProperty('at_risk_courses_count')) {
      return { at_risk_rate: response.at_risk_courses_count };
    }
    return response;
  }

  // New endpoint to get instructor sections report
  async getInstructorSectionsReport() {
    return this.get('/instructor/report/sections');
  }

  // New endpoint to get department head unique courses count
  async getDepartmentHeadUniqueCoursesCount() {
    return this.get('/department-head/dashboard/department-head/unique-courses-count');
  }

  // New endpoint to get department head unique instructors count
  async getDepartmentHeadUniqueInstructorsCount() {
    return this.get('/department-head/dashboard/department-head/unique-instructors-count');
  }

  // New endpoint to get department head total sections count
  async getDepartmentHeadTotalSectionsCount() {
    return this.get('/department-head/dashboard/department-head/total-sections-count');
  }

  // New endpoint to get department head average grade
  async getDepartmentHeadAverageGrade() {
    return this.get('/department-head/dashboard/department-head/average-grade');
  }

  // New endpoint to get department head at-risk courses count
  async getDepartmentHeadAtRiskCoursesCount() {
    return this.get('/department-head/dashboard/department-head/at-risk-courses-count');
  }

  // New endpoint to get department head at-risk courses list
  async getDepartmentHeadAtRiskCourses() {
    return this.get('/department-head/dashboard/department-head/at-risk-courses');
  }

  // New endpoint to get department head instructor comparison
  async getDepartmentHeadInstructorComparison(instructor1Id, instructor2Id, courseCode = null) {
    const params = {
      instructor1_id: instructor1Id,
      instructor2_id: instructor2Id
    };
    
    if (courseCode) {
      params.course_code = courseCode;
    }
    
    return this.get('/department-head/dashboard/department-head/instructor-comparison', params);
  }

  // New endpoint to get department head instructor options
  async getDepartmentHeadInstructorOptions() {
    return this.get('/department-head/dashboard/department-head/instructor-options');
  }

  // New endpoint to get department head performance trends
  async getDepartmentHeadPerformanceTrends() {
    return this.get('/department-head/dashboard/department-head/performance-trends');
  }

  // New endpoint to get department head course options
  async getDepartmentHeadCourseOptions() {
    return this.get('/department-head/dashboard/department-head/course-options');
  }

  // New endpoint to get department head grade trends
  async getDepartmentHeadGradeTrends() {
    return this.get('/department-head/dashboard/department-head/grade-trends');
  }

  // New endpoint to get all instructors performance in department
  async getDepartmentHeadAllInstructorsPerformance() {
    return this.get('/department-head/dashboard/department-head/all-instructors-performance');
  }

  async getAdminCampusGradeDistribution() {
    return this.get('/firebase/dashboard/admin/campus-grade-distribution');
  }

  async getAdminCampusCoursePerformance() {
    return this.get('/firebase/dashboard/admin/campus-course-performance');
  }

  async getAdminCampusUserDetails() {
    return this.get('/admin/report/campus-user-details');
  }

  async getAdminInstructorPerformance(timeRange = '30d') {
    return this.get('/admin/report/instructor-performance', { time_range: timeRange });
  }

  // New endpoint for admin predictions
  async getAdminPredictions() {
    return this.get('/admin/predict/campus-performance');
  }

}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;