import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';
console.log('apiService imported:', apiService);
import { Bar, Line } from 'react-chartjs-2';
import { generateBarChartData, generateLineChartData, getChartOptions } from '../../utils/chartUtils';

const InstructorDashboard = () => {
  console.log('InstructorDashboard component initializing');
  const { user } = useAuth();
  console.log('User context:', user);
  const [kpis, setKpis] = useState(null);
  const [studentCount, setStudentCount] = useState(0); // New state for student count
  console.log('Current studentCount state:', studentCount);
  const [filterOptions, setFilterOptions] = useState({
    semesters: [],
    courses: [],
    departments: []
  });
  const [selectedCrn1, setSelectedCrn1] = useState('');
  const [selectedCrn2, setSelectedCrn2] = useState('');
  const [crnComparisonData, setCrnComparisonData] = useState(null);
  const [performanceTrendData, setPerformanceTrendData] = useState([]);
  const [courseOverviews, setCourseOverviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('InstructorDashboard useEffect triggered');
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        console.log('Fetching instructor dashboard data...');
        
        // Fetch all required data in parallel
        console.log('Calling all API methods...');
        const promises = [
          apiService.getInstructorKPIs(),
          apiService.getInstructorFilters(),
          apiService.getInstructorPerformanceTrend(),
          apiService.getInstructorCourseOverviews(),
          apiService.getInstructorStudentCount()
        ];
        
        console.log('Executing Promise.all...');
        const results = await Promise.all(promises);
        console.log('All API calls completed:', results);
        
        const [kpiData, filterData, trendData, courseData, studentCountData] = results;
        
        if (isMounted) {
          console.log('Setting state with fetched data...');
          console.log('Student count data:', studentCountData);
          
          setKpis(kpiData);
          setStudentCount(studentCountData.total_students); // Set the specific student count
          setFilterOptions(filterData);
          setPerformanceTrendData(trendData);
          setCourseOverviews(courseData);
          
          console.log('Student count set to:', studentCountData.total_students);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching dashboard data:', err);
          setError('Failed to load dashboard data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      console.log('InstructorDashboard useEffect cleanup');
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    console.log('studentCount state updated:', studentCount);
  }, [studentCount]);

  const handleCrnComparison = async () => {
    if (!selectedCrn1 || !selectedCrn2) {
      setError('Please select two CRNs to compare');
      return;
    }
    
    try {
      setLoading(true);
      const comparisonData = await apiService.getInstructorCRNComparison(selectedCrn1, selectedCrn2);
      setCrnComparisonData(comparisonData);
      setError(null);
    } catch (err) {
      console.error('Error fetching CRN comparison data:', err);
      setError('Failed to load CRN comparison data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !kpis) {
    console.log('InstructorDashboard loading state');
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#6e63e5]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !kpis) {
    console.log('InstructorDashboard error state');
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

  console.log('InstructorDashboard rendering with data:', { kpis, studentCount, filterOptions, performanceTrendData, courseOverviews });

  // Prepare performance trend chart data
  const performanceTrendChartData = performanceTrendData && performanceTrendData.length > 0
    ? generateLineChartData(performanceTrendData, 'semester', 'avgCompletionRate', 'Semester Performance')
    : generateLineChartData([
        { semester: 'Fall 2023', avgCompletionRate: 85 },
        { semester: 'Spring 2024', avgCompletionRate: 87 },
        { semester: 'Summer 2024', avgCompletionRate: 89 }
      ], 'semester', 'avgCompletionRate', 'Semester Performance');

  // Prepare CRN comparison chart data if available
  let crnComparisonChartData = null;
  if (crnComparisonData) {
    crnComparisonChartData = {
      labels: [crnComparisonData.crn1.crn, crnComparisonData.crn2.crn],
      datasets: [
        {
          label: 'Students',
          data: [crnComparisonData.crn1.students, crnComparisonData.crn2.students],
          backgroundColor: ['#6e63e5', '#D3CEFC'],
          borderColor: ['#6e63e5', '#D3CEFC'],
          borderWidth: 0,
          borderRadius: 12,
          borderSkipped: false,
        },
        {
          label: 'Completion Rate',
          data: [crnComparisonData.crn1.completionRate, crnComparisonData.crn2.completionRate],
          backgroundColor: ['#10B981', '#6EE7B7'],
          borderColor: ['#10B981', '#6EE7B7'],
          borderWidth: 0,
          borderRadius: 12,
          borderSkipped: false,
        },
        {
          label: 'Average Grade',
          data: [crnComparisonData.crn1.averageGrade, crnComparisonData.crn2.averageGrade],
          backgroundColor: ['#F59E0B', '#FDE68A'],
          borderColor: ['#F59E0B', '#FDE68A'],
          borderWidth: 0,
          borderRadius: 12,
          borderSkipped: false,
        }
      ]
    };
  }

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
                <p className="text-2xl font-bold text-gray-900">
                  {console.log('Rendering student count:', studentCount) || studentCount?.toLocaleString() || '0'}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">{kpis?.active_courses || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900">{kpis?.avg_performance ? kpis.avg_performance.toFixed(1) : 0}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-[#D3CEFC] rounded-2xl">
                <svg className="w-6 h-6 text-[#6e63e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{kpis?.completion_rate ? kpis.completion_rate.toFixed(1) : 0}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* CRN Comparison Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CRN Performance Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select First CRN</label>
              <select 
                value={selectedCrn1} 
                onChange={(e) => setSelectedCrn1(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="">Select CRN</option>
                {filterOptions.courses && filterOptions.courses.map(course => (
                  <option key={`${course.crnCode}-${course.id}`} value={course.crnCode}>
                    {course.crnCode} - {course.courseName}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Second CRN</label>
              <select 
                value={selectedCrn2} 
                onChange={(e) => setSelectedCrn2(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="">Select CRN</option>
                {filterOptions.courses && filterOptions.courses.map(course => (
                  <option key={`${course.crnCode}-${course.id}`} value={course.crnCode}>
                    {course.crnCode} - {course.courseName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={handleCrnComparison}
                disabled={!selectedCrn1 || !selectedCrn2 || loading}
                className="w-full px-4 py-2 bg-[#6e63e5] hover:bg-[#4c46a0] disabled:bg-gray-400 text-white rounded-xl transition-colors"
              >
                Compare CRNs
              </button>
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}
          
          {crnComparisonData && (
            <div className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Comparison Chart */}
                <div className="h-64">
                  <Bar 
                    data={crnComparisonChartData} 
                    options={getChartOptions('bar', 'CRN Comparison')}
                  />
                </div>
                
                {/* Comparison Results */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Comparison Results</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">Better Completion Rate</span>
                      <span className="font-medium">
                        {crnComparisonData.comparison.betterCompletionRate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">Completion Rate Difference</span>
                      <span className={`font-medium ${crnComparisonData.comparison.completionRateDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {crnComparisonData.comparison.completionRateDifference}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">Average Grade Difference</span>
                      <span className={`font-medium ${crnComparisonData.comparison.averageGradeDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {crnComparisonData.comparison.averageGradeDifference}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Detailed CRN Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="border border-gray-200 rounded-2xl p-4">
                  <h5 className="font-medium text-gray-900 mb-3">{crnComparisonData.crn1.crn} - {crnComparisonData.crn1.courseName}</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-medium">{crnComparisonData.crn1.students}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completion Rate:</span>
                      <span className="font-medium">{crnComparisonData.crn1.completionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Grade:</span>
                      <span className="font-medium">{crnComparisonData.crn1.averageGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">At-Risk Students:</span>
                      <span className="font-medium">{crnComparisonData.crn1.atRiskStudents}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-2xl p-4">
                  <h5 className="font-medium text-gray-900 mb-3">{crnComparisonData.crn2.crn} - {crnComparisonData.crn2.courseName}</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-medium">{crnComparisonData.crn2.students}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completion Rate:</span>
                      <span className="font-medium">{crnComparisonData.crn2.completionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Grade:</span>
                      <span className="font-medium">{crnComparisonData.crn2.averageGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">At-Risk Students:</span>
                      <span className="font-medium">{crnComparisonData.crn2.atRiskStudents}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Performance Trend Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Semester Performance Trend</h3>
          <div className="h-64">
            <Line 
              data={performanceTrendChartData} 
              options={getChartOptions('line', '')}
            />
          </div>
        </div>

        {/* Course Overview */}
        <div className="bg-white rounded-3xl shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900">Course Overview</h3>
          </div>
          <div className="p-6">
            {courseOverviews && courseOverviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseOverviews.map((course, index) => (
                  <div key={`${course.courseId}-${index}`} className="border border-gray-200 rounded-3xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{course.courseName}</h4>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      CRN: {course.crnCode} | {course.semesterName}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>{course.totalStudents} students</span>
                      <span className="font-medium text-gray-900">{course.completionRate}% completion</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{course.activeStudents} active</span>
                      <span className="font-medium text-gray-900">Avg: {course.averageGrade}</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#6e63e5] h-2 rounded-xl"
                        style={{ width: `${course.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No course data available
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstructorDashboard;