import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';
// Add Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const PredictiveAnalytics = () => {
  const { user } = useAuth();
  const [timeHorizon, setTimeHorizon] = useState('30d');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'ai',
      message: "Hello! I'm your AI assistant for predictive analytics. I can help you understand your course predictions, identify at-risk students, and suggest improvements. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [predictiveData, setPredictiveData] = useState(null);
  const [riskMatrixData, setRiskMatrixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock AI-powered data - in real app, this would come from ML models
  const predictiveKPIs = {};
  const atRiskStudents = [];
  const engagementScores = [];
  const contentPredictions = [];
  const enrollmentForecast = [];
  const aiRecommendations = [];
  const predictedAverageGrades = [];
  const riskMatrixDataMock = [];

  const getRiskColor = (score) => {
    if (score >= 80) return 'text-red-400 bg-red-100';
    if (score >= 60) return 'text-yellow-400 bg-yellow-100';
    return 'text-green-400 bg-green-100';
  };

  const getEngagementColor = (score) => {
    if (score >= 90) return 'text-green-400 bg-green-100';
    if (score >= 70) return 'text-blue-400 bg-blue-100';
    if (score >= 50) return 'text-yellow-400 bg-yellow-100';
    return 'text-red-400 bg-red-100';
  };

  // Fetch instructor predictive data
  const fetchInstructorPredictiveData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For instructors, fetch real data from the new APIs
      if (user?.role === 'instructor') {
        const [predictiveResult, riskMatrixResult] = await Promise.all([
          apiService.getInstructorPredictiveAnalytics(),
          apiService.getInstructorRiskMatrix()
        ]);
        
        setPredictiveData(predictiveResult);
        setRiskMatrixData(riskMatrixResult);
      }
    } catch (err) {
      console.error('Error fetching instructor predictive data:', err);
      setError(err.message || 'Failed to load predictive analytics data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Only fetch instructor data if user is an instructor
    if (user?.role === 'instructor') {
      fetchInstructorPredictiveData();
    } else {
      // For non-instructors, don't show loading
      setLoading(false);
    }
  }, [user, fetchInstructorPredictiveData]);

  // AI Chat functionality
  const generateAIResponse = async (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Use RAG endpoint for more intelligent responses
    try {
      const response = await apiService.getInstructorChatRagResponse(userMessage);
      return response.response;
    } catch (error) {
      console.error('Error getting RAG response:', error);
      // Fallback to static responses if RAG fails
      if (message.includes('completion') || message.includes('finish')) {
        return `I can help you analyze completion rates based on your course data. For specific predictions, please check the predictive analytics section.`;
      }
      
      if (message.includes('dropout') || message.includes('risk') || message.includes('at-risk')) {
        return `I can help identify at-risk students based on their performance data. The risk matrix visualization shows courses with potential issues.`;
      }
      
      if (message.includes('enrollment') || message.includes('future') || message.includes('forecast')) {
        return `I can provide insights on enrollment trends and forecasts based on historical data. Please check the analytics dashboard for detailed information.`;
      }
      
      if (message.includes('certification') || message.includes('certificate') || message.includes('completion')) {
        return `I can analyze certification completion rates based on your course data. Check the predictive analytics section for detailed insights.`;
      }
      
      if (message.includes('content') || message.includes('lesson') || message.includes('engagement')) {
        return `I can help analyze content performance and engagement metrics. Please refer to the course analytics section for detailed information.`;
      }
      
      if (message.includes('help') || message.includes('what can you do')) {
        return `I can help you with:
        • Analyzing completion and dropout predictions
        • Identifying at-risk students and their specific issues
        • Providing content optimization suggestions
        • Explaining enrollment and certification forecasts
        • Generating personalized intervention strategies
        
        Just ask me about any aspect of your course analytics!`;
      }
      
      if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        return `Hello! I'm here to help you make sense of your predictive analytics. I can explain any of the predictions, suggest improvements, or help you understand what the data means for your course. What would you like to explore?`;
      }
      
      return `I understand you're asking about "${userMessage}". I can provide insights on completion rates, student engagement, content performance, or enrollment forecasts based on your course data. Could you be more specific about what aspect you'd like me to analyze?`;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // Show typing indicator
    const typingMessage = {
      id: Date.now() + 1,
      type: 'ai',
      message: 'typing',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, typingMessage]);

    try {
      const aiResponse = {
        id: Date.now() + 2,
        type: 'ai',
        message: await generateAIResponse(chatInput),
        timestamp: new Date()
      };
      // Remove typing indicator and add real response
      setChatMessages(prev => [...prev.filter(msg => msg.message !== 'typing'), aiResponse]);
    } catch (error) {
      // Remove typing indicator and add error message
      setChatMessages(prev => prev.filter(msg => msg.message !== 'typing'));
      const errorMessage = {
        id: Date.now() + 2,
        type: 'ai',
        message: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  // Show loading spinner only for instructors
  if (loading && user?.role === 'instructor') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#6e63e5]"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error only for instructors
  if (error && user?.role === 'instructor') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={fetchInstructorPredictiveData}
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
              <h1 className="text-3xl font-semibold text-gray-900 flex items-center">
                AI Predictive Analytics
              </h1>
              <p className="text-gray-600 mt-2">AI-powered insights and future predictions for your courses</p>
            </div>
          </div>
        </div>

        {/* For instructors, show predictive data */}
        {user?.role === 'instructor' && predictiveData && (
          <>
            {/* Instructor Predictive KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-2xl">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Predicted Average Grade</p>
                    <p className="text-2xl font-bold text-gray-900">{predictiveData.predicted_average_grade?.toFixed(1) || 0}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-2xl">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Predicted Pass Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{predictiveData.predicted_pass_rate?.toFixed(1) || 0}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-2xl">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Predicted At-Risk Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{predictiveData.at_risk_courses_count || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Level Indicator */}
            <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Risk Assessment</h3>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  predictiveData.risk_level === 'Low' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-lg font-medium">
                  {predictiveData.risk_level === 'Low' ? 'Good' : 'At Risk'}
                </span>
              </div>
              <p className="text-gray-600 mt-2">
                Based on your current performance metrics, your overall risk level is assessed as <strong>{predictiveData.risk_level === 'Low' ? 'Good' : 'At Risk'}</strong>.
              </p>
            </div>

            {/* Predicted Average Grades Table */}
            <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Predicted Average Grades by Course</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Predicted Average Grade
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Predicted Pass Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {predictiveData.courses?.map((course, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {course.course_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.course_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.predicted_average_grade}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.predicted_pass_rate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!predictiveData.courses || predictiveData.courses.length === 0) && (
                  <div className="text-center py-4 text-gray-500">
                    No course data available.
                  </div>
                )}
              </div>
            </div>

            {/* Risk Matrix Scatter Plot */}
            <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Matrix</h3>
              <div className="h-80">
                {riskMatrixData?.risk_points && riskMatrixData.risk_points.length > 0 ? (
                  <Scatter
                    data={{
                      datasets: [
                        {
                          label: 'Good (Avg Grade ≥ 70)',
                          data: riskMatrixData.risk_points
                            .filter(item => item.average_grade >= 70)
                            .map(item => ({
                              x: item.num_sections,
                              y: item.predicted_at_risk_sections,
                              course_code: item.course_code,
                              average_grade: item.average_grade
                            })),
                          backgroundColor: 'rgba(75, 192, 75, 0.6)', // Green
                          borderColor: 'rgba(75, 192, 75, 1)',
                          pointRadius: 8,
                          pointHoverRadius: 10
                        },
                        {
                          label: 'At Risk (Avg Grade < 70)',
                          data: riskMatrixData.risk_points
                            .filter(item => item.average_grade < 70)
                            .map(item => ({
                              x: item.num_sections,
                              y: item.predicted_at_risk_sections,
                              course_code: item.course_code,
                              average_grade: item.average_grade
                            })),
                          backgroundColor: 'rgba(255, 99, 132, 0.6)', // Red
                          borderColor: 'rgba(255, 99, 132, 1)',
                          pointRadius: 8,
                          pointHoverRadius: 10
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Number of Sections (Count)'
                          },
                          beginAtZero: true,
                          ticks: {
                            precision: 0
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Predicted At-Risk Sections (Count)'
                          },
                          beginAtZero: true,
                          ticks: {
                            precision: 0
                          }
                        }
                      },
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const point = context.raw;
                              return [
                                `Course: ${point.course_code}`,
                                `Sections: ${point.x}`,
                                `At-Risk: ${point.y}`,
                                `Avg Grade: ${point.average_grade}`
                              ];
                            }
                          }
                        },
                        legend: {
                          position: 'top',
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No risk matrix data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
              <div className="space-y-4">
                {predictiveData.recommendations?.map((recommendation, index) => (
                  <div key={index} className="p-4 bg-blue-50 rounded-xl">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">{recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!predictiveData.recommendations || predictiveData.recommendations.length === 0) && (
                  <div className="text-center py-4 text-gray-500">
                    No recommendations available.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* For non-instructors, show a message */}
        {user?.role !== 'instructor' && (
          <>
            {/* Predictive Analytics - Only for instructors */}
            <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Predictive Analytics</h3>
              <p className="text-gray-600">Predictive analytics data is available for instructors only.</p>
            </div>
          </>
        )}

        {/* AI Chat Bot */}
        <div className="fixed bottom-6 right-6 z-50">
          {/* Chat Toggle Button */}
          {!isChatOpen && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-[#6e63e5] hover:bg-[#4c46a0] text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          )}

          {/* Chat Window */}
          {isChatOpen && (
            <div className="bg-white rounded-3xl shadow-2xl w-96 h-96 flex flex-col">
              {/* Chat Header */}
              <div className="bg-[#6e63e5] text-white p-4 rounded-t-3xl flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#d3cefc] rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="#6e63e5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Analytics Assistant</h3>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-[#d3cefc] hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.message === 'typing' ? (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-1 animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-1 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about your predictions..."
                    className="flex-1 border border-gray-300 rounded-3xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                  />
                  <button
                    type="submit"
                    className="bg-[#6e63e5] hover:bg-[#4c46a0] text-white px-4 py-2 rounded-2xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PredictiveAnalytics;