import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';

const ReportGeneration = () => {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState('course-performance');
  const [coursePerformanceReport, setCoursePerformanceReport] = useState(null);
  const [studentAnalyticsReport, setStudentAnalyticsReport] = useState(null);
  const [predictiveRiskReport, setPredictiveRiskReport] = useState(null);
  const [semesterComparisonReport, setSemesterComparisonReport] = useState(null);
  const [detailedAssessmentReport, setDetailedAssessmentReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');

  // Load course data for dropdown
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courseData = await apiService.getInstructorCourses();
        setCourses([
          { id: '', name: 'All Courses' },
          ...courseData.map(course => ({
            id: course.id,
            name: `${course.course_code || course.courseCode || ''} ${course.course_name || course.courseName || 'Unknown Course'}`
          }))
        ]);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setCourses([{ id: '', name: 'All Courses' }]);
      }
    };

    fetchCourses();
  }, []);

  const fetchReport = async (reportType) => {
    setLoading(true);
    setError(null);
    
    try {
      switch (reportType) {
        case 'course-performance':
          // Use the new course performance analysis API
          const coursePerformanceData = await apiService.getInstructorCoursePerformanceAnalysis();
          setCoursePerformanceReport(coursePerformanceData);
          break;
        case 'student-analytics':
          // Use the new student analysis API
          const studentAnalyticsData = await apiService.getInstructorStudentAnalysisReport(selectedCourse || undefined);
          setStudentAnalyticsReport(studentAnalyticsData);
          break;
        case 'predictive-risk':
          const predictiveRiskData = await apiService.getInstructorPredictiveRiskReport();
          setPredictiveRiskReport(predictiveRiskData);
          break;
        case 'semester-comparison':
          const semesterComparisonData = await apiService.getInstructorSemesterComparisonReport();
          setSemesterComparisonReport(semesterComparisonData);
          break;
        case 'detailed-assessment':
          const detailedAssessmentData = await apiService.getInstructorDetailedAssessmentReport(selectedCourse || undefined);
          setDetailedAssessmentReport(detailedAssessmentData);
          break;
        default:
          throw new Error('Unknown report type');
      }
    } catch (err) {
      console.error(`Error fetching ${reportType} report:`, err);
      setError(`Failed to load ${reportType.replace('-', ' ')} report`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeReport);
  }, [activeReport]);

  const handleGenerateReport = () => {
    fetchReport(activeReport);
  };

  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      
      // Download the report using the API service
      const response = await apiService.downloadInstructorReport(
        activeReport, 
        exportFormat, 
        (activeReport === 'student-analytics' || activeReport === 'detailed-assessment') ? selectedCourse : null
      );
      
      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${activeReport}-report-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setLoading(false);
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download report. Please try again.');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Fair': return 'text-yellow-600 bg-yellow-100';
      case 'At Risk': 
      case 'High': return 'text-red-400 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'High': return 'text-red-400 bg-red-100';
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
            Instructor Reports
          </h1>
          <p className="text-gray-600 mt-2">Generate comprehensive reports for your courses and students</p>
        </div>

        {/* Report Type Selector */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <button
              onClick={() => setActiveReport('course-performance')}
              className={`p-4 rounded-2xl text-center transition-colors ${
                activeReport === 'course-performance' 
                  ? 'bg-[#6e63e5] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">Course Performance</div>
              <div className="text-sm mt-1">All courses taught</div>
            </button>
            
            <button
              onClick={() => setActiveReport('student-analytics')}
              className={`p-4 rounded-2xl text-center transition-colors ${
                activeReport === 'student-analytics' 
                  ? 'bg-[#6e63e5] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">Student Analytics</div>
              <div className="text-sm mt-1">Individual progress</div>
            </button>
            
            <button
              onClick={() => setActiveReport('predictive-risk')}
              className={`p-4 rounded-2xl text-center transition-colors ${
                activeReport === 'predictive-risk' 
                  ? 'bg-[#6e63e5] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">Predictive Risk</div>
              <div className="text-sm mt-1">At-risk identification</div>
            </button>
            
            <button
              onClick={() => setActiveReport('semester-comparison')}
              className={`p-4 rounded-2xl text-center transition-colors ${
                activeReport === 'semester-comparison' 
                  ? 'bg-[#6e63e5] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">Semester Comparison</div>
              <div className="text-sm mt-1">Performance trends</div>
            </button>
            
            <button
              onClick={() => setActiveReport('detailed-assessment')}
              className={`p-4 rounded-2xl text-center transition-colors ${
                activeReport === 'detailed-assessment' 
                  ? 'bg-[#6e63e5] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">Detailed Assessment</div>
              <div className="text-sm mt-1">Assignment breakdown</div>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#6e63e5]"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Course Performance Report */}
        {activeReport === 'course-performance' && coursePerformanceReport && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Course Performance Analysis Report</h2>
              <div className="text-sm text-gray-500">
                Generated: {new Date(coursePerformanceReport.generatedAt).toLocaleDateString()}
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-100 rounded-3xl">
                <div className="text-2xl font-bold text-blue-400">{coursePerformanceReport.summary.totalCourses}</div>
                <div className="text-sm text-gray-600">Total Courses</div>
              </div>
              
              <div className="text-center p-4 bg-green-100 rounded-3xl">
                <div className="text-2xl font-bold text-green-400">{coursePerformanceReport.summary.totalStudents}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-100 rounded-3xl">
                <div className="text-2xl font-bold text-yellow-400">{coursePerformanceReport.summary.avgCompletionRate}%</div>
                <div className="text-sm text-gray-600">Avg Completion</div>
              </div>
              
              <div className="text-center p-4 bg-purple-100 rounded-3xl">
                <div className="text-2xl font-bold text-purple-400">{coursePerformanceReport.summary.avgGrade}</div>
                <div className="text-sm text-gray-600">Avg Grade</div>
              </div>
            </div>
            
            {/* Additional Summary Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <h3 className="font-medium text-gray-900 mb-2">Performance Highlights</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Best Performing Course:</span>
                    <span className="font-medium">{coursePerformanceReport.summary.bestPerformingCourse}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lowest Performing Course:</span>
                    <span className="font-medium">{coursePerformanceReport.summary.lowestPerformingCourse}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Assessments:</span>
                    <span className="font-medium">{coursePerformanceReport.summary.totalAssessments}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-2xl">
                <h3 className="font-medium text-gray-900 mb-2">Student Overview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">At-Risk Students:</span>
                    <span className="font-medium text-red-600">{coursePerformanceReport.summary.atRiskStudents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Students:</span>
                    <span className="font-medium">{coursePerformanceReport.summary.activeStudents}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Course Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">At-Risk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRNs</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coursePerformanceReport.courses.map((course, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.courseName}</div>
                        <div className="text-sm text-gray-500">{course.courseCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.semester}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.totalStudents}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.completionRate}%</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        course.averageGrade >= 90 ? 'text-green-600' : 
                        course.averageGrade >= 80 ? 'text-blue-600' : 
                        course.averageGrade >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {course.averageGrade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          course.atRiskStudents > 5 ? 'bg-red-100 text-red-800' : 
                          course.atRiskStudents > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {course.atRiskStudents}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.crnCodes && course.crnCodes.length > 0 ? 
                          course.crnCodes.map((crn, crnIndex) => (
                            <span key={crnIndex}>{crn}{crnIndex < course.crnCodes.length - 1 ? ', ' : ''}</span>
                          )) : 'N/A'}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Performance Legend */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Grade Color Coding</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div key="excellent" className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                  <span>90-100 (Excellent)</span>
                </div>
                <div key="good" className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                  <span>80-89 (Good)</span>
                </div>
                <div key="fair" className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full mr-2"></div>
                  <span>70-79 (Fair)</span>
                </div>
                <div key="needs-improvement" className="flex items-center">
                  <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                  <span>Below 70 (Needs Improvement)</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Student Analytics Report */}
        {activeReport === 'student-analytics' && studentAnalyticsReport && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Student Analysis Report</h2>
              <div className="text-sm text-gray-500">
                Generated: {new Date(studentAnalyticsReport.generatedAt).toLocaleDateString()}
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-100 rounded-3xl">
                <div className="text-2xl font-bold text-blue-400">{studentAnalyticsReport.summary.totalStudents}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              
              <div className="text-center p-4 bg-green-100 rounded-3xl">
                <div className="text-2xl font-bold text-green-400">{studentAnalyticsReport.summary.activeStudents}</div>
                <div className="text-sm text-gray-600">Active Students</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-100 rounded-3xl">
                <div className="text-2xl font-bold text-yellow-400">{studentAnalyticsReport.summary.atRiskStudents}</div>
                <div className="text-sm text-gray-600">At-Risk Students</div>
              </div>
              
              <div className="text-center p-4 bg-purple-100 rounded-3xl">
                <div className="text-2xl font-bold text-purple-400">{studentAnalyticsReport.summary.avgGrade}</div>
                <div className="text-sm text-gray-600">Avg Grade</div>
              </div>
            </div>
            
            {/* Additional Summary Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <h3 className="font-medium text-gray-900 mb-2">Performance Highlights</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Top Performing Student:</span>
                    <span className="font-medium">{studentAnalyticsReport.summary.topPerformingStudent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lowest Performing Student:</span>
                    <span className="font-medium">{studentAnalyticsReport.summary.lowestPerformingStudent}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-2xl">
                <h3 className="font-medium text-gray-900 mb-2">Student Overview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Progress:</span>
                    <span className="font-medium">{studentAnalyticsReport.summary.avgProgress}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Student Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentAnalyticsReport.students.map((student, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-[#6e63e5] h-2 rounded-full"
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">{student.progress}%</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        student.grade >= 90 ? 'text-green-600' : 
                        student.grade >= 80 ? 'text-blue-600' : 
                        student.grade >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {student.grade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.lastActive}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {student.status === 'active' ? 'Active' : 'At Risk'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.assignmentsCompleted} / {student.totalAssessments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.courses && student.courses.length > 0 ? 
                          student.courses.map((course, courseIndex) => (
                            <span key={courseIndex}>{course.courseCode}{courseIndex < student.courses.length - 1 ? ', ' : ''}</span>
                          )) : 'N/A'}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Performance Legend */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Grade Color Coding</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div key="excellent" className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                  <span>90-100 (Excellent)</span>
                </div>
                <div key="good" className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                  <span>80-89 (Good)</span>
                </div>
                <div key="fair" className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full mr-2"></div>
                  <span>70-79 (Fair)</span>
                </div>
                <div key="needs-improvement" className="flex items-center">
                  <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                  <span>Below 70 (Needs Improvement)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Predictive Risk Report */}
        {activeReport === 'predictive-risk' && predictiveRiskReport && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Predictive Risk Report</h2>
              <div className="text-sm text-gray-500">
                Generated: {new Date(predictiveRiskReport.generatedAt).toLocaleDateString()}
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-red-100 rounded-3xl">
                <div className="text-2xl font-bold text-red-400">{predictiveRiskReport.summary.totalAtRiskStudents}</div>
                <div className="text-sm text-gray-600">At-Risk Students</div>
              </div>
              
              <div className="text-center p-4 bg-red-100 rounded-3xl">
                <div className="text-2xl font-bold text-red-400">{predictiveRiskReport.summary.highRisk}</div>
                <div className="text-sm text-gray-600">High Risk</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-100 rounded-3xl">
                <div className="text-2xl font-bold text-yellow-400">{predictiveRiskReport.summary.mediumRisk}</div>
                <div className="text-sm text-gray-600">Medium Risk</div>
              </div>
              
              <div className="text-center p-4 bg-green-100 rounded-3xl">
                <div className="text-2xl font-bold text-green-400">{predictiveRiskReport.summary.lowRisk}</div>
                <div className="text-sm text-gray-600">Low Risk</div>
              </div>
            </div>
            
            {/* At-Risk Students Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dropout Probability</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Factors</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interventions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {predictiveRiskReport.atRiskStudents.map((student, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getRiskLevelColor(student.riskLevel)}`}>
                          {student.riskLevel} Risk
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.predictedDropoutProbability}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          {student.riskFactors.map((factor, i) => (
                            <span key={i} className="mb-1 last:mb-0">• {factor}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.lastActive}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          {student.recommendedInterventions.slice(0, 2).map((intervention, i) => (
                            <span key={i} className="mb-1 last:mb-0">• {intervention}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Semester Comparison Report */}
        {activeReport === 'semester-comparison' && semesterComparisonReport && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Semester Comparison Report</h2>
              <div className="text-sm text-gray-500">
                Generated: {new Date(semesterComparisonReport.generatedAt).toLocaleDateString()}
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-100 rounded-3xl">
                <div className="text-2xl font-bold text-blue-400">{semesterComparisonReport.summary.totalSemesters}</div>
                <div className="text-sm text-gray-600">Total Semesters</div>
              </div>
              
              <div className="text-center p-4 bg-green-100 rounded-3xl">
                <div className="text-2xl font-bold text-green-400">{semesterComparisonReport.summary.bestPerformingSemester}</div>
                <div className="text-sm text-gray-600">Best Semester</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-100 rounded-3xl">
                <div className="text-2xl font-bold text-yellow-400">{semesterComparisonReport.summary.worstPerformingSemester}</div>
                <div className="text-sm text-gray-600">Worst Semester</div>
              </div>
              
              <div className="text-center p-4 bg-purple-100 rounded-3xl">
                <div className="text-2xl font-bold text-purple-400">{semesterComparisonReport.summary.totalStudents}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
            </div>
            
            {/* Additional Summary Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <h3 className="font-medium text-gray-900 mb-2">Performance Overview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Courses:</span>
                    <span className="font-medium">{semesterComparisonReport.summary.totalCourses}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-2xl">
                <h3 className="font-medium text-gray-900 mb-2">Semester Trends</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Performance Variance:</span>
                    <span className="font-medium">
                      {semesterComparisonReport.semesters && semesterComparisonReport.semesters.length > 1 ? 
                        Math.max(...semesterComparisonReport.semesters.map(s => s.avgGrade)) - 
                        Math.min(...semesterComparisonReport.semesters.map(s => s.avgGrade)) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Semester Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Completion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student/Course Ratio</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {semesterComparisonReport.semesters.map((semester, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{semester.semester}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{semester.courses}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{semester.totalStudents}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{semester.avgCompletionRate}%</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        semester.avgGrade >= 90 ? 'text-green-600' : 
                        semester.avgGrade >= 80 ? 'text-blue-600' : 
                        semester.avgGrade >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {semester.avgGrade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{semester.totalAssessments}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{semester.studentToCourseRatio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Performance Legend */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Grade Color Coding</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div key="excellent" className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                  <span>90-100 (Excellent)</span>
                </div>
                <div key="good" className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                  <span>80-89 (Good)</span>
                </div>
                <div key="fair" className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full mr-2"></div>
                  <span>70-79 (Fair)</span>
                </div>
                <div key="needs-improvement" className="flex items-center">
                  <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                  <span>Below 70 (Needs Improvement)</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Detailed Assessment Report */}
        {activeReport === 'detailed-assessment' && detailedAssessmentReport && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Detailed Assessment Report</h2>
              <div className="text-sm text-gray-500">
                Generated: {new Date(detailedAssessmentReport.generatedAt).toLocaleDateString()}
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-100 rounded-3xl">
                <div className="text-2xl font-bold text-blue-400">{detailedAssessmentReport.summary.totalAssessments}</div>
                <div className="text-sm text-gray-600">Total Assessments</div>
              </div>
              
              <div className="text-center p-4 bg-green-100 rounded-3xl">
                <div className="text-2xl font-bold text-green-400">{detailedAssessmentReport.summary.quizzes}</div>
                <div className="text-sm text-gray-600">Quizzes</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-100 rounded-3xl">
                <div className="text-2xl font-bold text-yellow-400">{detailedAssessmentReport.summary.assignments}</div>
                <div className="text-sm text-gray-600">Assignments</div>
              </div>
              
              <div className="text-center p-4 bg-purple-100 rounded-3xl">
                <div className="text-2xl font-bold text-purple-400">{detailedAssessmentReport.summary.exams}</div>
                <div className="text-sm text-gray-600">Exams</div>
              </div>
              
              <div className="text-center p-4 bg-pink-100 rounded-3xl">
                <div className="text-2xl font-bold text-pink-400">{detailedAssessmentReport.summary.projects}</div>
                <div className="text-sm text-gray-600">Projects</div>
              </div>
            </div>
            
            {/* Assessment Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {detailedAssessmentReport.assessments.map((assessment, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{assessment.assessmentName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assessment.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assessment.dueDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assessment.avgScore}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assessment.submissions}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-[#6e63e5] h-2 rounded-full"
                              style={{ width: `${assessment.passRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">{assessment.passRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Performance Legend */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Grade Color Coding</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div key="excellent" className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                  <span>90-100 (Excellent)</span>
                </div>
                <div key="good" className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                  <span>80-89 (Good)</span>
                </div>
                <div key="fair" className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full mr-2"></div>
                  <span>70-79 (Fair)</span>
                </div>
                <div key="needs-improvement" className="flex items-center">
                  <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                  <span>Below 70 (Needs Improvement)</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Export Controls */}
        <div className="bg-white p-6 rounded-3xl shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-[#6e63e5] hover:bg-[#4c46a0] disabled:bg-gray-400 text-white rounded-2xl transition-colors"
              >
                {loading ? (
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
                    Refresh Report
                  </>
                )}
              </button>

              {(activeReport === 'student-analytics' || activeReport === 'detailed-assessment') && (
                <div className="flex items-center gap-2">
                  <label className="text-gray-700 font-medium">Course:</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6e63e5] focus:border-transparent"
                  >
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="text-gray-700 font-medium">Format:</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6e63e5] focus:border-transparent"
                >
                  <option value="pdf">PDF</option>
                  <option value="xlsx">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleDownloadReport}
              className="flex items-center px-6 py-2 bg-[#6e63e5] hover:bg-[#4c46a0] text-white rounded-2xl transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Report
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportGeneration;