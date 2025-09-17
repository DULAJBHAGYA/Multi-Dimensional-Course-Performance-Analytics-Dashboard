import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';

const ReportGeneration = () => {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [reportTypes, setReportTypes] = useState({
    studentPerformance: false,
    engagement: false,
    completion: false,
    revenue: false
  });
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  // Mock data for reports
  const courses = [
    { id: 'all', name: 'All Courses' },
    { id: 'math101', name: 'Mathematics 101' },
    { id: 'physics201', name: 'Physics 201' },
    { id: 'chemistry101', name: 'Chemistry 101' },
    { id: 'biology201', name: 'Biology 201' }
  ];

  const previewData = {
    avgCompletionRate: 82.3,
    dropoutRate: 12.1,
    avgQuizScore: 76.4,
    activeStudents: 45,
    totalRevenue: 18750,
    avgEngagement: 78.9
  };

  const studentPerformanceData = [
    { name: 'John Smith', progress: 95, quizScore: 88, lastActive: '2 days ago', status: 'Excellent' },
    { name: 'Sarah Johnson', progress: 78, quizScore: 82, lastActive: '1 day ago', status: 'Good' },
    { name: 'Mike Davis', progress: 45, quizScore: 65, lastActive: '5 days ago', status: 'At Risk' },
    { name: 'Emily Wilson', progress: 92, quizScore: 91, lastActive: '1 day ago', status: 'Excellent' },
    { name: 'David Brown', progress: 67, quizScore: 73, lastActive: '3 days ago', status: 'Fair' }
  ];

  const engagementData = [
    { date: '2024-01-01', logins: 45, watchTime: 120, quizAttempts: 23 },
    { date: '2024-01-02', logins: 52, watchTime: 145, quizAttempts: 28 },
    { date: '2024-01-03', logins: 38, watchTime: 98, quizAttempts: 19 },
    { date: '2024-01-04', logins: 61, watchTime: 167, quizAttempts: 31 },
    { date: '2024-01-05', logins: 47, watchTime: 134, quizAttempts: 25 }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 4500, enrollments: 23 },
    { month: 'Feb', revenue: 5200, enrollments: 28 },
    { month: 'Mar', revenue: 4800, enrollments: 26 },
    { month: 'Apr', revenue: 6100, enrollments: 32 },
    { month: 'May', revenue: 5700, enrollments: 30 },
    { month: 'Jun', revenue: 6800, enrollments: 35 }
  ];

  const handleReportTypeChange = (type) => {
    setReportTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const report = {
        id: Date.now(),
        course: selectedCourse,
        dateRange: dateRange,
        types: Object.keys(reportTypes).filter(type => reportTypes[type]),
        format: exportFormat,
        generatedAt: new Date(),
        data: {
          preview: previewData,
          studentPerformance: reportTypes.studentPerformance ? studentPerformanceData : null,
          engagement: reportTypes.engagement ? engagementData : null,
          revenue: reportTypes.revenue ? revenueData : null
        }
      };
      
      setGeneratedReport(report);
      setIsGenerating(false);
    }, 2000);
  };

  const handleDownloadReport = () => {
    if (!generatedReport) return;
    
    // Simulate download
    const fileName = `course-report-${generatedReport.generatedAt.toISOString().split('T')[0]}.${exportFormat}`;
    console.log(`Downloading ${fileName}...`);
    
    // In a real app, this would trigger actual file download
    alert(`Report downloaded as ${fileName}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Fair': return 'text-yellow-600 bg-yellow-100';
      case 'At Risk': return 'text-red-400 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 flex items-center">
            Report Generation
          </h1>
          <p className="text-gray-600 mt-2">Generate, customize, and download comprehensive course performance reports</p>
        </div>

        {/* Report Options / Filters */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Course Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                  />
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                  />
                </div>
              </div>
            )}

            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <select 
                value={exportFormat} 
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="pdf">PDF</option>
                <option value="xlsx">Excel (XLSX)</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          {/* Report Types */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Report Types</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportTypes.studentPerformance}
                  onChange={() => handleReportTypeChange('studentPerformance')}
                  className="h-4 w-4 text-yellow-600 focus:ring-[#6e63e5] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Student Performance</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportTypes.engagement}
                  onChange={() => handleReportTypeChange('engagement')}
                  className="h-4 w-4 text-yellow-600 focus:ring-[#6e63e5] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Engagement Report</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportTypes.completion}
                  onChange={() => handleReportTypeChange('completion')}
                  className="h-4 w-4 text-yellow-600 focus:ring-[#6e63e5] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Completion/Dropout</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportTypes.revenue}
                  onChange={() => handleReportTypeChange('revenue')}
                  className="h-4 w-4 text-yellow-600 focus:ring-[#6e63e5] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Revenue Report</span>
              </label>
            </div>
          </div>
        </div>

        {/* Preview / Summary Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-100 rounded-3xl">
              <div className="text-2xl font-bold text-blue-400">{previewData.avgCompletionRate}%</div>
              <div className="text-sm text-gray-600">Avg Completion Rate</div>
            </div>
            
            <div className="text-center p-4 bg-pink-100 rounded-3xl">
              <div className="text-2xl font-bold text-pink-400">{previewData.dropoutRate}%</div>
              <div className="text-sm text-gray-600">Dropout Rate</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-100 rounded-3xl">
              <div className="text-2xl font-bold text-yellow-400">{previewData.avgQuizScore}%</div>
              <div className="text-sm text-gray-600">Avg Quiz Score</div>
            </div>
            
            <div className="text-center p-4 bg-[#D3CEFC] rounded-3xl">
              <div className="text-2xl font-bold text-[#6e63e5]">{previewData.activeStudents}</div>
              <div className="text-sm text-gray-600">Active Students</div>
            </div>
          </div>

          {reportTypes.revenue && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-orange-100 rounded-3xl">
                <div className="text-2xl font-bold text-orange-400">${previewData.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
              
              <div className="text-center p-4 bg-green-100 rounded-3xl">
                <div className="text-2xl font-bold text-green-400">{previewData.avgEngagement}%</div>
                <div className="text-sm text-gray-600">Avg Engagement</div>
              </div>
            </div>
          )}
        </div>

        {/* Generated Content */}
        {generatedReport && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Report Content</h2>
            
            {/* Student Performance Report */}
            {generatedReport.data.studentPerformance && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Student Performance Report</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {generatedReport.data.studentPerformance.map((student, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.progress}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.quizScore}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.lastActive}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(student.status)}`}>
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Engagement Report */}
            {generatedReport.data.engagement && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Engagement Report</h3>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {generatedReport.data.engagement.map((data, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="bg-blue-400 rounded-t-2xl w-full mb-2"
                        style={{ height: `${(data.logins / 70) * 150}px` }}
                        title={`${data.logins} logins`}
                      ></div>
                      <span className="text-xs text-gray-600">{data.date.split('-')[2]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revenue Report */}
            {generatedReport.data.revenue && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Revenue Report</h3>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {generatedReport.data.revenue.map((data, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="bg-green-400 rounded-t-2xl w-full mb-2"
                        style={{ height: `${(data.revenue / 7000) * 150}px` }}
                        title={`$${data.revenue}`}
                      ></div>
                      <span className="text-xs text-gray-600">{data.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Controls */}
        <div className="bg-white p-6 rounded-3xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Controls</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || Object.values(reportTypes).every(type => !type)}
                className="flex items-center px-6 py-2 bg-[#6e63e5] hover:bg- disabled:bg-gray-400 text-white rounded-2xl transition-colors"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Report
                  </>
                )}
              </button>

              {generatedReport && (
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center px-6 py-2 bg-[#6e63e5] hover:bg-[#4c46a0] text-white rounded-2xl transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Report
                </button>
              )}
            </div>

            {/* Schedule Auto-Reports */}
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  className="h-4 w-4 text-yellow-600 focus:ring-[#6e63e5] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Schedule Auto-Reports</span>
              </label>
            </div>
          </div>

          {scheduleEnabled && (
            <div className="mt-4 p-4 bg-[#d3cefc] rounded-3xl">
              <h3 className="text-sm font-medium text-[#6e63e5] mb-2">Auto-Report Settings</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <select className="border border-[#6e63e5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <input
                  type="email"
                  placeholder="Email address for reports"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                />
                <button className="px-4 py-2 bg-[#6e63e5] hover:bg-[#4c46a0] text-white rounded-2xl text-sm transition-colors">
                  Save Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportGeneration;
