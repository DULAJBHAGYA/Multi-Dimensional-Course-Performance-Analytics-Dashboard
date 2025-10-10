import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';

const AdminReports = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState('users');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [coursePerformanceData, setCoursePerformanceData] = useState([]); // New state for course performance data
  const [userDetailsData, setUserDetailsData] = useState([]); // New state for user details data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setLoading(true);
    setError(null);
    
    try {
      let data;
      
      // Fetch data based on selected report type
      switch (selectedReport) {
        case 'users':
          // Fetch campus user details data
          const userResponse = await apiService.getAdminCampusUserDetails();
          setUserDetailsData(userResponse.data || []);
          break;
        case 'instructors':
          const instructorResponse = await apiService.getAdminInstructorPerformance();
          data = instructorResponse.data;
          break;
        case 'course-performance':
          // Fetch campus course performance data
          const coursePerformanceResponse = await apiService.getAdminCampusCoursePerformance();
          setCoursePerformanceData(coursePerformanceResponse || []);
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      if (selectedReport !== 'users' && selectedReport !== 'course-performance') {
        const report = {
          id: Date.now(),
          type: selectedReport,
          format: exportFormat,
          generatedAt: new Date(),
          data: data
        };
        
        setReportData(data);
        setGeneratedReport(report);
      }
      
      setIsGenerating(false);
      setLoading(false);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report: ' + (err.message || 'Unknown error'));
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!generatedReport && selectedReport !== 'course-performance' && selectedReport !== 'users') return;
    
    try {
      setLoading(true);
      // Use the download endpoint for actual file download
      const response = await apiService.downloadAdminReport(
        selectedReport,
        exportFormat === 'pdf' ? 'pdf' : 'csv' // Map to backend format expectations
      );
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-report-${generatedReport ? generatedReport.generatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}.${exportFormat === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setLoading(false);
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Failed to download report: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Fair': return 'text-yellow-600 bg-yellow-100';
      case 'Poor': return 'text-orange-600 bg-orange-100';
      case 'Very Poor': return 'text-red-600 bg-red-100';
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select 
                value={selectedReport} 
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="users">Campus User Details</option>
                <option value="instructors">Instructor Performance</option>
                <option value="course-performance">Campus Course Performance</option>
              </select>
            </div>

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
        {loading && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6e63e5]"></div>
              <span className="ml-3 text-gray-600">Loading report data...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
              >
                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <title>Close</title>
                  <path d="M14.348 14.849a1.2 1.2 0 01-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 11-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 11 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 11 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {selectedReport === 'users' && userDetailsData.length > 0 && !loading && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Campus User Details</h2>
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

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userDetailsData.map((user, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === 'course-performance' && coursePerformanceData.length > 0 && !loading && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Campus Course Performance</h2>
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

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Grade</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coursePerformanceData.map((course, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.courseCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.courseName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.passRate}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.averageGrade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {generatedReport && !loading && selectedReport !== 'course-performance' && selectedReport !== 'users' && (
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

            {/* Instructor Performance */}
            {selectedReport === 'instructors' && reportData && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Instructor Performance</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.map((instructor, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{instructor.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{instructor.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{instructor.pass_rate}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{instructor.average_grade}</td>
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

          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;