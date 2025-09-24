import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';

const AdminReports = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState('system');
  const [dateRange, setDateRange] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  // Mock data for admin reports

  const userAnalytics = [
    { category: 'Students', count: 1124, percentage: 90.1, growth: '+12%' },
    { category: 'Instructors', count: 89, percentage: 7.1, growth: '+8%' },
    { category: 'Admins', count: 34, percentage: 2.7, growth: '+2%' }
  ];

  const courseAnalytics = [
    { subject: 'Mathematics', courses: 45, students: 2340, revenue: 23400, completion: 78.5 },
    { subject: 'Science', courses: 38, students: 1890, revenue: 18900, completion: 82.3 },
    { subject: 'Technology', courses: 52, students: 3120, revenue: 31200, completion: 75.2 },
    { subject: 'Business', courses: 21, students: 1050, revenue: 10500, completion: 85.7 }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 12500, courses: 12, students: 234 },
    { month: 'Feb', revenue: 15200, courses: 15, students: 289 },
    { month: 'Mar', revenue: 13800, courses: 14, students: 267 },
    { month: 'Apr', revenue: 18900, courses: 18, students: 345 },
    { month: 'May', revenue: 22100, courses: 22, students: 412 },
    { month: 'Jun', revenue: 25600, courses: 25, students: 478 }
  ];

  const instructorPerformance = [
    { name: 'Dr. Sarah Johnson', courses: 12, students: 456, revenue: 12400, rating: 4.9, status: 'Excellent' },
    { name: 'Prof. Michael Chen', courses: 8, students: 389, revenue: 9800, rating: 4.8, status: 'Excellent' },
    { name: 'Dr. Emily Rodriguez', courses: 15, students: 523, revenue: 15600, rating: 4.7, status: 'Good' },
    { name: 'Prof. David Kim', courses: 6, students: 234, revenue: 7200, rating: 4.9, status: 'Excellent' },
    { name: 'Dr. Lisa Thompson', courses: 10, students: 312, revenue: 8900, rating: 4.6, status: 'Good' }
  ];

  const systemMetrics = [
    { metric: 'Server Response Time', value: '120ms', status: 'Good', trend: '+5ms' },
    { metric: 'Database Performance', value: '98.5%', status: 'Excellent', trend: '+0.2%' },
    { metric: 'Storage Usage', value: '67%', status: 'Good', trend: '+3%' },
    { metric: 'Active Sessions', value: '1,234', status: 'Normal', trend: '+12' },
    { metric: 'Error Rate', value: '0.02%', status: 'Excellent', trend: '-0.01%' },
    { metric: 'API Calls/min', value: '2,456', status: 'Normal', trend: '+156' }
  ];

  const supportTickets = [
    { id: 'TKT-001', subject: 'Login Issues', priority: 'High', status: 'Open', created: '2 hours ago', assigned: 'Admin Team' },
    { id: 'TKT-002', subject: 'Course Upload Problem', priority: 'Medium', status: 'In Progress', created: '4 hours ago', assigned: 'Tech Support' },
    { id: 'TKT-003', subject: 'Payment Processing Error', priority: 'High', status: 'Resolved', created: '6 hours ago', assigned: 'Finance Team' },
    { id: 'TKT-004', subject: 'Feature Request', priority: 'Low', status: 'Open', created: '1 day ago', assigned: 'Product Team' },
    { id: 'TKT-005', subject: 'System Performance', priority: 'Medium', status: 'In Progress', created: '2 days ago', assigned: 'DevOps Team' }
  ];

  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const report = {
        id: Date.now(),
        type: selectedReport,
        dateRange: dateRange,
        format: exportFormat,
        generatedAt: new Date(),
        data: {
          userAnalytics,
          courseAnalytics,
          revenueData,
          instructorPerformance,
          supportTickets
        }
      };
      
      setGeneratedReport(report);
      setIsGenerating(false);
    }, 2000);
  };

  const handleDownloadReport = () => {
    if (!generatedReport) return;
    
    const fileName = `admin-report-${generatedReport.generatedAt.toISOString().split('T')[0]}.${exportFormat}`;
    console.log(`Downloading ${fileName}...`);
    alert(`Report downloaded as ${fileName}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Normal': return 'text-gray-600 bg-gray-100';
      case 'Open': return 'text-red-400 bg-red-50';
      case 'In Progress': return 'text-yellow-600 bg-yellow-100';
      case 'Resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-400 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 flex items-center">
            Admin Reports
          </h1>
          <p className="text-gray-600 mt-2">Comprehensive system reports and analytics for administrators</p>
        </div>

        {/* Report Configuration */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select 
                value={selectedReport} 
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="system">System Overview</option>
                <option value="users">User Analytics</option>
                <option value="courses">Course Analytics</option>
                <option value="revenue">Revenue Report</option>
                <option value="instructors">Instructor Performance</option>
                <option value="support">Support Tickets</option>
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

          {/* Generate Report Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex items-center px-6 py-2 bg-[#6E63E5] hover:bg-[#4c46a0] disabled:bg-gray-400 text-white rounded-xl transition-colors"
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
          </div>
        </div>


        {/* Generated Report Content */}
        {generatedReport && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Generated Report Content</h2>
              <button
                onClick={handleDownloadReport}
                className="flex items-center px-4 py-2 bg-[#6e63e5] hover:bg-[#4c46a0] text-white rounded-2xl transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Report
              </button>
            </div>

            {/* User Analytics */}
            {selectedReport === 'users' && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">User Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userAnalytics.map((analytics, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{analytics.category}</p>
                          <p className="text-2xl font-bold text-gray-900">{analytics.count.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{analytics.percentage}%</p>
                          <p className="text-xs text-green-600">{analytics.growth}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Analytics */}
            {selectedReport === 'courses' && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Course Analytics by Subject</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {courseAnalytics.map((course, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.subject}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.courses}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.students.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${course.revenue.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.completion}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Revenue Chart */}
            {selectedReport === 'revenue' && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Revenue Trends</h3>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {revenueData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="bg-red-400 rounded-t-2xl w-full mb-2"
                        style={{ height: `${(data.revenue / 30000) * 150}px` }}
                        title={`$${data.revenue.toLocaleString()}`}
                      ></div>
                      <span className="text-xs text-gray-600">{data.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructor Performance */}
            {selectedReport === 'instructors' && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Instructor Performance</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {instructorPerformance.map((instructor, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{instructor.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{instructor.courses}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{instructor.students.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${instructor.revenue.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {instructor.rating}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(instructor.status)}`}>
                              {instructor.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Support Tickets */}
            {selectedReport === 'support' && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Support Tickets</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {supportTickets.map((ticket, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.subject}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.created}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.assigned}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* System Metrics */}
            {selectedReport === 'system' && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">System Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemMetrics.map((metric, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{metric.metric}</p>
                          <p className="text-xs text-gray-500">Trend: {metric.trend}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{metric.value}</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(metric.status)}`}>
                            {metric.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
