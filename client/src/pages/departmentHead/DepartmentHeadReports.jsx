import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';

const DepartmentHeadReports = () => {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState('department-performance');
  const [departmentPerformanceReport, setDepartmentPerformanceReport] = useState(null);
  const [allInstructorsPerformanceReport, setAllInstructorsPerformanceReport] = useState(null);
  const [gradeTrendsReport, setGradeTrendsReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');

  const fetchReport = async (reportType) => {
    setLoading(true);
    setError(null);
    
    try {
      switch (reportType) {
        case 'department-performance':
          // Fetch all the KPI data for department performance
          const [
            uniqueCoursesResponse,
            uniqueInstructorsResponse,
            totalSectionsResponse,
            avgPerformanceResponse,
            atRiskCoursesResponse,
            gradeTrendsResponse
          ] = await Promise.all([
            apiService.getDepartmentHeadUniqueCoursesCount(),
            apiService.getDepartmentHeadUniqueInstructorsCount(),
            apiService.getDepartmentHeadTotalSectionsCount(),
            apiService.getDepartmentHeadAverageGrade(),
            apiService.getDepartmentHeadAtRiskCoursesCount(),
            apiService.getDepartmentHeadGradeTrends()
          ]);
          
          // Format the data for the report
          const processedReportData = {
            generatedAt: new Date().toISOString(),
            department: user?.department || 'Unknown Department',
            campus: user?.campus || 'Unknown Campus',
            summary: {
              totalCourses: uniqueCoursesResponse.unique_courses_count || 0,
              totalInstructors: uniqueInstructorsResponse.unique_instructors_count || 0,
              totalSections: totalSectionsResponse.total_sections_count || 0,
              avgPerformance: avgPerformanceResponse.department_average_grade || 0,
              atRiskCourses: atRiskCoursesResponse.at_risk_courses_count || 0
            },
            trends: gradeTrendsResponse.trend_data || []
          };
          
          setDepartmentPerformanceReport(processedReportData);
          break;
          
        case 'all-instructors-performance':
          // Fetch all instructors performance data
          const allInstructorsResponse = await apiService.getDepartmentHeadAllInstructorsPerformance();
          setAllInstructorsPerformanceReport(allInstructorsResponse);
          break;
          
        case 'grade-trends':
          // Fetch grade trends data
          const trendsResponse = await apiService.getDepartmentHeadGradeTrends();
          setGradeTrendsReport(trendsResponse.trend_data || []);
          break;
          
        default:
          throw new Error('Unknown report type');
      }
    } catch (err) {
      console.error(`Error fetching ${reportType} report:`, err);
      setError(`Failed to load ${reportType.replace('-', ' ')} report: ${err.message}`);
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
      
      // For now, we'll implement client-side generation for all formats
      // In a production environment, you might want to use server-side generation
      await generateClientSideReport(exportFormat);
      
      setLoading(false);
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download report. Please try again.');
      setLoading(false);
    }
  };

  // Function to generate reports on the client side
  const generateClientSideReport = async (format) => {
    if (format === 'pdf') {
      // For PDF generation, we'll use jsPDF
      const jsPDF = await import('jspdf');
      const autoTable = await import('jspdf-autotable');
      const doc = new jsPDF.default();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Department Head Report', 14, 20);
      
      // Add department and campus info
      doc.setFontSize(12);
      doc.text(`Department: ${user?.department || 'Unknown'}`, 14, 30);
      doc.text(`Campus: ${user?.campus || 'Unknown'}`, 14, 40);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 50);
      
      if (activeReport === 'department-performance' && departmentPerformanceReport) {
        // Add summary cards
        doc.setFontSize(14);
        doc.text('Department Summary', 14, 65);
        
        doc.setFontSize(12);
        doc.text(`Total Courses: ${departmentPerformanceReport.summary.totalCourses}`, 14, 75);
        doc.text(`Total Instructors: ${departmentPerformanceReport.summary.totalInstructors}`, 14, 85);
        doc.text(`Total Sections: ${departmentPerformanceReport.summary.totalSections}`, 14, 95);
        doc.text(`Average Performance: ${departmentPerformanceReport.summary.avgPerformance}%`, 14, 105);
        doc.text(`At Risk Courses: ${departmentPerformanceReport.summary.atRiskCourses}`, 14, 115);
        
        // Add trend data table
        if (departmentPerformanceReport.trends && departmentPerformanceReport.trends.length > 0) {
          doc.setFontSize(14);
          doc.text('Grade Trends', 14, 130);
          
          const tableData = departmentPerformanceReport.trends.map(trend => [
            trend.semester_name,
            `${trend.average_grade}%`
          ]);
          
          autoTable.default(doc, {
            startY: 140,
            head: [['Semester', 'Average Grade']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [110, 99, 229] }
          });
        }
      } else if (activeReport === 'all-instructors-performance' && allInstructorsPerformanceReport) {
        // Add all instructors performance title
        doc.setFontSize(14);
        doc.text('All Instructors Performance', 14, 65);
        doc.text(`Department: ${allInstructorsPerformanceReport.department}`, 14, 75);
        doc.text(`Campus: ${allInstructorsPerformanceReport.campus}`, 14, 85);
        
        // Add instructors performance data table
        if (allInstructorsPerformanceReport.instructors.length > 0) {
          const tableData = allInstructorsPerformanceReport.instructors.map(instructor => [
            instructor.instructor_name,
            instructor.courses_taught.join(', '),
            `${instructor.average_grade}%`,
            instructor.sections_count
          ]);
          
          autoTable.default(doc, {
            startY: 95,
            head: [['Instructor', 'Courses Taught', 'Average Grade', 'CRNs']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [110, 99, 229] }
          });
        }
      } else if (activeReport === 'grade-trends' && gradeTrendsReport) {
        // Add trends title
        doc.setFontSize(14);
        doc.text('Grade Trends Analysis', 14, 65);
        
        // Add trends data table
        if (gradeTrendsReport.length > 0) {
          const tableData = gradeTrendsReport.map(trend => [
            trend.semester_name,
            `${trend.average_grade}%`
          ]);
          
          autoTable.default(doc, {
            startY: 75,
            head: [['Semester', 'Average Grade']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [110, 99, 229] }
          });
        }
      }
      
      // Save the PDF
      doc.save(`department-head-${activeReport}-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } else if (format === 'xlsx' || format === 'csv') {
      // For Excel/CSV generation, we'll use SheetJS
      const XLSX = await import('xlsx');
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      if (activeReport === 'department-performance' && departmentPerformanceReport) {
        // Summary data
        const summaryData = [
          ['Department', user?.department || 'Unknown'],
          ['Campus', user?.campus || 'Unknown'],
          ['Generated', new Date().toLocaleDateString()],
          [],
          ['Metric', 'Value'],
          ['Total Courses', departmentPerformanceReport.summary.totalCourses],
          ['Total Instructors', departmentPerformanceReport.summary.totalInstructors],
          ['Total Sections', departmentPerformanceReport.summary.totalSections],
          ['Average Performance', `${departmentPerformanceReport.summary.avgPerformance}%`],
          ['At Risk Courses', departmentPerformanceReport.summary.atRiskCourses]
        ];
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
        
        // Trend data
        if (departmentPerformanceReport.trends && departmentPerformanceReport.trends.length > 0) {
          const trendData = [
            ['Semester', 'Average Grade']
          ];
          
          departmentPerformanceReport.trends.forEach(trend => {
            trendData.push([
              trend.semester_name,
              `${trend.average_grade}%`
            ]);
          });
          
          const trendWs = XLSX.utils.aoa_to_sheet(trendData);
          XLSX.utils.book_append_sheet(wb, trendWs, 'Grade Trends');
        }
      } else if (activeReport === 'all-instructors-performance' && allInstructorsPerformanceReport) {
        // All instructors performance data
        if (allInstructorsPerformanceReport.instructors.length > 0) {
          const instructorsData = [
            ['Instructor', 'Courses Taught', 'Average Grade', 'CRNs']
          ];
          
          allInstructorsPerformanceReport.instructors.forEach(instructor => {
            instructorsData.push([
              instructor.instructor_name,
              instructor.courses_taught.join(', '),
              `${instructor.average_grade}%`,
              instructor.sections_count
            ]);
          });
          
          const instructorsWs = XLSX.utils.aoa_to_sheet(instructorsData);
          XLSX.utils.book_append_sheet(wb, instructorsWs, 'All Instructors Performance');
        }
      } else if (activeReport === 'grade-trends' && gradeTrendsReport) {
        // Trends data
        const trendsData = [
          ['Semester', 'Average Grade']
        ];
        
        gradeTrendsReport.forEach(trend => {
          trendsData.push([
            trend.semester_name,
            `${trend.average_grade}%`
          ]);
        });
        
        const trendsWs = XLSX.utils.aoa_to_sheet(trendsData);
        XLSX.utils.book_append_sheet(wb, trendsWs, 'Grade Trends');
      }
      
      // Export file
      const filename = `department-head-${activeReport}-report-${new Date().toISOString().split('T')[0]}.${format}`;
      XLSX.writeFile(wb, filename);
    }
  };

  const getStatusColor = (value, isGrade = true) => {
    if (isGrade) {
      if (value >= 70) return 'text-green-600 bg-green-100';
      return 'text-red-600 bg-red-100';
    } else {
      // For non-grade values, we can't determine good/bad without context
      return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 flex items-center">
            Department Head Reports
          </h1>
          <p className="text-gray-600 mt-2">Generate comprehensive reports for your department</p>
        </div>

        {/* Report Type Selector */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveReport('department-performance')}
              className={`p-4 rounded-2xl text-center transition-colors ${
                activeReport === 'department-performance' 
                  ? 'bg-[#6e63e5] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">Department Performance</div>
              <div className="text-sm mt-1">Overall department metrics</div>
            </button>
            
            <button
              onClick={() => setActiveReport('all-instructors-performance')}
              className={`p-4 rounded-2xl text-center transition-colors ${
                activeReport === 'all-instructors-performance' 
                  ? 'bg-[#6e63e5] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">All Instructors</div>
              <div className="text-sm mt-1">Performance of all instructors</div>
            </button>
            
            <button
              onClick={() => setActiveReport('grade-trends')}
              className={`p-4 rounded-2xl text-center transition-colors ${
                activeReport === 'grade-trends' 
                  ? 'bg-[#6e63e5] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">Grade Trends</div>
              <div className="text-sm mt-1">Semester-wise performance trends</div>
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

        {/* Department Performance Report */}
        {activeReport === 'department-performance' && departmentPerformanceReport && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Department Performance Report</h2>
                <p className="text-gray-600">Department: {departmentPerformanceReport.department} | Campus: {departmentPerformanceReport.campus}</p>
              </div>
              <div className="text-sm text-gray-500">
                Generated: {new Date(departmentPerformanceReport.generatedAt).toLocaleDateString()}
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-100 rounded-3xl">
                <div className="text-2xl font-bold text-blue-400">{departmentPerformanceReport.summary.totalCourses}</div>
                <div className="text-sm text-gray-600">Total Courses</div>
              </div>
              
              <div className="text-center p-4 bg-green-100 rounded-3xl">
                <div className="text-2xl font-bold text-green-400">{departmentPerformanceReport.summary.totalInstructors}</div>
                <div className="text-sm text-gray-600">Total Instructors</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-100 rounded-3xl">
                <div className="text-2xl font-bold text-yellow-400">{departmentPerformanceReport.summary.totalSections}</div>
                <div className="text-sm text-gray-600">Total Sections</div>
              </div>
              
              <div className="text-center p-4 bg-purple-100 rounded-3xl">
                <div className="text-2xl font-bold text-purple-400">{departmentPerformanceReport.summary.avgPerformance}%</div>
                <div className="text-sm text-gray-600">Avg. Performance</div>
              </div>
              
              <div className="text-center p-4 bg-red-100 rounded-3xl">
                <div className="text-2xl font-bold text-red-400">{departmentPerformanceReport.summary.atRiskCourses}</div>
                <div className="text-sm text-gray-600">At-Risk Courses</div>
              </div>
            </div>
            
            {/* Grade Trends Table */}
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Trends</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departmentPerformanceReport.trends.map((trend, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trend.semester_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trend.average_grade}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(trend.average_grade)}`}>
                          { 
                           trend.average_grade >= 70 ? 'Good' : 
                           trend.average_grade < 70 ? 'At Risk' : 'Needs Improvement'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Instructors Performance Report */}
        {activeReport === 'all-instructors-performance' && allInstructorsPerformanceReport && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">All Instructors Performance</h2>
                <p className="text-gray-600">
                  Department: {allInstructorsPerformanceReport.department} | Campus: {allInstructorsPerformanceReport.campus}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Generated: {new Date().toLocaleDateString()}
              </div>
            </div>
            
            {/* All Instructors Performance Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instructor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Courses Taught
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CRNs
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allInstructorsPerformanceReport.instructors.map((instructor, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {instructor.instructor_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs overflow-hidden overflow-ellipsis">
                          {instructor.courses_taught.join(', ')}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        instructor.average_grade >= 70 ? 'text-green-600' : 
                        instructor.average_grade < 40 ? 'text-red-600' : 'text-red-600'
                      }`}>
                        {instructor.average_grade}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {instructor.sections_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {allInstructorsPerformanceReport.instructors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No instructors found in your department.</p>
              </div>
            )}
          </div>
        )}

        {/* Grade Trends Report */}
        {activeReport === 'grade-trends' && gradeTrendsReport && (
          <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Grade Trends Analysis</h2>
              <div className="text-sm text-gray-500">
                Generated: {new Date().toLocaleDateString()}
              </div>
            </div>
            
            {/* Trends Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gradeTrendsReport.map((trend, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trend.semester_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trend.average_grade}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(trend.average_grade)}`}>
                          {trend.average_grade >= 70 ? 'Good' : 
                           trend.average_grade < 70 ? 'At Risk' : 'Needs Improvement'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

export default DepartmentHeadReports;