import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import { processedData } from '../../data/mockData';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCourseType, setSelectedCourseType] = useState('all');
  const [selectedCampus, setSelectedCampus] = useState('all');

  // Real data for admin dashboard KPIs
  const adminKPIs = {
    totalStudents: processedData.courses.reduce((sum, course) => sum + course.totalEnrollments, 0),
    totalCourses: processedData.courses.length,
    totalInstructors: processedData.roles.instructor,
    overallPassRate: Math.round(processedData.courses.reduce((sum, course) => sum + course.completionRate, 0) / processedData.courses.length),
    atRiskStudents: Math.round(processedData.courses.reduce((sum, course) => sum + course.totalEnrollments, 0) * 0.12), // 12% at risk
    totalCampuses: processedData.campuses.length,
    activeSemesters: processedData.semesters.length
  };

  // Performance over time data
  const performanceOverTime = [
    { semester: 'Fall 2022', passRate: 72.3, gpa: 3.2, students: 1100 },
    { semester: 'Spring 2023', passRate: 75.1, gpa: 3.3, students: 1150 },
    { semester: 'Fall 2023', passRate: 76.8, gpa: 3.4, students: 1200 },
    { semester: 'Spring 2024', passRate: 78.5, gpa: 3.5, students: 1247 }
  ];

  // Course distribution data from real courses
  const courseDistribution = processedData.courses.map(course => ({
    courseType: course.name,
    averagePerformance: course.completionRate,
    totalCourses: 1,
    students: course.totalEnrollments
  }));

  // Campus performance comparison from real data
  const campusPerformance = processedData.campuses.map(campus => ({
    campus: campus.name,
    passRate: campus.averagePerformance,
    students: campus.totalStudents,
    courses: campus.totalCourses,
    instructors: Math.round(campus.totalStudents / 20) // Estimated instructors per campus
  }));

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
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Overview Content */}
        <div className="space-y-8">
          {/* Filtering Options */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Semesters</option>
                  {processedData.semesters.map(semester => (
                    <option key={semester.name} value={semester.name.toLowerCase().replace(/\s+/g, '')}>
                      {semester.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Type</label>
                <select
                  value={selectedCourseType}
                  onChange={(e) => setSelectedCourseType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Course Types</option>
                  {processedData.courses.map(course => (
                    <option key={course.code} value={course.code.toLowerCase()}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Campuses</option>
                  {processedData.campuses.map(campus => (
                    <option key={campus.name} value={campus.name.toLowerCase().replace(/\s+/g, '')}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {/* Total Students */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{adminKPIs.totalStudents.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">All campuses & courses</p>
                </div>
              </div>
            </div>

            {/* Total Courses */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{adminKPIs.totalCourses}</p>
                  <p className="text-xs text-gray-500">Across all programs</p>
                </div>
              </div>
            </div>

            {/* Total Instructors */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Instructors</p>
                  <p className="text-2xl font-bold text-gray-900">{adminKPIs.totalInstructors}</p>
                  <p className="text-xs text-gray-500">Active faculty</p>
                </div>
              </div>
            </div>

            {/* Overall Pass Rate */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overall Pass Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{adminKPIs.overallPassRate}%</p>
                  <p className="text-xs text-gray-500">Average across courses</p>
                </div>
              </div>
            </div>

            {/* At-Risk Students */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">At-Risk Students</p>
                  <p className="text-2xl font-bold text-gray-900">{adminKPIs.atRiskStudents}</p>
                  <p className="text-xs text-gray-500">AI identified</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aggregate Charts & Visualizations */}
          <div className="space-y-8">
            {/* Performance Over Time Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h3>
              <div className="h-80 flex items-end justify-between space-x-4">
                {performanceOverTime.map((data, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t mb-2 relative group">
                      <div 
                        className="w-full transition-all duration-300 hover:from-blue-600 hover:to-blue-400"
                        style={{ height: `${(data.passRate / 80) * 200}px` }}
                        title={`${data.semester}: ${data.passRate}% pass rate`}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {data.passRate}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 font-medium">{data.semester}</div>
                      <div className="text-xs text-gray-500">GPA: {data.gpa}</div>
                      <div className="text-xs text-gray-500">{data.students} students</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Distribution and Campus Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Course Distribution Bar Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Distribution by Performance</h3>
                <div className="space-y-4">
                  {courseDistribution.map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-900">{course.courseType}</span>
                          <span className="text-sm text-gray-600">{course.averagePerformance}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.averagePerformance}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{course.totalCourses} courses</span>
                          <span>{course.students} students</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campus Performance Comparison */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Campus Performance Comparison</h3>
                <div className="space-y-4">
                  {campusPerformance.map((campus, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-900">{campus.campus}</span>
                          <span className="text-sm font-bold text-gray-900">{campus.passRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              campus.passRate >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                              campus.passRate >= 70 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                              'bg-gradient-to-r from-red-400 to-red-600'
                            }`}
                            style={{ width: `${campus.passRate}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          <div className="text-center">
                            <div className="font-medium">{campus.students}</div>
                            <div>Students</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{campus.courses}</div>
                            <div>Courses</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{campus.instructors}</div>
                            <div>Instructors</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Student Grade Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Grade Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {gradeDistribution.map((grade, index) => (
                  <div key={index} className="text-center">
                    <div className={`w-full h-24 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-2 ${
                      grade.grade.startsWith('A') ? 'bg-green-500' :
                      grade.grade.startsWith('B') ? 'bg-blue-500' :
                      grade.grade.startsWith('C') ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}>
                      {grade.grade}
                    </div>
                    <div className="text-sm font-medium text-gray-900">{grade.count}</div>
                    <div className="text-xs text-gray-500">{grade.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Predictive Insights */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Predictive Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{aiPredictions.nextSemesterProjection}%</div>
                  <div className="text-sm text-gray-600">Projected Pass Rate</div>
                  <div className="text-xs text-gray-500">Next Semester</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{aiPredictions.atRiskStudentsNextSemester}</div>
                  <div className="text-sm text-gray-600">At-Risk Students</div>
                  <div className="text-xs text-gray-500">Predicted</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{aiPredictions.expectedEnrollment}</div>
                  <div className="text-sm text-gray-600">Expected Enrollment</div>
                  <div className="text-xs text-gray-500">Next Semester</div>
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Recommended Interventions</h4>
                <ul className="space-y-2">
                  {aiPredictions.recommendedInterventions.map((intervention, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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