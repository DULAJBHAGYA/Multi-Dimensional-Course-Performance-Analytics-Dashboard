import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { getChartOptions } from '../../utils/chartUtils';

const DepartmentPerformancePredictive = () => {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data
  const mockPerformanceData = [
    { course_name: 'Data Structures', course_code: 'CS201', current_performance: 78, predicted_performance: 82 },
    { course_name: 'Algorithms', course_code: 'CS301', current_performance: 85, predicted_performance: 88 },
    { course_name: 'Database Systems', course_code: 'CS401', current_performance: 72, predicted_performance: 75 },
    { course_name: 'Web Development', course_code: 'CS450', current_performance: 88, predicted_performance: 90 },
    { course_name: 'Machine Learning', course_code: 'CS501', current_performance: 81, predicted_performance: 85 }
  ];

  const mockRiskData = [
    { course_name: 'Data Structures', course_code: 'CS201', current_performance: 78, predicted_performance: 82, risk_level: 'medium', recommendation: 'Increase hands-on coding sessions' },
    { course_name: 'Algorithms', course_code: 'CS301', current_performance: 85, predicted_performance: 88, risk_level: 'low', recommendation: 'Maintain current teaching approach' },
    { course_name: 'Database Systems', course_code: 'CS401', current_performance: 72, predicted_performance: 75, risk_level: 'high', recommendation: 'Provide additional tutoring sessions' },
    { course_name: 'Web Development', course_code: 'CS450', current_performance: 88, predicted_performance: 90, risk_level: 'low', recommendation: 'Maintain current teaching approach' },
    { course_name: 'Machine Learning', course_code: 'CS501', current_performance: 81, predicted_performance: 85, risk_level: 'medium', recommendation: 'Add more practical examples' }
  ];

  const mockTrendData = [
    { period: 'Jan', performance_value: 75 },
    { period: 'Feb', performance_value: 78 },
    { period: 'Mar', performance_value: 80 },
    { period: 'Apr', performance_value: 82 },
    { period: 'May', performance_value: 85 },
    { period: 'Jun', performance_value: 87 }
  ];

  useEffect(() => {
    const fetchPredictiveData = async () => {
      try {
        setLoading(true);
        // Using mock data instead of API calls
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setPerformanceData(mockPerformanceData);
        setRiskData(mockRiskData);
        setTrendData(mockTrendData);
      } catch (err) {
        console.error('Error fetching predictive data:', err);
        setError('Failed to load predictive analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictiveData();
  }, []);

  // Prepare performance comparison data
  const performanceComparisonData = {
    labels: performanceData.map(course => course.course_name),
    datasets: [
      {
        label: 'Current Performance',
        data: performanceData.map(course => course.current_performance),
        backgroundColor: '#6e63e5',
        borderColor: '#6e63e5',
        borderWidth: 1
      },
      {
        label: 'Predicted Performance',
        data: performanceData.map(course => course.predicted_performance),
        backgroundColor: '#D3CEFC',
        borderColor: '#D3CEFC',
        borderWidth: 1
      }
    ]
  };

  // Prepare risk distribution data
  const riskDistributionData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [
      {
        data: [
          riskData.filter(course => course.risk_level === 'low').length,
          riskData.filter(course => course.risk_level === 'medium').length,
          riskData.filter(course => course.risk_level === 'high').length
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0
      }
    ]
  };

  // Prepare trend data
  const trendAnalysisData = {
    labels: trendData.map(item => item.period),
    datasets: [
      {
        label: 'Performance Trend',
        data: trendData.map(item => item.performance_value),
        borderColor: '#6e63e5',
        backgroundColor: 'rgba(110, 99, 229, 0.1)',
        borderWidth: 3,
        pointRadius: 6,
        pointBackgroundColor: '#6e63e5',
        pointBorderColor: '#fff',
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4
      }
    ]
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-2xl">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Prediction Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">87.5%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Courses Needing Attention</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-2xl">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next Review Due</p>
                <p className="text-2xl font-bold text-gray-900">3 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Comparison Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current vs Predicted Performance</h3>
            <div className="h-64">
              <Bar 
                data={performanceComparisonData} 
                options={getChartOptions('bar', '')}
              />
            </div>
          </div>

          {/* Risk Distribution Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
            <div className="h-64">
              <Pie 
                data={riskDistributionData} 
                options={getChartOptions('pie', '')}
              />
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend Analysis</h3>
            <div className="h-64">
              <Line 
                data={trendAnalysisData} 
                options={getChartOptions('line', '')}
              />
            </div>
          </div>
        </div>

        {/* High-Risk Courses */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">High-Risk Courses</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Performance</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted Performance</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {riskData.filter(course => course.risk_level === 'high').map((course, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.course_name}</div>
                        <div className="text-sm text-gray-500">{course.course_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.current_performance}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.predicted_performance}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          High Risk
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {course.recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {riskData.filter(course => course.risk_level === 'high').length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No high-risk courses identified at this time.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actionable Recommendations</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Resource Allocation</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Consider allocating additional teaching assistants to courses with declining performance trends.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-xl">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Early Intervention</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Implement early intervention strategies for courses showing a performance decline of more than 10%.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Best Practices Sharing</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Facilitate knowledge sharing sessions between high-performing and average-performing instructors.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DepartmentPerformancePredictive;