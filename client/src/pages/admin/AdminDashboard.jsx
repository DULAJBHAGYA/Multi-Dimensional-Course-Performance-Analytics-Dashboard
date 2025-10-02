import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { generateBarChartData, generateLineChartData, generatePieChartData, getChartOptions } from '../../utils/chartUtils';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedInstructor, setSelectedInstructor] = useState('all');
  const [selectedCampus, setSelectedCampus] = useState('all');
  // REMOVED: selectedCRN state as CRN filter is removed
  const [dashboardData, setDashboardData] = useState(null);
  const [departmentMetrics, setDepartmentMetrics] = useState(null); // New state for department metrics
  const [filterOptions, setFilterOptions] = useState({
    semesters: [],
    courses: [],
    instructors: [],
    departments: [],
    campuses: []
    // REMOVED: crns from filterOptions state
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized debounce function
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Fetch dashboard data with error handling and loading states
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard data, filter options, and department metrics in parallel with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const [dashboardResult, filterOptionsResult, departmentMetricsResult, departmentInstructorsResult] = await Promise.all([
          apiService.getAdminDashboard(),
          apiService.getAdminFilterOptions(),
          apiService.getAdminDepartmentMetrics(),
          apiService.getAdminDepartmentInstructors()
        ]);
        
        clearTimeout(timeoutId);
        setDashboardData(dashboardResult);
        setFilterOptions(filterOptionsResult);
        
        // Use the campus-specific instructor count while keeping other metrics
        setDepartmentMetrics({
          ...departmentMetricsResult,
          totalInstructors: departmentInstructorsResult?.totalInstructors || 0
        });
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw err;
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError(err.message || 'Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle filter changes with debounce
  const handleFilterChange = useCallback(debounce((filterType, value) => {
    switch (filterType) {
      case 'semester':
        setSelectedSemester(value);
        break;
      case 'course':
        setSelectedCourse(value);
        break;
      case 'department':
        setSelectedDepartment(value);
        break;
      case 'instructor':
        setSelectedInstructor(value);
        break;
      case 'campus':
        setSelectedCampus(value);
        break;
      // REMOVED: CRN filter case
      default:
        break;
    }
  }, 300), [debounce]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#6e63e5]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-[#6e63e5] text-white rounded-xl hover:bg-[#4c46a0] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Use department-specific data from the new API
  const adminKPIs = departmentMetrics ? {
    totalStudents: departmentMetrics.totalStudents || 0,
    totalCourses: departmentMetrics.totalCourses || 0,
    totalInstructors: departmentMetrics.totalInstructors || 0
  } : {
    totalStudents: 0,
    totalCourses: 0,
    totalInstructors: 0
  };
  console.log('Processed adminKPIs:', adminKPIs);

  // Debug logging to see what data is being received
  console.log('Department Metrics Data:', departmentMetrics);
  console.log('Admin KPIs:', adminKPIs);

  // Performance over time data
  const performanceOverTime = [
    { semester: 'Fall 2022', passRate: 72.3, gpa: 3.2, students: 1100 },
    { semester: 'Spring 2023', passRate: 75.1, gpa: 3.3, students: 1150 },
    { semester: 'Fall 2023', passRate: 76.8, gpa: 3.4, students: 1200 },
    { semester: 'Spring 2024', passRate: 78.5, gpa: 3.5, students: 1247 }
  ];

  // Course distribution data from Firebase
  const courseDistribution = dashboardData?.courses?.map(course => ({
    courseType: course.courseName || course.name,
    averagePerformance: course.average_performance || 0,
    totalCourses: 1,
    students: course.total_students || 0
  })) || [];

  // Campus performance comparison from Firebase
  const campusPerformance = dashboardData?.campuses?.map(campus => ({
    campus: campus.campusName || campus.name,
    passRate: campus.average_performance || 0,
    students: campus.total_students || 0,
    courses: campus.total_courses || 0,
    instructors: campus.total_instructors || 0
  })) || [];

  // Student grade distribution
  const gradeDistribution = [
    { grade: 'A+', count: 156, percentage: 12.5 },
    { grade: 'A', count: 234, percentage: 18.8 },
    { grade: 'A-', count: 198, percentage: 15.9 },
    { grade: 'B+', count: 187, percentage: 15.0 },
    { grade: 'B', count: 165, percentage: 13.2 },
    { grade: 'B-', count: 142, percentage: 11.4 },
    { grade: 'C+', count: 98, percentage: 7.9 },
    { grade: 'C', count: 67, percentage: 5.4 },
    { grade: 'D', count: 0, percentage: 0.0 },
    { grade: 'F', count: 0, percentage: 0.0 }
  ];

  // Chart data using Chart.js format
  const performanceOverTimeChartData = generateLineChartData(performanceOverTime, 'semester', 'passRate', 'Pass Rate');
  const courseDistributionChartData = generateBarChartData(courseDistribution, 'courseType', 'averagePerformance', 'Average Performance');
  const campusPerformanceChartData = generateBarChartData(campusPerformance, 'campus', 'passRate', 'Pass Rate');
  const gradeDistributionChartData = generatePieChartData(gradeDistribution, 'grade', 'count');

  // AI Predictive Insights
  const aiPredictions = {
    nextSemesterProjection: 80.2,
    atRiskStudentsNextSemester: 142,
    expectedEnrollment: 1280,
    recommendedInterventions: [
      'Focus on Mathematics courses - 15% improvement potential',
      'Implement additional tutoring for Engineering students',
      'Consider course restructuring for Business programs'
    ]
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 flex items-center">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">System overview, analytics, and administrative insights</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Overview Content - FILTERING OPTIONS BELOW KPI CARDS */}
        <div className="space-y-8">
          {/* Key Performance Indicators - FIRST POSITION */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Students */}
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-2xl">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-gray-900">{adminKPIs.totalStudents.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">In your department</p>
                </div>
              </div>
            </div>

            {/* Total Courses */}
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-pink-100 rounded-2xl">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{adminKPIs.totalCourses}</p>
                  <p className="text-xs text-gray-500">In your department</p>
                </div>
              </div>
            </div>

            {/* Total Instructors */}
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-2xl">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Instructors</p>
                  <p className="text-2xl font-bold text-gray-900">{adminKPIs.totalInstructors}</p>
                  <p className="text-xs text-gray-500">In your department</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtering Options - SECOND POSITION (below KPI cards) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => handleFilterChange('semester', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                >
                  <option value="all">All Semesters</option>
                  {filterOptions.semesters.slice(0, 20).map(semester => (
                    <option key={semester.id} value={semester.name}>
                      {semester.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Name</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleFilterChange('course', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                >
                  <option value="all">All Courses</option>
                  {filterOptions.courses.slice(0, 30).map(course => (
                    <option key={course.id} value={course.name}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                >
                  <option value="all">All Departments</option>
                  {filterOptions.departments.slice(0, 20).map(department => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructor</label>
                <select
                  value={selectedInstructor}
                  onChange={(e) => handleFilterChange('instructor', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                >
                  <option value="all">All Instructors</option>
                  {filterOptions.instructors.slice(0, 30).map(instructor => (
                    <option key={instructor.id || instructor} value={instructor.name || instructor}>
                      {instructor.name || instructor}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
                <select
                  value={selectedCampus}
                  onChange={(e) => handleFilterChange('campus', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                >
                  <option value="all">All Campuses</option>
                  {filterOptions.campuses.slice(0, 15).map(campus => (
                    <option key={campus} value={campus}>
                      {campus}
                    </option>
                  ))}
                </select>
              </div>
              {/* REMOVED: CRN filter dropdown as requested */}
            </div>
          </div>

          {/* Aggregate Charts & Visualizations */}
          <div className="space-y-8">
            {/* Performance Over Time Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h3>
              <div className="h-80">
                <Line 
                  data={performanceOverTimeChartData} 
                  options={getChartOptions('line', '')}
                />
              </div>
            </div>

            {/* Course Distribution and Campus Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Course Distribution Bar Chart */}
              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Distribution by Performance</h3>
                <div className="h-64">
                  <Bar 
                    data={courseDistributionChartData} 
                    options={getChartOptions('bar', '')}
                  />
                </div>
              </div>

              {/* Campus Performance Comparison */}
              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Campus Performance Comparison</h3>
                <div className="h-64">
                  <Bar 
                    data={campusPerformanceChartData} 
                    options={getChartOptions('bar', '')}
                  />
                </div>
              </div>
            </div>

            {/* Student Grade Distribution */}
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Grade Distribution</h3>
              <div className="h-64">
                <Pie 
                  data={gradeDistributionChartData} 
                  options={getChartOptions('pie', '')}
                />
              </div>
            </div>

            {/* AI Predictive Insights */}
            <div className="bg-[#d3cefc] p-6 rounded-3xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="#6e63e5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Predictive Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl">
                  <p className="text-sm text-gray-600">Next Semester Projection</p>
                  <p className="text-2xl font-bold text-gray-900">{aiPredictions.nextSemesterProjection}%</p>
                  <p className="text-xs text-gray-500">Pass Rate</p>
                </div>
                <div className="bg-white p-4 rounded-2xl">
                  <p className="text-sm text-gray-600">At-Risk Students</p>
                  <p className="text-2xl font-bold text-gray-900">{aiPredictions.atRiskStudentsNextSemester}</p>
                  <p className="text-xs text-gray-500">Projected</p>
                </div>
                <div className="bg-white p-4 rounded-2xl">
                  <p className="text-sm text-gray-600">Expected Enrollment</p>
                  <p className="text-2xl font-bold text-gray-900">{aiPredictions.expectedEnrollment.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recommended Interventions</h4>
                <ul className="space-y-2">
                  {aiPredictions.recommendedInterventions.map((intervention, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-4 h-4 text-[#6e63e5] mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{intervention}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
