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

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        // Fetch data without filters
        const data = await apiService.getInstructorCourseAnalytics();
        setAnalyticsData(data);
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
  const courses = analyticsData ? [
    { id: 'all', name: 'All Courses' },
    ...analyticsData.courses.map(course => ({
      id: course.id,
      name: course.name
    }))
  ] : [{ id: 'all', name: 'All Courses' }];

  const kpiData = analyticsData ? analyticsData.kpis : {
    totalEnrollments: 0,
    activeStudents: 0,
    completionRate: 0,
    averageProgress: 0,
    averageRating: 0,
    totalCourses: 0
  };

  const enrollmentTrend = analyticsData ? analyticsData.enrollmentTrend : [];
  const progressDistribution = analyticsData ? analyticsData.progressDistribution : [];
  const dropOffPoints = analyticsData ? analyticsData.dropOffPoints : [];
  const ratingsBreakdown = analyticsData ? analyticsData.ratingsBreakdown : [];
  const mostViewedLessons = analyticsData ? analyticsData.mostViewedLessons : [];
  const leastViewedLessons = analyticsData ? analyticsData.leastViewedLessons : [];

  // Chart data using Chart.js format
  const enrollmentTrendChartData = generateBarChartData(enrollmentTrend, 'month', 'enrollments', 'Enrollments');
  const progressDistributionChartData = generateBarChartData(progressDistribution, 'range', 'students', 'Students');
  const dropOffPointsChartData = generateBarChartData(dropOffPoints, 'lesson', 'dropOff', 'Drop Off %');
  const ratingsBreakdownChartData = generatePieChartData(ratingsBreakdown, 'stars', 'count');



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
                <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.totalEnrollments.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.completionRate}%</p>
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
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.averageProgress}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-2xl">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.averageRating}/5</p>
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
          {/* Enrollment Trend */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trend</h3>
            <div className="h-64">
              <Bar 
                data={enrollmentTrendChartData} 
                options={getChartOptions('bar', '')}
              />
            </div>
          </div>

          {/* Progress Distribution */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Progress Distribution</h3>
            <div className="h-64">
              <Bar 
                data={progressDistributionChartData} 
                options={getChartOptions('bar', '')}
              />
            </div>
          </div>
        </div>

        {/* Drop-off Points and Ratings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Drop-off Points */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Drop-off Points</h3>
            <div className="h-64">
              <Bar 
                data={dropOffPointsChartData} 
                options={getChartOptions('bar', '')}
              />
            </div>
          </div>

          {/* Ratings Breakdown */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ratings Breakdown</h3>
            <div className="h-64">
              <Pie 
                data={ratingsBreakdownChartData} 
                options={getChartOptions('pie', '')}
              />
            </div>
          </div>
        </div>

        {/* Student Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Most Viewed Lessons */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Viewed Lessons</h3>
            <div className="space-y-4">
              {mostViewedLessons.map((lesson, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-100 rounded-3xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-xs text-gray-500">{lesson.views} views • {lesson.completion}% completion</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#6e63e5] h-2 rounded-full"
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
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Least Viewed Lessons</h3>
            <div className="space-y-4">
              {leastViewedLessons.map((lesson, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-100 rounded-3xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-xs text-gray-500">{lesson.views} views • {lesson.completion}% completion</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#6e63e5] h-2 rounded-full"
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


      </div>
    </DashboardLayout>
  );
};

export default CourseAnalytics;
