import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';

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

  // Mock AI-powered data - in real app, this would come from ML models
  const predictiveKPIs = {
    predictedCompletionRate: 82.3,
    predictedDropoutRate: 17.7,
    futureEnrollments: 156,
    predictedCertifications: 134
  };

  const atRiskStudents = [
    { name: 'John Smith', email: 'john@email.com', riskScore: 85, reasons: ['Low engagement', 'Missed deadlines'], lastActive: '3 days ago' },
    { name: 'Sarah Johnson', email: 'sarah@email.com', riskScore: 78, reasons: ['Low quiz scores', 'Incomplete assignments'], lastActive: '5 days ago' },
    { name: 'Mike Davis', email: 'mike@email.com', riskScore: 72, reasons: ['Low engagement', 'Technical issues'], lastActive: '1 week ago' },
    { name: 'Emily Wilson', email: 'emily@email.com', riskScore: 68, reasons: ['Missed deadlines', 'Low quiz scores'], lastActive: '2 days ago' },
    { name: 'David Brown', email: 'david@email.com', riskScore: 65, reasons: ['Low engagement', 'Incomplete assignments'], lastActive: '4 days ago' }
  ];

  const engagementScores = [
    { student: 'Alice Cooper', score: 95, status: 'Excellent', color: 'green' },
    { student: 'Bob Taylor', score: 87, status: 'Good', color: 'blue' },
    { student: 'Carol White', score: 73, status: 'Fair', color: 'yellow' },
    { student: 'Dan Green', score: 45, status: 'Poor', color: 'red' },
    { student: 'Eva Black', score: 91, status: 'Excellent', color: 'green' }
  ];

  const contentPredictions = [
    { lesson: 'Introduction to AI', predictedEngagement: 92, riskLevel: 'Low', suggestion: 'High engagement expected' },
    { lesson: 'Machine Learning Basics', predictedEngagement: 78, riskLevel: 'Medium', suggestion: 'Consider adding more examples' },
    { lesson: 'Advanced Algorithms', predictedEngagement: 45, riskLevel: 'High', suggestion: 'Break into smaller parts' },
    { lesson: 'Neural Networks', predictedEngagement: 67, riskLevel: 'Medium', suggestion: 'Add visual aids' },
    { lesson: 'Final Project', predictedEngagement: 88, riskLevel: 'Low', suggestion: 'Good engagement expected' }
  ];

  const enrollmentForecast = [
    { month: 'Jul', actual: 134, predicted: 142 },
    { month: 'Aug', actual: null, predicted: 156 },
    { month: 'Sep', actual: null, predicted: 178 },
    { month: 'Oct', actual: null, predicted: 165 },
    { month: 'Nov', actual: null, predicted: 189 },
    { month: 'Dec', actual: null, predicted: 201 }
  ];

  const aiRecommendations = [
    { type: 'urgent', title: 'High Dropout Risk Alert', message: '20% of students at risk of dropping out within the next week', action: 'Send engagement reminders' },
    { type: 'improvement', title: 'Content Optimization', message: 'Lesson 4 has high predicted dropout risk - consider restructuring', action: 'Break into smaller segments' },
    { type: 'opportunity', title: 'Engagement Boost', message: 'Students respond well to interactive content in similar courses', action: 'Add more interactive elements' },
    { type: 'warning', title: 'Technical Issues', message: 'Some students experiencing video loading problems', action: 'Check video quality and hosting' }
  ];

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

  // AI Chat functionality
  const generateAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('completion') || message.includes('finish')) {
      return `Based on current data, your predicted completion rate is ${predictiveKPIs.predictedCompletionRate}% with 94% AI confidence. This is above average compared to similar courses. To improve this, consider reaching out to at-risk students and providing additional support resources.`;
    }
    
    if (message.includes('dropout') || message.includes('risk') || message.includes('at-risk')) {
      return `I've identified ${atRiskStudents.length} students at high risk of dropping out. The main reasons are low engagement and missed deadlines. I recommend sending personalized check-in messages and offering additional support sessions. Would you like me to generate specific intervention strategies?`;
    }
    
    if (message.includes('enrollment') || message.includes('future') || message.includes('forecast')) {
      return `Your enrollment forecast shows ${predictiveKPIs.futureEnrollments} new students expected in the next 30 days. This represents a 12% increase from last month. The trend suggests strong course appeal, especially during peak enrollment periods.`;
    }
    
    if (message.includes('certification') || message.includes('certificate') || message.includes('completion')) {
      return `Based on current trends, I predict ${predictiveKPIs.predictedCertifications} students will complete their certifications in the next quarter. This represents an 18% increase from the previous quarter. The growth is primarily driven by increased engagement and better completion rates.`;
    }
    
    if (message.includes('content') || message.includes('lesson') || message.includes('engagement')) {
      return `I've analyzed your content performance. "Introduction to AI" has the highest predicted engagement (92%), while "Advanced Algorithms" needs attention (45% engagement). I recommend breaking complex lessons into smaller segments and adding more interactive elements.`;
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
    
    return `I understand you're asking about "${userMessage}". Based on your current course data, I can provide insights on completion rates, student engagement, content performance, or enrollment forecasts. Could you be more specific about what aspect you'd like me to analyze?`;
  };

  const handleSendMessage = (e) => {
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

    // Simulate AI thinking delay
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        message: generateAIResponse(chatInput),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

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
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-4">
              <select 
                value={timeHorizon} 
                onChange={(e) => setTimeHorizon(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="7d">Next 7 days</option>
                <option value="30d">Next 30 days</option>
                <option value="90d">Next 90 days</option>
                <option value="1y">Next year</option>
              </select>
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="all">All Courses</option>
                <option value="math101">Mathematics 101</option>
                <option value="physics201">Physics 201</option>
                <option value="chemistry101">Chemistry 101</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Status Banner */}
        <div className="mb-8 bg-[#D3CEFC] rounded-3xl p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-[#6e63e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[#6e63e5]">
                AI models are actively analyzing your course data. Predictions updated every 6 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Predictive KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Predicted Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{predictiveKPIs.predictedCompletionRate}%</p>
                <p className="text-xs text-green-600 mt-1">AI Confidence: 94%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-2xl">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Predicted Dropout Rate</p>
                <p className="text-2xl font-bold text-gray-900">{predictiveKPIs.predictedDropoutRate}%</p>
                <p className="text-xs text-red-400 mt-1">High risk students: 23</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm ">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-2xl">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Future Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{predictiveKPIs.futureEnrollments}</p>
                <p className="text-xs text-green-600 mt-1">Next 30 days</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-[#D3CEFC] rounded-2xl">
                <svg className="w-6 h-6 text-[#6e63e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Predicted Certifications</p>
                <p className="text-2xl font-bold text-gray-900">{predictiveKPIs.predictedCertifications}</p>
                <p className="text-xs text-[#48A860] mt-1">Next quarter</p>
              </div>
            </div>
          </div>
        </div>

        {/* At-Risk Students and Engagement Scores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* At-Risk Students */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              At-Risk Students
            </h3>
            <div className="space-y-4">
              {atRiskStudents.map((student, index) => (
                <div key={index} className="border border-gray-200 rounded-3xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getRiskColor(student.riskScore)}`}>
                      {student.riskScore}% risk
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {student.reasons.map((reason, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-red-100 text-red-400 rounded-3xl">
                        {reason}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Last active: {student.lastActive}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Scores */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Student Engagement Scores
            </h3>
            <div className="space-y-4">
              {engagementScores.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-3xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{student.student}</p>
                    <p className="text-xs text-gray-500">Engagement probability</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          student.color === 'green' ? 'bg-green-400' :
                          student.color === 'blue' ? 'bg-blue-400' :
                          student.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${student.score}%` }}
                      ></div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getEngagementColor(student.score)}`}>
                      {student.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Predictions and Enrollment Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Content Predictions */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-[#6e63e5] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Content Predictions
            </h3>
            <div className="space-y-4">
              {contentPredictions.map((content, index) => (
                <div key={index} className="border border-gray-200 rounded-3xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{content.lesson}</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      content.riskLevel === 'High' ? 'bg-red-100 text-red-400' :
                      content.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-400' :
                      'bg-green-100 text-green-400'
                    }`}>
                      {content.riskLevel} Risk
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#6e63e5] h-2 rounded-full"
                          style={{ width: `${content.predictedEngagement}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 ml-2">{content.predictedEngagement}%</span>
                  </div>
                  <p className="text-xs text-gray-600">{content.suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Enrollment Forecast */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-[#6e63e5] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Enrollment Forecast
            </h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {enrollmentForecast.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="flex flex-col items-center space-y-1">
                    {data.actual && (
                      <div 
                        className="bg-[#6e63e5] rounded-t w-full mb-1"
                        style={{ height: `${(data.actual / 250) * 150}px` }}
                        title={`Actual: ${data.actual}`}
                      ></div>
                    )}
                    <div 
                      className={`rounded-t w-full ${data.actual ? 'bg-[#6e63e5]' : 'bg-[#d3cefc]'}`}
                      style={{ height: `${(data.predicted / 250) * 150}px` }}
                      title={`Predicted: ${data.predicted}`}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                  <span className="text-xs font-medium text-gray-900">{data.predicted}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#6e63e5] rounded mr-2"></div>
                <span className="text-xs text-gray-600">Actual</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#d3cefc] rounded mr-2"></div>
                <span className="text-xs text-gray-600">Predicted</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white p-6 rounded-3xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-[#6e63e5] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiRecommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-3xl ${
                rec.type === 'urgent' ? 'bg-red-100 border-red-400' :
                rec.type === 'warning' ? 'bg-yellow-100 border-yellow-400' :
                rec.type === 'improvement' ? 'bg-blue-100 border-blue-400' :
                'bg-green-100 border-green-400'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className={`w-5 h-5 ${
                      rec.type === 'urgent' ? 'text-red-400' :
                      rec.type === 'warning' ? 'text-yellow-600' :
                      rec.type === 'improvement' ? 'text-blue-600' :
                      'text-green-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      <strong>Suggested Action:</strong> {rec.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
                    <p className="text-xs text-purple-200">Powered by ML predictions</p>
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
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
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
