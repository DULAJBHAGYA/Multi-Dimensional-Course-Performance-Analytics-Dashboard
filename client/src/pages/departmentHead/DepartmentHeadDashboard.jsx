import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DepartmentHeadDashboard = () => {
  const { user } = useAuth();
  const [kpiData, setKpiData] = useState({
    totalCourses: 0,
    totalInstructors: 0,
    averageDepartmentPerformance: 0,
    atRiskCourses: 0,
    totalSections: 0 // Changed from pendingApprovals to totalSections
  });
  const [gradeTrends, setGradeTrends] = useState([]);
  const [atRiskCourses, setAtRiskCourses] = useState([]); // New state for at-risk courses
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Instructor comparison state
  const [instructorOptions, setInstructorOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [selectedInstructor1, setSelectedInstructor1] = useState('');
  const [selectedInstructor2, setSelectedInstructor2] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all the KPI data
        const [
          uniqueCoursesResponse,
          uniqueInstructorsResponse,
          totalSectionsResponse,
          avgPerformanceResponse,
          atRiskCoursesCountResponse,
          gradeTrendsResponse,
          atRiskCoursesResponse // New API call for at-risk courses list
        ] = await Promise.all([
          apiService.getDepartmentHeadUniqueCoursesCount(),
          apiService.getDepartmentHeadUniqueInstructorsCount(),
          apiService.getDepartmentHeadTotalSectionsCount(),
          apiService.getDepartmentHeadAverageGrade(),
          apiService.getDepartmentHeadAtRiskCoursesCount(), // Use the new endpoint for at-risk courses count
          apiService.getDepartmentHeadGradeTrends(),
          apiService.getDepartmentHeadAtRiskCourses() // New API call
        ]);
        
        setKpiData({
          totalCourses: uniqueCoursesResponse.unique_courses_count || 0,
          totalInstructors: uniqueInstructorsResponse.unique_instructors_count || 0,
          totalSections: totalSectionsResponse.total_sections_count || 0,
          averageDepartmentPerformance: avgPerformanceResponse.department_average_grade || 0,
          atRiskCourses: atRiskCoursesCountResponse.at_risk_courses_count || 0 // Use the actual data
        });
        
        setGradeTrends(gradeTrendsResponse.trend_data || []);
        setAtRiskCourses(atRiskCoursesResponse.courses || []); // Set at-risk courses data
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch instructor and course options for comparison
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [instructorResponse, courseResponse] = await Promise.all([
          apiService.getDepartmentHeadInstructorOptions(),
          apiService.getDepartmentHeadCourseOptions()
        ]);
        
        setInstructorOptions(instructorResponse.instructor_options || []);
        setCourseOptions(courseResponse.course_options || []);
      } catch (err) {
        console.error('Error fetching options:', err);
      }
    };

    fetchOptions();
  }, []);

  const handleCompare = async () => {
    if (!selectedInstructor1 || !selectedInstructor2) {
      setComparisonError('Please select both instructors');
      return;
    }
    
    try {
      setComparisonLoading(true);
      setComparisonError(null);
      setComparisonData(null); // Clear previous comparison data
      
      const response = await apiService.getDepartmentHeadInstructorComparison(
        selectedInstructor1,
        selectedInstructor2,
        selectedCourse || null
      );
      
      setComparisonData(response.comparison_data);
    } catch (err) {
      console.error('Error fetching comparison data:', err);
      setComparisonError('Failed to load comparison data');
      setComparisonData(null); // Clear comparison data on error
    } finally {
      setComparisonLoading(false);
    }
  };

  // Bar chart component for grade trends
  const BarChartComponent = ({ data, title }) => {
    if (!data || data.length === 0) {
      return <div className="text-center py-8 text-gray-500">No data available</div>;
    }

    // Find min and max values for scaling
    const values = data.map(item => item.average_grade);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1; // Avoid division by zero

    return (
      <div className="p-4">
        <h4 className="text-md font-medium text-gray-700 mb-4">{title}</h4>
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end justify-between">
            {data.map((item, index) => {
              const value = item.average_grade;
              // Calculate height as percentage of the bar (corrected to be right-side up)
              const heightPercentage = range > 0 ? ((value - min) / range) * 80 + 10 : 50; // 10-90% range for better visibility
              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center mx-1 w-full"
                  style={{ height: '100%' }}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {value.toFixed(1)}
                  </div>
                  <div 
                    className="w-3/4 bg-[#6e63e5] rounded-t hover:bg-[#5a52d0] transition-colors"
                    style={{ height: `${heightPercentage}%` }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left whitespace-nowrap">
                    {item.semester_name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-8 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Min Grade: {min.toFixed(2)}</span>
            <span>Max Grade: {max.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

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

  // Chart.js line chart data and options
  const chartData = {
    labels: gradeTrends.map(item => item.semester_name),
    datasets: [
      {
        label: 'Average Grade',
        data: gradeTrends.map(item => item.average_grade),
        borderColor: '#6e63e5',
        backgroundColor: 'rgba(110, 99, 229, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Department Performance Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Average Grade'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Semester'
        }
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Department Head Dashboard</h1>
              <p className="text-gray-600 mt-2">Overview of your department's performance and activities</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
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

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Instructors</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.totalInstructors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-2xl">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sections</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.totalSections}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-2xl">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Performance</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.averageDepartmentPerformance}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-2xl">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">At-Risk Courses</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.atRiskCourses}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Trends Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Semester-wise Average Grade Trends</h3>
          <div className="h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Instructor Comparison Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor Performance Comparison</h3>
          
          {/* Comparison Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor 1</label>
              <select
                value={selectedInstructor1}
                onChange={(e) => setSelectedInstructor1(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#6e63e5] focus:ring focus:ring-[#6e63e5] focus:ring-opacity-50"
              >
                <option value="">Select Instructor</option>
                {instructorOptions.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor 2</label>
              <select
                value={selectedInstructor2}
                onChange={(e) => setSelectedInstructor2(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#6e63e5] focus:ring focus:ring-[#6e63e5] focus:ring-opacity-50"
              >
                <option value="">Select Instructor</option>
                {instructorOptions.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course (Optional)</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#6e63e5] focus:ring focus:ring-[#6e63e5] focus:ring-opacity-50"
              >
                <option value="">All Courses</option>
                {courseOptions.map((course) => (
                  <option key={course.code} value={course.code}>
                    {course.code}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleCompare}
                disabled={comparisonLoading || !selectedInstructor1 || !selectedInstructor2}
                className="w-full bg-[#6e63e5] hover:bg-[#5a52d0] text-white font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {comparisonLoading ? 'Comparing...' : 'Compare'}
              </button>
            </div>
          </div>
          
          {/* Comparison Results */}
          {comparisonError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{comparisonError}</p>
            </div>
          )}
          
          {comparisonLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6e63e5]"></div>
            </div>
          ) : comparisonData ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {comparisonData.instructor1.name}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {comparisonData.instructor2.name}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Number of Students
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comparisonData.instructor1.metrics.student_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comparisonData.instructor2.metrics.student_count}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Pass Rate
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comparisonData.instructor1.metrics.pass_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comparisonData.instructor2.metrics.pass_rate}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Average Grade
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comparisonData.instructor1.metrics.average_grade}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comparisonData.instructor2.metrics.average_grade}%
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Quiz Average
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comparisonData.instructor1.metrics.quiz_average}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comparisonData.instructor2.metrics.quiz_average}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Midterm Average
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comparisonData.instructor1.metrics.midterm_average}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comparisonData.instructor2.metrics.midterm_average}%
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Final Average
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comparisonData.instructor1.metrics.final_average}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comparisonData.instructor2.metrics.final_average}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Select two instructors and click "Compare" to see their performance comparison</p>
            </div>
          )}
        </div>

        {/* At-Risk Courses List */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">At-Risk Courses</h3>
            {atRiskCourses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Grade</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructors</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sections</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {atRiskCourses.map((course, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{course.course_code}</div>
                          <div className="text-sm text-gray-500">{course.course_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${course.average_grade < 40 ? 'text-red-600' : 'text-gray-900'}`}>
                            {course.average_grade}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.instructor_names.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.section_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No at-risk courses found in your department.</p>
              </div>
            )}
          </div>
        </div>


      </div>
    </DashboardLayout>
  );
};

export default DepartmentHeadDashboard;