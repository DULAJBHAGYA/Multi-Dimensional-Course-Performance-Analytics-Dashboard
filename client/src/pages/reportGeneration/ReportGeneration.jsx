import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';

// Import export libraries
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ReportGeneration = () => {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState('course-performance');
  const [coursePerformanceReport, setCoursePerformanceReport] = useState(null);
  const [studentAnalyticsReport, setStudentAnalyticsReport] = useState(null);
  const [predictiveAnalyticsReport, setPredictiveAnalyticsReport] = useState(null);
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
          // Fetch all the KPI data that matches the CourseAnalytics page
          const [
            courseCountResult,
            atRiskCoursesCountResult,
            avgPerformanceResult,
            passRateResult,
            coursePerformanceComparisonResult,
            coursePassFailSummaryResult
          ] = await Promise.all([
            apiService.getInstructorCourseCount(),
            apiService.getInstructorAtRiskCoursesCount(),
            apiService.getInstructorSectionBasedPerformanceAverage(),
            apiService.getInstructorPassRate(),
            apiService.getInstructorCoursePerformanceComparison(),
            apiService.getInstructorCoursePassFailSummary()
          ]);
          
          // Create a map of course pass rates for easy lookup from the course pass-fail summary
          // Use course_code as the key since it's available in both datasets
          const coursePassRates = {};
          if (coursePassFailSummaryResult?.courses) {
            coursePassFailSummaryResult.courses.forEach(course => {
              // Use course_code as the key for matching
              coursePassRates[course.course_code] = course.pass_percentage || 0;
            });
          }
          
          // Format the data for the report with the same KPIs as CourseAnalytics
          const processedReportData = {
            generatedAt: new Date().toISOString(),
            summary: {
              totalCourses: courseCountResult?.total_courses || 0,
              atRiskCourses: atRiskCoursesCountResult?.at_risk_rate || 0, // This is now a count, not a rate
              avgPerformance: avgPerformanceResult?.avg_performance || 0,
              passRate: passRateResult?.pass_rate || 0
            },
            courses: coursePerformanceComparisonResult?.courses?.map(course => ({
              courseCode: course.course_code || 'N/A',
              courseName: course.course_name || 'Unknown Course',
              campus: course.campus || 'Unknown Campus',
              // Use course_code to look up the pass rate from the pass-fail summary
              passRate: coursePassRates[course.course_code] || course.pass_rate || 0, // Use specific course pass rate from pass-fail summary
              avgGrade: course.average_grade || 0,
              atRisk: false, // We'll determine this based on the grade threshold
              totalStudents: 0 // This data isn't available in the course performance comparison
            })) || []
          };
          
          setCoursePerformanceReport(processedReportData);
          break;
        case 'predictive-analytics':
          const predictiveAnalyticsData = await apiService.getInstructorPredictiveAnalyticsReport();
          setPredictiveAnalyticsReport(predictiveAnalyticsData);
          break;
        case 'sections-analysis':
          // Fetch sections data from the new API endpoint
          const sectionsData = await apiService.getInstructorSectionsReport();
          setStudentAnalyticsReport(sectionsData);
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
      
      // For course performance report, export the currently displayed data
      if (activeReport === 'course-performance' && coursePerformanceReport) {
        if (exportFormat === 'pdf') {
          await exportCoursePerformanceToPDF();
        } else if (exportFormat === 'xlsx') {
          await exportCoursePerformanceToExcel();
        }
        setLoading(false);
        return;
      }
      
      // For predictive analytics report, export the currently displayed data
      if (activeReport === 'predictive-analytics' && predictiveAnalyticsReport) {
        if (exportFormat === 'pdf') {
          await exportPredictiveAnalyticsToPDF();
        } else if (exportFormat === 'xlsx') {
          await exportPredictiveAnalyticsToExcel();
        }
        setLoading(false);
        return;
      }
      
      // For sections analysis report, export the currently displayed data
      if (activeReport === 'sections-analysis' && studentAnalyticsReport) {
        if (exportFormat === 'pdf') {
          await exportSectionsAnalysisToPDF();
        } else if (exportFormat === 'xlsx') {
          await exportSectionsAnalysisToExcel();
        }
        setLoading(false);
        return;
      }
      
      // For other reports, use the backend API
      const response = await apiService.downloadInstructorReport(
        activeReport, 
        exportFormat, 
        (activeReport === 'student-analytics') ? selectedCourse : null
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
  
  // Export course performance report to PDF
  const exportCoursePerformanceToPDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Course Performance Analysis Report', 14, 20);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date(coursePerformanceReport.generatedAt).toLocaleDateString()}`, 14, 30);
      
      // Add summary cards
      doc.setFontSize(14);
      doc.text('Summary', 14, 45);
      
      doc.setFontSize(12);
      doc.text(`Total Courses: ${coursePerformanceReport.summary.totalCourses}`, 14, 55);
      doc.text(`At Risk Courses: ${coursePerformanceReport.summary.atRiskCourses}`, 14, 65);
      doc.text(`Average Performance: ${coursePerformanceReport.summary.avgPerformance}%`, 14, 75);
      doc.text(`Pass Rate: ${coursePerformanceReport.summary.passRate}%`, 14, 85);
      
      // Add course data table
      if (coursePerformanceReport.courses && coursePerformanceReport.courses.length > 0) {
        doc.setFontSize(14);
        doc.text('Course Details', 14, 100);
        
        const tableData = coursePerformanceReport.courses.map(course => [
          `${course.courseCode} - ${course.courseName}`,
          course.campus,
          `${course.avgGrade}%`
        ]);
        
        autoTable(doc, {
          startY: 110,
          head: [['Course', 'Campus', 'Average Grade']],
          body: tableData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [110, 99, 229] }
        });
      }
      
      // Save the PDF
      doc.save(`course-performance-analysis-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export to PDF: ' + error.message);
    }
  };
  
  // Export course performance report to Excel/CSV
  const exportCoursePerformanceToExcel = async () => {
    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // Summary data
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Courses', coursePerformanceReport.summary.totalCourses],
        ['At Risk Courses', coursePerformanceReport.summary.atRiskCourses],
        ['Average Performance', `${coursePerformanceReport.summary.avgPerformance}%`]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Course data
      if (coursePerformanceReport.courses && coursePerformanceReport.courses.length > 0) {
        const courseData = [
          ['Course Code', 'Course Name', 'Campus', 'Average Grade']
        ];
        
        coursePerformanceReport.courses.forEach(course => {
          courseData.push([
            course.courseCode,
            course.courseName,
            course.campus,
            `${course.avgGrade}%`
          ]);
        });
        
        const courseWs = XLSX.utils.aoa_to_sheet(courseData);
        XLSX.utils.book_append_sheet(wb, courseWs, 'Courses');
      }
      
      // Export file
      const filename = `course-performance-analysis-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export to Excel: ' + error.message);
    }
  };
  
  // Export predictive analytics report to PDF
  const exportPredictiveAnalyticsToPDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Predictive Analytics Report', 14, 20);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date(predictiveAnalyticsReport.generated_at).toLocaleDateString()}`, 14, 30);
      doc.text(`Instructor: ${predictiveAnalyticsReport.instructor_name}`, 14, 40);
      
      // Add summary cards
      doc.setFontSize(14);
      doc.text('Summary', 14, 55);
      
      doc.setFontSize(12);
      doc.text(`Total Courses: ${predictiveAnalyticsReport.total_courses}`, 14, 65);
      doc.text(`At Risk Courses: ${predictiveAnalyticsReport.at_risk_courses_count}`, 14, 75);
      doc.text(`Predicted Average Grade: ${predictiveAnalyticsReport.predicted_average_grade}%`, 14, 85);
      doc.text(`Predicted Pass Rate: ${predictiveAnalyticsReport.predicted_pass_rate}%`, 14, 95);
      doc.text(`Performance Risk Level: ${predictiveAnalyticsReport.risk_level === 'Low' ? 'Good' : 'At Risk'}`, 14, 105);
      
      // Add course predictions table
      if (predictiveAnalyticsReport.courses && predictiveAnalyticsReport.courses.length > 0) {
        doc.setFontSize(14);
        doc.text('Course Predictions', 14, 120);
        
        const tableData = predictiveAnalyticsReport.courses.map(course => [
          `${course.course_code} - ${course.course_name}`,
          `${course.predicted_average_grade}%`,
          `${course.predicted_pass_rate}%`
        ]);
        
        autoTable(doc, {
          startY: 130,
          head: [['Course', 'Predicted Avg Grade', 'Predicted Pass Rate']],
          body: tableData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [110, 99, 229] }
        });
      }
      
      // Add recommendations
      if (predictiveAnalyticsReport.recommendations && predictiveAnalyticsReport.recommendations.length > 0) {
        doc.setFontSize(14);
        doc.text('AI Recommendations', 14, doc.lastAutoTable.finalY + 10);
        
        let yPosition = doc.lastAutoTable.finalY + 20;
        predictiveAnalyticsReport.recommendations.forEach((rec, index) => {
          doc.setFontSize(10);
          doc.text(`${index + 1}. ${rec}`, 14, yPosition);
          yPosition += 10;
        });
      }
      
      // Save the PDF
      doc.save(`predictive-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export to PDF: ' + error.message);
    }
  };
  
  // Export predictive analytics report to Excel/CSV
  const exportPredictiveAnalyticsToExcel = async () => {
    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // Summary data
      const summaryData = [
        ['Metric', 'Value'],
        ['Instructor Name', predictiveAnalyticsReport.instructor_name],
        ['Total Courses', predictiveAnalyticsReport.total_courses],
        ['At Risk Courses', predictiveAnalyticsReport.at_risk_courses_count],
        ['Predicted Average Grade', `${predictiveAnalyticsReport.predicted_average_grade}%`],
        ['Predicted Pass Rate', `${predictiveAnalyticsReport.predicted_pass_rate}%`],
        ['Performance Risk Level', predictiveAnalyticsReport.risk_level === 'Low' ? 'Good' : 'At Risk']
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Course predictions data
      if (predictiveAnalyticsReport.courses && predictiveAnalyticsReport.courses.length > 0) {
        const courseData = [
          ['Course Code', 'Course Name', 'Predicted Average Grade', 'Predicted Pass Rate']
        ];
        
        predictiveAnalyticsReport.courses.forEach(course => {
          courseData.push([
            course.course_code,
            course.course_name,
            `${course.predicted_average_grade}%`,
            `${course.predicted_pass_rate}%`
          ]);
        });
        
        const courseWs = XLSX.utils.aoa_to_sheet(courseData);
        XLSX.utils.book_append_sheet(wb, courseWs, 'Course Predictions');
      }
      
      // Recommendations data
      if (predictiveAnalyticsReport.recommendations && predictiveAnalyticsReport.recommendations.length > 0) {
        const recData = [
          ['AI Recommendations']
        ];
        
        predictiveAnalyticsReport.recommendations.forEach(rec => {
          recData.push([rec]);
        });
        
        const recWs = XLSX.utils.aoa_to_sheet(recData);
        XLSX.utils.book_append_sheet(wb, recWs, 'Recommendations');
      }
      
      // Export file
      const filename = `predictive-analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export to Excel: ' + error.message);
    }
  };
  
  // Export sections analysis report to PDF
  const exportSectionsAnalysisToPDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('CRNs Performance Report', 14, 20);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date(studentAnalyticsReport.generatedAt).toLocaleDateString()}`, 14, 30);
      
      // Add sections data table
      if (studentAnalyticsReport.sections && studentAnalyticsReport.sections.length > 0) {
        doc.setFontSize(14);
        doc.text('Sections Data', 14, 45);
        
        const tableData = studentAnalyticsReport.sections.map(section => [
          section.crn,
          `${section.course_code} - ${section.course_name}`,
          section.semester,
          section.campus,
          `${section.avg_grade}%`,
          section.status
        ]);
        
        autoTable(doc, {
          startY: 55,
          head: [['CRN', 'Course', 'Semester', 'Campus', 'Average Grade', 'Status']],
          body: tableData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [110, 99, 229] }
        });
      }
      
      // Save the PDF
      doc.save(`sections-analysis-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export to PDF: ' + error.message);
    }
  };
  
  // Export sections analysis report to Excel/CSV
  const exportSectionsAnalysisToExcel = async () => {
    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // Sections data
      if (studentAnalyticsReport.sections && studentAnalyticsReport.sections.length > 0) {
        const sectionData = [
          ['CRN', 'Course Code', 'Course Name', 'Semester', 'Campus', 'Average Grade', 'Status']
        ];
        
        studentAnalyticsReport.sections.forEach(section => {
          sectionData.push([
            section.crn,
            section.course_code,
            section.course_name,
            section.semester,
            section.campus,
            `${section.avg_grade}%`,
            section.status
          ]);
        });
        
        const sectionWs = XLSX.utils.aoa_to_sheet(sectionData);
        XLSX.utils.book_append_sheet(wb, sectionWs, 'Sections');
      }
      
      // Export file
      const filename = `sections-analysis-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export to Excel: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-green-600 bg-green-100';
      case 'Fair': return 'text-yellow-600 bg-yellow-100';
      case 'Needs Improvement': return 'text-red-600 bg-red-100';
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              onClick={() => setActiveReport('predictive-analytics')}
              className={`p-4 rounded-2xl text-center transition-colors ${
                activeReport === 'predictive-analytics' 
                  ? 'bg-[#6e63e5] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">Predictive Analytics</div>
              <div className="text-sm mt-1">Performance predictions</div>
            </button>
            
            <button
              onClick={() => setActiveReport('sections-analysis')}
              className={`p-4 rounded-2xl text-center transition-colors ${
                activeReport === 'sections-analysis' 
                  ? 'bg-[#6e63e5] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">CRNs</div>
              <div className="text-sm mt-1">CRN performance insight</div>
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
            
            {/* Summary Cards - Matching KPIs from CourseAnalytics page */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-100 rounded-3xl">
                <div className="text-2xl font-bold text-blue-400">{coursePerformanceReport.summary.totalCourses}</div>
                <div className="text-sm text-gray-600">Total Courses</div>
              </div>
              
              <div className="text-center p-4 bg-red-100 rounded-3xl">
                <div className="text-2xl font-bold text-red-400">{coursePerformanceReport.summary.atRiskCourses}</div>
                <div className="text-sm text-gray-600">At Risk Courses</div>
              </div>
              
              <div className="text-center p-4 bg-green-100 rounded-3xl">
                <div className="text-2xl font-bold text-green-400">{coursePerformanceReport.summary.avgPerformance}%</div>
                <div className="text-sm text-gray-600">Average Performance</div>
              </div>
            </div>
            
            {/* Course Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coursePerformanceReport.courses.map((course, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.courseCode}</div>
                        <div className="text-sm text-gray-500">{course.courseName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.campus}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        course.avgGrade < 70 ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {course.avgGrade}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          course.avgGrade < 70 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {course.avgGrade < 70 ? 'At Risk' : 'Good'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Predictive Analytics Report */}
        {activeReport === 'predictive-analytics' && predictiveAnalyticsReport && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Predictive Analytics Report</h2>
              <div className="text-sm text-gray-500">
                Generated: {new Date(predictiveAnalyticsReport.generated_at).toLocaleDateString()}
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-100 rounded-3xl">
                <div className="text-2xl font-bold text-blue-400">{predictiveAnalyticsReport.total_courses}</div>
                <div className="text-sm text-gray-600">Total Courses</div>
              </div>
              
              <div className="text-center p-4 bg-red-100 rounded-3xl">
                <div className="text-2xl font-bold text-red-400">{predictiveAnalyticsReport.at_risk_courses_count}</div>
                <div className="text-sm text-gray-600">At Risk Courses</div>
              </div>
              
              <div className="text-center p-4 bg-green-100 rounded-3xl">
                <div className="text-2xl font-bold text-green-400">{predictiveAnalyticsReport.predicted_average_grade}%</div>
                <div className="text-sm text-gray-600">Predicted Avg Grade</div>
              </div>
              
              <div className="text-center p-4 bg-purple-100 rounded-3xl">
                <div className="text-2xl font-bold text-purple-400">{predictiveAnalyticsReport.predicted_pass_rate}%</div>
                <div className="text-sm text-gray-600">Predicted Pass Rate</div>
              </div>
            </div>
            
            {/* Performance Risk Assessment */}
            <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Risk Assessment</h3>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  predictiveAnalyticsReport.risk_level === 'Low' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-lg font-medium">
                  {predictiveAnalyticsReport.risk_level === 'Low' ? 'Good' : 'At Risk'}
                </span>
              </div>
              <p className="text-gray-600 mt-2">
                Based on your current performance metrics, your overall risk level is assessed as <strong>{predictiveAnalyticsReport.risk_level === 'Low' ? 'Good' : 'At Risk'}</strong>.
              </p>
            </div>
            
            {/* Course Predictions Table */}
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
                    {predictiveAnalyticsReport.courses && predictiveAnalyticsReport.courses.map((course, index) => (
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
                {(!predictiveAnalyticsReport.courses || predictiveAnalyticsReport.courses.length === 0) && (
                  <div className="text-center py-4 text-gray-500">
                    No course data available.
                  </div>
                )}
              </div>
            </div>
            
            {/* AI Recommendations */}
            <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
              <div className="space-y-4">
                {predictiveAnalyticsReport.recommendations && predictiveAnalyticsReport.recommendations.map((recommendation, index) => (
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
                {(!predictiveAnalyticsReport.recommendations || predictiveAnalyticsReport.recommendations.length === 0) && (
                  <div className="text-center py-4 text-gray-500">
                    No recommendations available.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sections Analysis Report */}
        {activeReport === 'sections-analysis' && studentAnalyticsReport && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">CRNs Performance Report</h2>
              <div className="text-sm text-gray-500">
                Generated: {new Date(studentAnalyticsReport.generatedAt).toLocaleDateString()}
              </div>
            </div>
            
            {/* Sections Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentAnalyticsReport.sections.map((section, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{section.crn}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{section.course_code}</div>
                        <div className="text-sm text-gray-500">{section.course_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{section.semester}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{section.campus}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        section.avg_grade >= 70 ? 'text-green-600' : 
                        section.avg_grade < 70 ? 'text-red-600' : 'text-red-600'
                      }`}>
                        {section.avg_grade}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(section.status)}`}>
                          {section.status}
                        </span>
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
                  <span>70-100 (Good)</span>
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

              {(activeReport === 'student-analytics') && (
                <div className="flex items-center gap-2">
                  <label className="text-gray-700 font-medium">Course:</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6e63e5] focus:border-transparent"
                  >
                    {courses.map((course) => (
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