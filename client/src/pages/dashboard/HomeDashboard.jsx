import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import { processedData } from '../../data/mockData';
import { Bar, Line } from 'react-chartjs-2';
import { generateBarChartData, generateLineChartData, getChartOptions } from '../../utils/chartUtils';

const HomeDashboard = () => {
  const { user } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  // Real data from dataset
  const kpiData = {
    totalStudents: processedData.courses.reduce((sum, course) => sum + course.totalEnrollments, 0),
    activeCourses: processedData.courses.length,
    avgPerformance: Math.round(processedData.courses.reduce((sum, course) => sum + course.completionRate, 0) / processedData.courses.length),
    completionRate: Math.round(processedData.courses.reduce((sum, course) => sum + course.completionRate, 0) / processedData.courses.length)
  };

  const performanceData = [
    { month: 'Jan', performance: 85 },
    { month: 'Feb', performance: 87 },
    { month: 'Mar', performance: 89 },
    { month: 'Apr', performance: 88 },
    { month: 'May', performance: 91 },
    { month: 'Jun', performance: 87 }
  ];

  const courseData = processedData.courses.map(course => ({
    name: course.name,
    students: course.totalEnrollments,
    performance: course.completionRate,
    status: 'active'
  }));

  // Chart data using Chart.js format
  const performanceChartData = generateBarChartData(performanceData, 'month', 'performance', 'Performance');
  const coursePerformanceChartData = generateBarChartData(courseData, 'name', 'performance', 'Course Performance');

  const recentActivity = [
    { type: 'submission', course: 'Mathematics 101', student: 'John Doe', time: '2 hours ago' },
    { type: 'announcement', course: 'Physics 201', message: 'Midterm exam scheduled', time: '4 hours ago' },
    { type: 'submission', course: 'Chemistry 101', student: 'Jane Smith', time: '6 hours ago' },
    { type: 'grade', course: 'Biology 201', student: 'Mike Johnson', score: 95, time: '8 hours ago' },
    { type: 'submission', course: 'Computer Science 101', student: 'Sarah Wilson', time: '1 day ago' }
  ];

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
            <div className="mt-4 sm:mt-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Time Range:</span>
                <select 
                  value={selectedTimeRange} 
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="border border-gray-300 rounded-xl px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
            </div>
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
                <p className="text-xs text-green-600 mt-1">+12% from last month</p>
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
                <p className="text-xs text-green-600 mt-1">+3.2% from last month</p>
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
                <p className="text-xs text-green-600 mt-1">+1.8% from last month</p>
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

        {/* Course Overview and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Course Overview */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm ">
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

          {/* Recent Activity */}
          <div className="bg-white rounded-3xl shadow-sm">
            <div className="p-6 ">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'submission' ? 'bg-blue-500' :
                      activity.type === 'announcement' ? 'bg-pink-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.type === 'submission' && `${activity.student} submitted assignment`}
                        {activity.type === 'announcement' && activity.message}
                        {activity.type === 'grade' && `${activity.student} scored ${activity.score}%`}
                      </p>
                      <p className="text-xs text-gray-500">{activity.course} • {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="flex items-center p-4 border border-gray-200 rounded-3xl hover:bg-gray-50 transition-colors">
                <div className="p-2 bg-blue-100 rounded-xl mr-3">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Create Assignment</p>
                  <p className="text-sm text-gray-500">Add new assignment</p>
                </div>
              </button>

              <button className="flex items-center p-4 border border-gray-200 rounded-3xl hover:bg-gray-50 transition-colors">
                <div className="p-2 bg-pink-100 rounded-xl mr-3">
                  <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V1H4v4zM15 3h5v6h-5V3z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Generate Report</p>
                  <p className="text-sm text-gray-500">Export course data</p>
                </div>
              </button>

              <button className="flex items-center p-4 border border-gray-200 rounded-3xl hover:bg-gray-50 transition-colors">
                <div className="p-2 bg-yellow-100 rounded-xl mr-3">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V1H4v4zM15 3h5v6h-5V3z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">View Analytics</p>
                  <p className="text-sm text-gray-500">Deep dive analysis</p>
                </div>
              </button>

              <button className="flex items-center p-4 border border-gray-200 rounded-3xl hover:bg-gray-50 transition-colors">
                <div className="p-2 bg-[#D3CEFC] rounded-xl mr-3">
                  <svg className="w-5 h-5 text-[#6e63e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Send Announcement</p>
                  <p className="text-sm text-gray-500">Notify students</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HomeDashboard;