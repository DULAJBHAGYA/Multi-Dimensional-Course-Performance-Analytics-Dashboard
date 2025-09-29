import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';
import { Bar, Line } from 'react-chartjs-2';
import { generateBarChartData, generateLineChartData, getChartOptions } from '../../utils/chartUtils';

const HomeDashboard = () => {
  const { user } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [selectedCRN, setSelectedCRN] = useState('all');
  const [dashboardData, setDashboardData] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    semesters: [],
    courses: [],
    departments: [],
    campuses: [],
    crns: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await apiService.getInstructorDashboard();
        setDashboardData(data);
        
        // Extract filter options from the data
        if (data && data.courses) {
          const semesters = [...new Set(data.courses.map(course => course.semesterName).filter(Boolean))];
          const courses = [...new Set(data.courses.map(course => course.courseName).filter(Boolean))];
          const departments = [...new Set(data.courses.map(course => course.department).filter(Boolean))];
          const campuses = [...new Set(data.courses.map(course => course.campusName).filter(Boolean))];
          const crns = [...new Set(data.courses.map(course => course.crnCode).filter(Boolean))];
          
          setFilterOptions({
            semesters: semesters.sort(),
            courses: courses.sort(),
            departments: departments.sort(),
            campuses: campuses.sort(),
            crns: crns.sort()
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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

  // Process course data first (before kpiData calculation)
  const courseData = dashboardData?.courses?.map(course => ({
    name: course.courseName || course.name,
    students: course.total_students || 0,
    performance: course.average_performance || 0,
    status: 'active',
    semesterName: course.semesterName,
    department: course.department,
    campusName: course.campusName,
    crnCode: course.crnCode
  })).filter(course => {
    // Apply filters
    if (selectedSemester !== 'all' && course.semesterName !== selectedSemester) return false;
    if (selectedCourse !== 'all' && course.name !== selectedCourse) return false;
    if (selectedDepartment !== 'all' && course.department !== selectedDepartment) return false;
    if (selectedCampus !== 'all' && course.campusName !== selectedCampus) return false;
    if (selectedCRN !== 'all' && course.crnCode !== selectedCRN) return false;
    return true;
  }) || [];

  // Use real data from Firebase or fallback to mock data
  const kpiData = dashboardData ? {
    totalStudents: courseData.reduce((sum, course) => sum + course.students, 0) || 0,
    activeCourses: courseData.length || 0,
    avgPerformance: courseData.length > 0 ? Math.round(courseData.reduce((sum, course) => sum + course.performance, 0) / courseData.length) : 0,
    completionRate: courseData.length > 0 ? Math.round(courseData.reduce((sum, course) => sum + course.performance, 0) / courseData.length) : 0
  } : {
    totalStudents: 0,
    activeCourses: 0,
    avgPerformance: 0,
    completionRate: 0
  };

  const performanceData = [
    { month: 'Jan', performance: 85 },
    { month: 'Feb', performance: 87 },
    { month: 'Mar', performance: 89 },
    { month: 'Apr', performance: 88 },
    { month: 'May', performance: 91 },
    { month: 'Jun', performance: 87 }
  ];

  // Chart data using Chart.js format
  const performanceChartData = generateBarChartData(performanceData, 'month', 'performance', 'Performance');
  const coursePerformanceChartData = generateBarChartData(courseData, 'name', 'performance', 'Course Performance');

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Welcome back, {user?.name || 'Instructor'}!</h1>
              <p className="text-gray-600 mt-2">Here's what's happening with your courses today</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Dashboard Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Semester Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select 
                value={selectedSemester} 
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="all">All Semesters</option>
                {filterOptions.semesters.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </div>

            {/* Course Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="all">All Courses</option>
                {filterOptions.courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select 
                value={selectedDepartment} 
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="all">All Departments</option>
                {filterOptions.departments.map(department => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>

            {/* Campus Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
              <select 
                value={selectedCampus} 
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="all">All Campuses</option>
                {filterOptions.campuses.map(campus => (
                  <option key={campus} value={campus}>{campus}</option>
                ))}
              </select>
            </div>

            {/* CRN Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CRN</label>
              <select 
                value={selectedCRN} 
                onChange={(e) => setSelectedCRN(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="all">All CRNs</option>
                {filterOptions.crns.map(crn => (
                  <option key={crn} value={crn}>{crn}</option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <select 
                value={selectedTimeRange} 
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active Filters:</span>
              <div className="flex flex-wrap gap-2">
                {selectedSemester !== 'all' && (
                  <span className="px-2 py-1 bg-[#6e63e5] text-white text-xs rounded-full">Semester: {selectedSemester}</span>
                )}
                {selectedCourse !== 'all' && (
                  <span className="px-2 py-1 bg-[#6e63e5] text-white text-xs rounded-full">Course: {selectedCourse}</span>
                )}
                {selectedDepartment !== 'all' && (
                  <span className="px-2 py-1 bg-[#6e63e5] text-white text-xs rounded-full">Department: {selectedDepartment}</span>
                )}
                {selectedCampus !== 'all' && (
                  <span className="px-2 py-1 bg-[#6e63e5] text-white text-xs rounded-full">Campus: {selectedCampus}</span>
                )}
                {selectedCRN !== 'all' && (
                  <span className="px-2 py-1 bg-[#6e63e5] text-white text-xs rounded-full">CRN: {selectedCRN}</span>
                )}
              </div>
            </div>
            <button 
              onClick={() => {
                setSelectedSemester('all');
                setSelectedCourse('all');
                setSelectedDepartment('all');
                setSelectedCampus('all');
                setSelectedCRN('all');
                setSelectedTimeRange('30d');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:border-gray-400 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.totalStudents.toLocaleString()}</p>

              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-pink-100 rounded-2xl">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.activeCourses}</p>
                <p className="text-xs text-blue-600 mt-1">All courses running</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-2xl">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.avgPerformance}%</p>

              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm ">
            <div className="flex items-center">
              <div className="p-3 bg-[#D3CEFC] rounded-2xl">
                <svg className="w-6 h-6 text-[#6e63e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.completionRate}%</p>

              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Trend Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
            <div className="h-64">
              <Bar 
                data={performanceChartData} 
                options={getChartOptions('bar', '')}
              />
            </div>
          </div>

          {/* Course Performance Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Performance</h3>
            <div className="h-64">
              <Bar 
                data={coursePerformanceChartData} 
                options={getChartOptions('bar', '')}
              />
            </div>
          </div>
        </div>

        {/* Course Overview */}
        <div className="bg-white rounded-3xl shadow-sm mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900">Course Overview</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courseData.map((course, index) => (
                <div key={index} className="border border-gray-200 rounded-3xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{course.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      course.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{course.students} students</span>
                    <span className="font-medium text-gray-900">{course.performance}% avg</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#6e63e5] h-2 rounded-xl"
                      style={{ width: `${course.performance}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HomeDashboard;