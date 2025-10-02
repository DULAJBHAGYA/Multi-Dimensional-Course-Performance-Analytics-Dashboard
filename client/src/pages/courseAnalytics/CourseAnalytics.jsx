import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { generateBarChartData, generateLineChartData, generatePieChartData, getChartOptions } from '../../utils/chartUtils';

const CourseAnalytics = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Add state for course count
  const [courseCount, setCourseCount] = useState(0);
  // Add state for unique student count
  const [uniqueStudentCount, setUniqueStudentCount] = useState(0);
  // Add state for total assessments count
  const [totalAssessments, setTotalAssessments] = useState(0);
  // Add state for assignment pass rate
  const [assignmentPassRate, setAssignmentPassRate] = useState(0);
  // Add state for high performance rate
  const [highPerformanceRate, setHighPerformanceRate] = useState(0);
  // Add state for grade distribution
  const [gradeDistribution, setGradeDistribution] = useState({});
  // Add state for course performance comparison
  const [coursePerformance, setCoursePerformance] = useState([]);
  // Add state for semester comparison
  const [semesterComparison, setSemesterComparison] = useState([]);
  // Add state for pass rate comparison
  const [passRateComparison, setPassRateComparison] = useState([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        // Fetch data without filters
        const [analyticsResult, courseCountResult, uniqueStudentCountResult, totalAssessmentsResult, assignmentPassRateResult, highPerformanceRateResult, gradeDistributionResult, coursePerformanceResult, semesterComparisonResult, passRateComparisonResult] = await Promise.all([
          apiService.getInstructorCourseAnalytics(),
          apiService.getInstructorCourseCount(),
          apiService.getInstructorUniqueStudentCount(),
          apiService.getInstructorTotalAssessments(),
          apiService.getInstructorAssignmentPassRate(),
          apiService.getInstructorHighPerformanceRate(),
          apiService.getInstructorGradeDistribution(),
          apiService.getInstructorCoursePerformanceComparison(),
          apiService.getInstructorSemesterComparison(),
          apiService.getInstructorPassRateComparison()
        ]);
        setAnalyticsData(analyticsResult);
        // We'll use the course count from the new API endpoint
        setCourseCount(courseCountResult?.total_courses || 0);
        // We'll use the unique student count from the new API endpoint
        setUniqueStudentCount(uniqueStudentCountResult?.unique_student_count || 0);
        // We'll use the total assessments count from the new API endpoint
        setTotalAssessments(totalAssessmentsResult?.total_assessments || 0);
        // We'll use the assignment pass rate from the new API endpoint
        setAssignmentPassRate(assignmentPassRateResult?.pass_rate || 0);
        // We'll use the high performance rate from the new API endpoint
        setHighPerformanceRate(highPerformanceRateResult?.high_performance_rate || 0);
        // We'll use the grade distribution from the new API endpoint
        setGradeDistribution(gradeDistributionResult?.grade_distribution || {});
        // We'll use the course performance comparison from the new API endpoint
        setCoursePerformance(coursePerformanceResult || []);
        // We'll use the semester comparison from the new API endpoint
        setSemesterComparison(semesterComparisonResult || []);
        // We'll use the pass rate comparison from the new API endpoint
        setPassRateComparison(passRateComparisonResult || []);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load course analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

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
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Use real data from API or fallback to empty data
  const courses = analyticsData && Array.isArray(analyticsData) ? [
    { id: 'all', name: 'All Courses' },
    ...analyticsData.map(course => ({
      id: course.id,
      name: course.name || course.courseName || 'Unknown Course'
    }))
  ] : [{ id: 'all', name: 'All Courses' }];

  // If analyticsData is an array (from the current backend), we need to compute the KPIs
  const kpiData = analyticsData && Array.isArray(analyticsData) ? {
    totalAssessments: totalAssessments,
    // Use the unique student count from our new API endpoint for active students
    activeStudents: uniqueStudentCount,
    passRate: assignmentPassRate,
    highPerformanceRate: highPerformanceRate,
    totalCourses: courseCount // Use the course count from our new API endpoint
  } : {
    totalAssessments: totalAssessments,
    // Use the unique student count from our new API endpoint for active students
    activeStudents: uniqueStudentCount,
    passRate: assignmentPassRate,
    highPerformanceRate: highPerformanceRate,
    totalCourses: courseCount // Use the course count from our new API endpoint
  };

  // Prepare grade distribution data for pie chart
  const gradeDistributionData = {
    labels: ['A Grade', 'B Grade', 'C Grade', 'D Grade', 'F Grade'],
    datasets: [
      {
        data: [
          gradeDistribution['A'] || 0,
          gradeDistribution['B'] || 0,
          gradeDistribution['C'] || 0,
          gradeDistribution['D'] || 0,
          gradeDistribution['F'] || 0
        ],
        backgroundColor: [
          '#10B981', // A Grade - green
          '#3B82F6', // B Grade - blue
          '#F59E0B', // C Grade - yellow
          '#EF4444', // D Grade - red
          '#6B7280'  // F Grade - gray
        ],
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }
    ]
  };

  // Prepare course performance comparison data for bar chart
  const coursePerformanceData = {
    labels: coursePerformance.map(course => course.course_name),
    datasets: [
      {
        label: 'Average Performance Score',
        data: coursePerformance.map(course => course.average_percentage),
        backgroundColor: coursePerformance.map((_, index) => 
          index % 2 === 0 ? '#6e63e5' : '#D3CEFC'  // Alternate between main color and light purple
        ),
        borderWidth: 0, // Remove borders from bars
        borderRadius: 15, // Border radius of 15px
        borderSkipped: false
      }
    ]
  };

  // Prepare semester comparison data for line chart
  const semesterComparisonData = {
    labels: semesterComparison.map(semester => semester.semester_name),
    datasets: [
      {
        label: 'Average Grade',
        data: semesterComparison.map(semester => semester.average_grade),
        borderColor: '#6e63e5',
        backgroundColor: 'rgba(110, 99, 229, 0.1)',
        borderWidth: 3,
        pointRadius: 6,
        pointBackgroundColor: '#6e63e5',
        pointBorderColor: '#fff',
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Pass Rate',
        data: semesterComparison.map(semester => semester.pass_rate),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointRadius: 6,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Prepare pass rate comparison data for donut charts
  const passRateComparisonData = passRateComparison.map(course => ({
    labels: ['Pass', 'Fail'],
    datasets: [
      {
        data: [course.pass_rate, course.fail_rate],
        backgroundColor: ['#6e63e5', '#D3CEFC'], // Purple colors for pass/fail
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }
    ]
  }));

  // For other data, we'll use empty arrays since the current backend doesn't provide them
  const enrollmentTrend = [];
  const mostViewedLessons = [];
  const leastViewedLessons = [];

  // Chart data using Chart.js format
  const enrollmentTrendChartData = generateBarChartData(enrollmentTrend, 'month', 'enrollments', 'Enrollments');



  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Course Analytics</h1>
              <p className="text-gray-600 mt-2">Detailed insights into your course performance and student engagement</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.totalAssessments.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-pink-100 rounded-2xl">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.activeStudents.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-2xl">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.passRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-[#d3cefc] rounded-2xl">
                <svg className="w-6 h-6 text-[#6e63e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Performance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.highPerformanceRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-2xl">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.totalCourses}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Grade Distribution Pie Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
            <div className="h-64">
              <Pie 
                data={gradeDistributionData} 
                options={getChartOptions('pie', '')}
              />
            </div>
          </div>

          {/* Semester Comparison Line Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Semester Comparison</h3>
            <div className="h-64">
              <Line 
                data={semesterComparisonData} 
                options={getChartOptions('line', '')}
              />
            </div>
          </div>
        </div>

        {/* Course Performance Comparison */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Course Performance Comparison Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Performance Comparison</h3>
            <div className="h-64">
              <Bar 
                data={coursePerformanceData} 
                options={getChartOptions('bar', '')}
              />
            </div>
          </div>
        </div>

        {/* Student Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pass Rate Comparison Donut Charts - Replacing Most Viewed Lessons */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pass Rate Comparison</h3>
            <div className="space-y-6">
              {passRateComparison && passRateComparison.length > 0 ? (
                passRateComparison.map((course, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-1/3">
                      <p className="text-sm font-medium text-gray-900 truncate">{course.course_name}</p>
                    </div>
                    <div className="w-2/3 flex items-center">
                      <div className="w-32 h-32">
                        <Pie 
                          data={passRateComparisonData[index]} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `${context.label}: ${context.raw.toFixed(1)}%`;
                                  }
                                }
                              }
                            },
                            cutout: '70%'
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Pass: {course.pass_rate}%</p>
                        <p className="text-sm font-medium text-gray-900">Fail: {course.fail_rate}%</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No pass rate data available</p>
              )}
            </div>
          </div>

          {/* Additional Pass Rate Information - Replacing Least Viewed Lessons */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pass Rate Summary</h3>
            <div className="space-y-4">
              {passRateComparison && passRateComparison.length > 0 ? (
                passRateComparison.map((course, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-100 rounded-3xl">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{course.course_name}</p>
                      <p className="text-xs text-gray-500">{course.passing_assessments} of {course.total_assessments} passed</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#6e63e5] h-2 rounded-full"
                          style={{ width: `${course.pass_rate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{course.pass_rate}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No pass rate data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseAnalytics;