import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { generateBarChartData, generateLineChartData, generatePieChartData, getChartOptions } from '../../utils/chartUtils';

const CourseAnalytics = () => {
  const { user } = useAuth();
  const [courseCount, setCourseCount] = useState(0);
  const [sectionCount, setSectionCount] = useState(0);
  const [averageGrade, setAverageGrade] = useState(0);
  const [passRate, setPassRate] = useState(0);
  const [atRiskCoursesCount, setAtRiskCoursesCount] = useState(0);
  const [gradeDistributionData, setGradeDistributionData] = useState([]); // New state for grade distribution data
  const [coursePerformanceData, setCoursePerformanceData] = useState([]);
  const [atRiskCoursesData, setAtRiskCoursesData] = useState([]); // New state for at-risk courses data
  const [realSemesterComparisonData, setRealSemesterComparisonData] = useState([]); // New state for semester comparison data
  const [coursePassFailSummaryData, setCoursePassFailSummaryData] = useState([]); // New state for course pass-fail summary data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        // Fetch course count, section count, average grade, pass rate, at-risk courses count, grade distribution data, course performance data, at-risk courses data, semester comparison data, course performance comparison data, and course pass-fail summary data from the backend API
        const [courseCountResult, sectionCountResult, averageGradeResult, passRateResult, atRiskCoursesCountResult, gradeDistributionResult, coursePerformanceResult, atRiskCoursesResult, semesterComparisonResult, coursePerformanceComparisonResult, coursePassFailSummaryResult] = await Promise.all([
          apiService.getInstructorCourseCount(),
          apiService.getInstructorSectionCount(),
          apiService.getInstructorSectionBasedPerformanceAverage(),
          apiService.getInstructorPassRate(),
          apiService.getInstructorAtRiskRate(),
          apiService.getInstructorGradeDistribution(), // New API call for grade distribution data
          apiService.getInstructorCoursePerformance(),
          apiService.getInstructorAtRiskCourses(), // New API call for at-risk courses data
          apiService.getInstructorSemesterComparison(), // New API call for semester comparison data
          apiService.getInstructorCoursePerformanceComparison(), // New API call for course performance comparison data
          apiService.getInstructorCoursePassFailSummary() // New API call for course pass-fail summary data
        ]);
        setCourseCount(courseCountResult?.total_courses || 0);
        setSectionCount(sectionCountResult?.total_sections || 0);
        setAverageGrade(averageGradeResult?.avg_performance || 0);
        setPassRate(passRateResult?.pass_rate || 0);
        setAtRiskCoursesCount(atRiskCoursesCountResult?.at_risk_rate || 0);
        setGradeDistributionData(gradeDistributionResult?.assessments || []); // Set grade distribution data
        setCoursePerformanceData(coursePerformanceComparisonResult?.courses || []);
        setAtRiskCoursesData(atRiskCoursesResult?.courses || []); // Set at-risk courses data
        setRealSemesterComparisonData(semesterComparisonResult?.semesters || []); // Set semester comparison data
        setCoursePassFailSummaryData(coursePassFailSummaryResult?.courses || []); // Set course pass-fail summary data
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  // Mock data for all other KPIs
  const mockKpiData = {
    totalSections: sectionCount, // Use the real section count from backend
    averageGrade: averageGrade, // Use the real average grade from backend
    passRate: passRate, // Use the real pass rate from backend
    atRiskCoursesRate: atRiskCoursesCount, // Use the real at-risk courses count from backend
    totalCourses: courseCount // Use the real course count from backend
  };

  // Prepare grade distribution data for pie charts (using real data)
  const prepareGradeDistributionChartData = (assessmentType) => {
    // Find the assessment data for the specified type
    const assessmentData = gradeDistributionData.find(assessment => assessment.assessment_type === assessmentType);
    
    if (!assessmentData) {
      // Return mock data if no real data is available
      return {
        labels: ['A Grade', 'B Grade', 'C Grade', 'D Grade', 'F Grade'],
        datasets: [
          {
            data: [0, 0, 0, 0, 0],
            backgroundColor: [
              '#10B981', // A Grade - green
              '#3B82F6', // B Grade - blue
              '#F59E0B', // C Grade - yellow
              '#EF4444', // D Grade - red
              '#6B7280'  // F Grade - gray
            ],
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }
        ]
      };
    }
    
    const gradeData = assessmentData.grade_distribution;
    
    return {
      labels: ['A Grade', 'B Grade', 'C Grade', 'D Grade', 'F Grade'],
      datasets: [
        {
          data: [
            gradeData['A'] || 0,
            gradeData['B'] || 0,
            gradeData['C'] || 0,
            gradeData['D'] || 0,
            gradeData['F'] || 0
          ],
          backgroundColor: [
            '#10B981', // A Grade - green
            '#3B82F6', // B Grade - blue
            '#F59E0B', // C Grade - yellow
            '#EF4444', // D Grade - red
            '#6B7280'  // F Grade - gray
          ],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }
      ]
    };
  };

  // Prepare course performance comparison data for bar chart (using real data)
  const coursePerformanceChartData = {
    labels: coursePerformanceData.map(course => `${course.course_name} - ${course.campus}`),
    datasets: [
      {
        label: 'Average Performance Score',
        data: coursePerformanceData.map(course => course.average_grade),
        backgroundColor: coursePerformanceData.map((_, index) => 
          index % 2 === 0 ? '#6e63e5' : '#D3CEFC'  // Alternate between main color and light purple
        ),
        borderWidth: 0, // Remove borders from bars
        borderRadius: 15, // Border radius of 15px
        borderSkipped: false
      }
    ]
  };

  // Prepare semester comparison data for line chart (using real data)
  const semesterComparisonData = {
    labels: realSemesterComparisonData.length > 0 
      ? realSemesterComparisonData.map(semester => semester.semester_name)
      : [],
    datasets: [
      {
        label: 'Average Grade',
        data: realSemesterComparisonData.length > 0 
          ? realSemesterComparisonData.map(semester => semester.average_grade)
          : [],
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
              <h1 className="text-3xl font-semibold text-gray-900">Course Analytics</h1>
              <p className="text-gray-600 mt-2">Detailed insights into your course performance and student engagement</p>
            </div>
          </div>
        </div>

        {/* KPI Cards - Moved Total Courses to the first position */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {/* Total Courses - Now displayed first */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-2xl">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{mockKpiData.totalCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total CRNs</p>
                <p className="text-2xl font-bold text-gray-900">{mockKpiData.totalSections.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Changed from Active Students to Average Grade */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-pink-100 rounded-2xl">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Grade</p>
                <p className="text-2xl font-bold text-gray-900">{mockKpiData.averageGrade}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-2xl">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900">{mockKpiData.passRate}%</p>
              </div>
            </div>
          </div>

          {/* Changed from High Performance Rate to At Risk Courses Count with red color */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-2xl">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">At Risk Courses</p>
                <p className="text-2xl font-bold text-gray-900">{mockKpiData.atRiskCoursesRate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section - Modified to put Grade Distribution and Course Pass-Fail Summary side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Grade Distribution Pie Charts - Using real data */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution by Assessment Type</h3>
            <div className="space-y-6">
              {/* Quiz 1 Grade Distribution */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-2">Quiz 1</h4>
                <div className="h-48">
                  <Pie 
                    data={prepareGradeDistributionChartData("Quiz 1")} 
                    options={getChartOptions('pie', '')}
                  />
                </div>
              </div>
              
              {/* Midterm Exam Grade Distribution */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-2">Midterm Exam</h4>
                <div className="h-48">
                  <Pie 
                    data={prepareGradeDistributionChartData("Midterm Exam")} 
                    options={getChartOptions('pie', '')}
                  />
                </div>
              </div>
              
              {/* Final Exam Grade Distribution */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-2">Final Exam</h4>
                <div className="h-48">
                  <Pie 
                    data={prepareGradeDistributionChartData("Final Exam")} 
                    options={getChartOptions('pie', '')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Course Pass-Fail Summary - Replacing Pass Rate Summary */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Pass-Fail Summary</h3>
            <div className="space-y-4">
              {coursePassFailSummaryData && coursePassFailSummaryData.length > 0 ? (
                coursePassFailSummaryData.map((course, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-3xl">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{course.course_name}</p>
                      <p className="text-xs text-gray-500">
                        Pass: {course.pass_count} | Fail: {course.fail_count}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#6e63e5] h-2 rounded-full"
                          style={{ width: `${course.pass_percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{course.pass_percentage}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No course pass-fail data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Semester Comparison Line Chart - Now in its own row */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Semester Comparison</h3>
            <div className="h-64">
              <Line 
                data={semesterComparisonData} 
                options={getChartOptions('line', '')}
              />
            </div>
          </div>
        </div>

        {/* Course Performance Comparison */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Course Performance Comparison Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Performance Comparison</h3>
            <div className="h-64">
              <Bar 
                data={coursePerformanceChartData} 
                options={getChartOptions('bar', '')}
              />
            </div>
          </div>
        </div>

        {/* At Risk Courses */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">At Risk Courses</h3>
            <div className="overflow-x-auto">
              {atRiskCoursesData && atRiskCoursesData.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campus</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Grade</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {atRiskCoursesData.map((course, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{course.course_name}</div>
                          <div className="text-sm text-gray-500">{course.course_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.campus}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-red-600">{course.average_grade}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            At Risk
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No at-risk courses found. All courses are performing above the risk threshold.
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>* Courses with average grade below 40% are considered at risk</p>
            </div>
          </div>
        </div>

        {/* Student Engagement */}
        {/* Pass Rate Comparison section removed as requested */}
      </div>
    </DashboardLayout>
  );
};

export default CourseAnalytics;