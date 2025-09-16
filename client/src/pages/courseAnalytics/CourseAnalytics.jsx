import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import { processedData } from '../../data/mockData';

const CourseAnalytics = () => {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [cohort, setCohort] = useState('all');

  // Real course data from dataset
  const courses = [
    { id: 'all', name: 'All Courses' },
    ...processedData.courses.map(course => ({
      id: course.code.toLowerCase(),
      name: course.name
    }))
  ];

  const kpiData = {
    totalEnrollments: processedData.courses.reduce((sum, course) => sum + course.totalEnrollments, 0),
    activeStudents: processedData.courses.reduce((sum, course) => sum + course.activeStudents, 0),
    completionRate: Math.round(processedData.courses.reduce((sum, course) => sum + course.completionRate, 0) / processedData.courses.length),
    averageProgress: Math.round(processedData.courses.reduce((sum, course) => sum + course.completionRate, 0) / processedData.courses.length),
    averageRating: Math.round(processedData.courses.reduce((sum, course) => sum + course.averageRating, 0) / processedData.courses.length * 10) / 10,
    revenue: processedData.courses.reduce((sum, course) => sum + course.revenue, 0)
  };

  const enrollmentTrend = [
    { month: 'Jan', enrollments: 45 },
    { month: 'Feb', enrollments: 67 },
    { month: 'Mar', enrollments: 89 },
    { month: 'Apr', enrollments: 123 },
    { month: 'May', enrollments: 156 },
    { month: 'Jun', enrollments: 134 }
  ];

  const progressDistribution = [
    { range: '0-20%', students: 45 },
    { range: '21-40%', students: 78 },
    { range: '41-60%', students: 156 },
    { range: '61-80%', students: 234 },
    { range: '81-100%', students: 189 }
  ];

  const dropOffPoints = [
    { lesson: 'Introduction', dropOff: 12 },
    { lesson: 'Chapter 1: Basics', dropOff: 8 },
    { lesson: 'Chapter 2: Intermediate', dropOff: 15 },
    { lesson: 'Chapter 3: Advanced', dropOff: 22 },
    { lesson: 'Final Project', dropOff: 18 }
  ];

  const ratingsBreakdown = [
    { stars: 5, count: 234, percentage: 45.2 },
    { stars: 4, count: 156, percentage: 30.1 },
    { stars: 3, count: 78, percentage: 15.1 },
    { stars: 2, count: 34, percentage: 6.6 },
    { stars: 1, count: 16, percentage: 3.1 }
  ];

  const mostViewedLessons = [
    { title: 'Introduction to Variables', views: 1156, completion: 89 },
    { title: 'Data Types and Structures', views: 1089, completion: 85 },
    { title: 'Control Flow and Loops', views: 1023, completion: 78 },
    { title: 'Functions and Methods', views: 987, completion: 82 },
    { title: 'Object-Oriented Programming', views: 945, completion: 76 }
  ];

  const leastViewedLessons = [
    { title: 'Advanced Algorithms', views: 234, completion: 45 },
    { title: 'Memory Management', views: 267, completion: 52 },
    { title: 'Error Handling', views: 298, completion: 48 },
    { title: 'Testing Strategies', views: 312, completion: 55 },
    { title: 'Performance Optimization', views: 345, completion: 61 }
  ];

  const recentReviews = [
    { student: 'John Doe', rating: 5, comment: 'Excellent course! Very well structured and easy to follow.', date: '2 days ago' },
    { student: 'Jane Smith', rating: 4, comment: 'Great content, but could use more practical examples.', date: '5 days ago' },
    { student: 'Mike Johnson', rating: 5, comment: 'Perfect for beginners. Highly recommended!', date: '1 week ago' },
    { student: 'Sarah Wilson', rating: 3, comment: 'Good course but some sections were too fast.', date: '1 week ago' },
    { student: 'David Brown', rating: 5, comment: 'Amazing instructor and great materials.', date: '2 weeks ago' }
  ];

  const feedbackSummary = {
    positive: ['Clear explanations', 'Good pacing', 'Practical examples', 'Helpful resources'],
    negative: ['Too fast in some sections', 'Need more exercises', 'Audio quality issues', 'Outdated examples']
  };

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
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-4">
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <select 
                value={cohort} 
                onChange={(e) => setCohort(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Students</option>
                <option value="first-time">First-time Learners</option>
                <option value="repeat">Repeat Learners</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.totalEnrollments.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">+12% from last month</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.activeStudents.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-1">71.5% of total</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.completionRate}%</p>
                <p className="text-xs text-green-600 mt-1">+5.2% from last month</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.averageProgress}%</p>
                <p className="text-xs text-blue-600 mt-1">Course completion</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.averageRating}/5</p>
                <p className="text-xs text-green-600 mt-1">Based on 518 reviews</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${kpiData.revenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">+18% from last month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Enrollment Trend */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trend</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {enrollmentTrend.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="bg-indigo-500 rounded-t w-full mb-2 transition-all duration-300 hover:bg-indigo-600"
                    style={{ height: `${(data.enrollments / 200) * 200}px` }}
                  ></div>
                  <span className="text-xs text-gray-600">{data.month}</span>
                  <span className="text-xs font-medium text-gray-900">{data.enrollments}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Progress Distribution</h3>
            <div className="space-y-4">
              {progressDistribution.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{data.range}</p>
                    <p className="text-xs text-gray-500">{data.students} students</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(data.students / 300) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">{data.students}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drop-off Points and Ratings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Drop-off Points */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Drop-off Points</h3>
            <div className="space-y-4">
              {dropOffPoints.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{data.lesson}</p>
                    <p className="text-xs text-gray-500">{data.dropOff}% drop-off rate</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${data.dropOff}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">{data.dropOff}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ratings Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ratings Breakdown</h3>
            <div className="space-y-3">
              {ratingsBreakdown.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < data.stars ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{data.stars} star{data.stars !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${data.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">{data.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Student Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Most Viewed Lessons */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Viewed Lessons</h3>
            <div className="space-y-4">
              {mostViewedLessons.map((lesson, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-xs text-gray-500">{lesson.views} views • {lesson.completion}% completion</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${lesson.completion}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{lesson.completion}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Least Viewed Lessons */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Least Viewed Lessons</h3>
            <div className="space-y-4">
              {leastViewedLessons.map((lesson, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-xs text-gray-500">{lesson.views} views • {lesson.completion}% completion</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${lesson.completion}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{lesson.completion}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback & Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Reviews */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
            <div className="space-y-4">
              {recentReviews.map((review, index) => (
                <div key={index} className="border-l-4 border-indigo-500 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{review.student}</p>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{review.comment}</p>
                  <p className="text-xs text-gray-500">{review.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Summary</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-3">Positive Feedback</h4>
                <div className="space-y-2">
                  {feedbackSummary.positive.map((feedback, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">{feedback}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-3">Areas for Improvement</h4>
                <div className="space-y-2">
                  {feedbackSummary.negative.map((feedback, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">{feedback}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export & Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Export & Actions</h3>
              <p className="text-sm text-gray-600 mt-1">Download analytics data and manage course settings</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
              <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
              <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseAnalytics;
