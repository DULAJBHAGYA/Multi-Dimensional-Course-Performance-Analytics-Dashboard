import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { generateBarChartData, generateLineChartData, generatePieChartData, getChartOptions } from '../../utils/chartUtils';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [departmentMetrics, setDepartmentMetrics] = useState(null);
  const [campusPerformanceTrend, setCampusPerformanceTrend] = useState(null);
  const [campusGradeDistribution, setCampusGradeDistribution] = useState(null);
  const [campusCoursePerformance, setCampusCoursePerformance] = useState([]); // New state for campus course performance
  const [currentPage, setCurrentPage] = useState(1);
  const [coursesPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data with error handling and loading states
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard data, filter options, department metrics, campus performance trend, grade distribution, and course performance in parallel
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const [dashboardResult, departmentMetricsResult, departmentInstructorsResult, campusPerformanceTrendResult, campusGradeDistributionResult, campusCoursePerformanceResult] = await Promise.all([
          apiService.getAdminDashboard(),
          apiService.getAdminDepartmentMetrics(),
          apiService.getAdminDepartmentInstructors(),
          apiService.getAdminCampusPerformanceTrend(),
          apiService.getAdminCampusGradeDistribution(),
          apiService.getAdminCampusCoursePerformance()
        ]);
        
        clearTimeout(timeoutId);
        setDashboardData(dashboardResult);
        setCampusPerformanceTrend(campusPerformanceTrendResult);
        setCampusGradeDistribution(campusGradeDistributionResult);
        setCampusCoursePerformance(campusCoursePerformanceResult || []);
        
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
  console.log('Campus Performance Trend:', campusPerformanceTrend);
  console.log('Campus Grade Distribution:', campusGradeDistribution);
  console.log('Campus Course Performance:', campusCoursePerformance);

  // Performance over time data - now using campus performance trend data
  const performanceOverTime = campusPerformanceTrend?.map(item => ({
    semester: item.semesterName,
    passRate: item.averageGrade,
    gpa: item.averageGrade / 20, // Converting to GPA scale (assuming 100 point scale)
    students: 0 // Placeholder, as we don't have student count per semester
  })) || [];

  // Course distribution data from Firebase
  const courseDistribution = dashboardData?.courses?.map(course => ({
    department: course.department || course.courseName || course.name,
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

  // Campus grade distribution - now using campus-specific data
  const gradeDistribution = campusGradeDistribution || [
    { grade: 'A', count: 0, percentage: 0 },
    { grade: 'B', count: 0, percentage: 0 },
    { grade: 'C', count: 0, percentage: 0 },
    { grade: 'D', count: 0, percentage: 0 },
    { grade: 'F', count: 0, percentage: 0 }
  ];

  // Get current courses for pagination
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = campusCoursePerformance.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(campusCoursePerformance.length / coursesPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Chart data using Chart.js format
  const performanceOverTimeChartData = generateLineChartData(performanceOverTime, 'semester', 'passRate', '');
  const courseDistributionChartData = generateBarChartData(courseDistribution, 'department', 'averagePerformance', 'Average Performance');
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
          </div>
        </div>

        {/* System Overview Content - FILTERING OPTIONS BELOW KPI CARDS */}
        <div className="space-y-8">
          {/* Key Performance Indicators - FIRST POSITION */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Sections */}
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-2xl">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sections</p>
                  <p className="text-2xl font-bold text-gray-900">{adminKPIs.totalStudents.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">In your campus</p>
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
                  <p className="text-xs text-gray-500">In your campus</p>
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
                  <p className="text-xs text-gray-500">In your campus</p>
                </div>
              </div>
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

            {/* Student Grade Distribution */}
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
              <div className="h-64">
                <Pie 
                  data={gradeDistributionChartData} 
                  options={getChartOptions('pie', '')}
                />
              </div>
            </div>

            {/* Course Performance Table */}
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campus Course Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Code</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Grade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentCourses.map((course, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.courseCode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.courseName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.averageGrade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-2xl">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstCourse + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(indexOfLastCourse, campusCoursePerformance.length)}</span> of{' '}
                      <span className="font-medium">{campusCoursePerformance.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                          currentPage === 1 ? 'cursor-not-allowed' : ''
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={index + 1}
                          onClick={() => paginate(index + 1)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === index + 1
                              ? 'z-10 bg-[#6e63e5] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6e63e5]'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                          currentPage === totalPages ? 'cursor-not-allowed' : ''
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
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
                  <p className="text-sm text-gray-600">Predictive Average Grade</p>
                  <p className="text-2xl font-bold text-gray-900">{aiPredictions.nextSemesterProjection}%</p>
                </div>
                <div className="bg-white p-4 rounded-2xl">
                  <p className="text-sm text-gray-600">Predictive Pass Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{aiPredictions.nextSemesterProjection}%</p>
                </div>
                <div className="bg-white p-4 rounded-2xl">
                  <p className="text-sm text-gray-600">Predicted Course Count Performance Index</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(aiPredictions.nextSemesterProjection * 10)}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;