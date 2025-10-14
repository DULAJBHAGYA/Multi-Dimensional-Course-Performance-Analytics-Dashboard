import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import { Bar } from 'react-chartjs-2';
import { getChartOptions } from '../../utils/chartUtils';
import apiService from '../../services/api';

const DepartmentPerformancePredictive = () => {
  const { user } = useAuth();
  const [predictiveData, setPredictiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPredictiveData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch predictive analytics data
      const data = await apiService.getDepartmentHeadPredictiveAnalytics();
      setPredictiveData(data);
    } catch (err) {
      console.error('Error fetching predictive data:', err);
      // Don't set error for "No sections found" - just show empty data
      if (err.message && err.message.includes('No sections found')) {
        // Set empty data instead of error
        setPredictiveData({
          predicted_average_grade: 0,
          predicted_pass_rate: 0,
          at_risk_crn_count: 0,
          low_performing_instructor_count: 0,
          courses: [],
          instructors: []
        });
      } else {
        setError(err.message || 'Failed to load predictive analytics data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictiveData();
  }, [fetchPredictiveData]);

  // Prepare predicted average grade by course data with border radius
  const predictedAverageGradeData = {
    labels: predictiveData?.courses?.map(course => course.course_code) || [],
    datasets: [
      {
        label: 'Predicted Average Grade',
        data: predictiveData?.courses?.map(course => course.predicted_average_grade) || [],
        backgroundColor: '#6e63e5',
        borderColor: '#6e63e5',
        borderWidth: 1,
        borderRadius: 5, // Add border radius
        borderSkipped: false, // Ensure all borders are rounded
      }
    ]
  };

  // Prepare predicted pass rate by course data with border radius
  const predictedPassRateData = {
    labels: predictiveData?.courses?.map(course => course.course_code) || [],
    datasets: [
      {
        label: 'Predicted Pass Rate',
        data: predictiveData?.courses?.map(course => course.predicted_pass_rate) || [],
        backgroundColor: '#D3CEFC',
        borderColor: '#D3CEFC',
        borderWidth: 1,
        borderRadius: 5, // Add border radius
        borderSkipped: false, // Ensure all borders are rounded
      }
    ]
  };

  // Chart options with border radius support
  const getChartOptionsWithBorderRadius = (chartType, yAxisLabel) => {
    const options = getChartOptions(chartType, yAxisLabel);
    
    // Add border radius support to the options
    if (options.scales && options.scales.y) {
      options.scales.y.beginAtZero = true;
    }
    
    // Ensure the chart elements support border radius
    options.elements = {
      bar: {
        borderRadius: 5,
        borderSkipped: false,
      }
    };
    
    return options;
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
            <button 
              onClick={fetchPredictiveData}
              className="mt-4 px-4 py-2 bg-[#6e63e5] text-white rounded-xl hover:bg-[#4c46a0] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Performance Predictive Analytics</h1>
              <p className="text-gray-600 mt-2">Predictive insights for your department's course performance</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Predicted Average Grade for Department */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Predicted Average Grade</p>
                <p className="text-2xl font-bold text-gray-900">{predictiveData?.predicted_average_grade?.toFixed(1) || 0}%</p>
              </div>
            </div>
          </div>

          {/* Predicted Pass Rate for Department */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-2xl">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Predicted Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900">{predictiveData?.predicted_pass_rate?.toFixed(1) || 0}%</p>
              </div>
            </div>
          </div>

          {/* Predicted At-Risk CRN Count for Department */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-2xl">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">At-Risk CRNs</p>
                <p className="text-2xl font-bold text-gray-900">{predictiveData?.at_risk_crn_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Predicted Low-Performing Instructor Count for Department */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-2xl">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low-Performing Instructors</p>
                <p className="text-2xl font-bold text-gray-900">{predictiveData?.low_performing_instructor_count || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Predicted Average Grade by Course */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Predicted Average Grade by Course</h3>
            <div className="h-64">
              <Bar 
                data={predictedAverageGradeData} 
                options={getChartOptionsWithBorderRadius('bar', '')}
              />
            </div>
            {(!predictiveData?.courses || predictiveData.courses.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                No course data available.
              </div>
            )}
          </div>
        </div>

        {/* Predicted Pass Rate by Course */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Predicted Pass Rate by Course</h3>
            <div className="h-64">
              <Bar 
                data={predictedPassRateData} 
                options={getChartOptionsWithBorderRadius('bar', '')}
              />
            </div>
            {(!predictiveData?.courses || predictiveData.courses.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                No course data available.
              </div>
            )}
          </div>
        {/* </div>

        Instructor Predicted Average Grades
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor Predicted Average Grades</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted Average Grade</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {predictiveData?.instructors?.map((instructor, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {instructor.instructor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {instructor.predicted_average_grade?.toFixed(1) || 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!predictiveData?.instructors || predictiveData.instructors.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  No instructor data available.
                </div>
              )}
            </div>
          </div>*/}
        </div> 

      </div>
    </DashboardLayout>
  );
};

export default DepartmentPerformancePredictive;