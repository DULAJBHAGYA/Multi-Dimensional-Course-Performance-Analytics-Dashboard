import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';
import { Bar } from 'react-chartjs-2';

const HomeDashboard = () => {
  const { user } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [selectedCRN, setSelectedCRN] = useState('all');
  const [dashboardData, setDashboardData] = useState(null);
  const [crnComparisonData, setCrnComparisonData] = useState(null);
  const [selectedCrn1, setSelectedCrn1] = useState('');
  const [selectedCrn2, setSelectedCrn2] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    semesters: [],
    courses: [],
    departments: [],
    campuses: [],
    crns: []
  });
  const [students, setStudents] = useState([]); // Add state for student data
  const [instructorCourses, setInstructorCourses] = useState([]); // Add state for instructor courses
  const [courseCount, setCourseCount] = useState(0); // Add state for course count
  const [uniqueStudentCount, setUniqueStudentCount] = useState(0); // Add state for unique student count
  const [performanceAverage, setPerformanceAverage] = useState(0); // Add state for performance average
  const [gradeImprovement, setGradeImprovement] = useState(0); // Add state for grade improvement
  const [sectionCount, setSectionCount] = useState(0); // Add state for section count
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all required data in parallel
        const [data, studentData, instructorCoursesData, uniqueCoursesCountData, coursesWithDepartmentsData, performanceAverageData, sectionCountData, instructorCrnsData] = await Promise.all([
          apiService.getInstructorDashboard(),
          apiService.getInstructorStudents(), // Use the existing endpoint
          apiService.getInstructorCourses(), // Fetch instructor courses data
          apiService.getInstructorUniqueCoursesCount(), // Fetch unique courses count
          apiService.getInstructorCoursesWithDepartments(), // Fetch courses with department info
          apiService.getInstructorSectionBasedPerformanceAverage(), // Fetch section-based performance average
          apiService.getInstructorSectionCount(), // Fetch section count
          apiService.getInstructorCRNs() // Fetch instructor CRNs
        ]);
        
        setDashboardData(data);
        setStudents(studentData || []); // Set students data from the existing endpoint
        setInstructorCourses(coursesWithDepartmentsData?.courses || []); // Set instructor courses data with department info
        
        // Set course count from unique courses count data
        const courseCount = uniqueCoursesCountData?.unique_courses_count || 0;
        setCourseCount(courseCount);
        
        // Derive unique student count from student data
        const uniqueStudentCount = studentData ? studentData.length : 0;
        setUniqueStudentCount(uniqueStudentCount);
        
        setPerformanceAverage(performanceAverageData?.avg_performance || 0); // Set performance average
        setGradeImprovement(0); // Set grade improvement to 0 since we removed the grade distribution endpoint
        setSectionCount(sectionCountData?.total_sections || 0); // Set section count
        
        // Extract filter options from the data
        if (data && data.courses) {
          const semesters = [...new Set(data.courses.map(course => course.semesterName).filter(Boolean))];
          const courses = [...new Set(data.courses.map(course => course.courseName).filter(Boolean))];
          const departments = [...new Set(data.courses.map(course => course.department).filter(Boolean))];
          const campuses = [...new Set(data.courses.map(course => course.campusName).filter(Boolean))];
          
          // Use CRNs from the dedicated endpoint
          const crns = instructorCrnsData?.crns || [];
          
          setFilterOptions({
            semesters: semesters.sort(),
            courses: courses.sort(),
            departments: departments.sort(),
            campuses: campuses.sort(),
            crns: crns.sort()
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleCrnComparison = async () => {
    if (!selectedCrn1 || !selectedCrn2) {
      setError('Please select two CRNs to compare');
      return;
    }
    
    try {
      setLoading(true);
      const comparisonData = await apiService.getInstructorCRNComparison(selectedCrn1, selectedCrn2);
      setCrnComparisonData(comparisonData);
      setError(null);
    } catch (err) {
      console.error('Error fetching CRN comparison data:', err);
      setError('Failed to load CRN comparison data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !crnComparisonData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#6e63e5]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !crnComparisonData) {
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

  // Process course data first (before kpiData calculation)
  const courseData = dashboardData?.courses?.map(course => ({
    name: course.courseName || course.name,
    students: course.total_students || 0,
    performance: course.average_performance || 0,
    status: 'active',
    semesterName: course.semesterName,
    department: course.department,
    campusName: course.campusName,
    crnCode: course.crnCode
  })).filter(course => {
    // Apply filters
    if (selectedSemester !== 'all' && course.semesterName !== selectedSemester) return false;
    if (selectedCourse !== 'all' && course.name !== selectedCourse) return false;
    if (selectedDepartment !== 'all' && course.department !== selectedDepartment) return false;
    if (selectedCampus !== 'all' && course.campusName !== selectedCampus) return false;
    if (selectedCRN !== 'all' && course.crnCode !== selectedCRN) return false;
    return true;
  }) || [];

  // Use real data from Firebase or fallback to mock data
  const kpiData = dashboardData ? {
    totalStudents: sectionCount, // Use the section count instead of student count
    activeCourses: courseCount, // Use the course count from our new API endpoint
    avgPerformance: performanceAverage, // Use the performance average from our new API endpoint
    completionRate: gradeImprovement // Use the grade improvement from our new API endpoint and rename the KPI
  } : {
    totalStudents: sectionCount, // Use the section count instead of student count
    activeCourses: courseCount, // Use the course count from our new API endpoint
    avgPerformance: performanceAverage, // Use the performance average from our new API endpoint
    completionRate: gradeImprovement // Use the grade improvement from our new API endpoint and rename the KPI
  };

  // Prepare CRN comparison chart data if available
  // This section is not used as we have a dedicated chart for CRN comparison

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Welcome back, {user?.name || 'Instructor'}!</h1>
              <p className="text-gray-600 mt-2">Here's what's happening with your courses today</p>
            </div>
          </div>
        </div>

        {/* KPI Cards - Moved to top */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sections</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.totalStudents.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-pink-100 rounded-2xl">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.activeCourses}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-2xl">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.avgPerformance}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-[#D3CEFC] rounded-2xl">
                <svg className="w-6 h-6 text-[#6e63e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Grade Improvement Rate</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.completionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Dashboard Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Semester Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select 
                value={selectedSemester} 
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="all">All Semesters</option>
                {filterOptions.semesters.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </div>

            {/* Course Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="all">All Courses</option>
                {filterOptions.courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select 
                value={selectedDepartment} 
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="all">All Departments</option>
                {filterOptions.departments.map(department => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>

            {/* Campus Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
              <select 
                value={selectedCampus} 
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="all">All Campuses</option>
                {filterOptions.campuses.map(campus => (
                  <option key={campus} value={campus}>{campus}</option>
                ))}
              </select>
            </div>

            {/* CRN Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CRN</label>
              <select 
                value={selectedCRN} 
                onChange={(e) => setSelectedCRN(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="all">All CRNs</option>
                {filterOptions.crns.map(crn => (
                  <option key={crn} value={crn}>{crn}</option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <select 
                value={selectedTimeRange} 
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active Filters:</span>
              <div className="flex flex-wrap gap-2">
                {selectedSemester !== 'all' && (
                  <span className="px-2 py-1 bg-[#6e63e5] text-white text-xs rounded-full">Semester: {selectedSemester}</span>
                )}
                {selectedCourse !== 'all' && (
                  <span className="px-2 py-1 bg-[#6e63e5] text-white text-xs rounded-full">Course: {selectedCourse}</span>
                )}
                {selectedDepartment !== 'all' && (
                  <span className="px-2 py-1 bg-[#6e63e5] text-white text-xs rounded-full">Department: {selectedDepartment}</span>
                )}
                {selectedCampus !== 'all' && (
                  <span className="px-2 py-1 bg-[#6e63e5] text-white text-xs rounded-full">Campus: {selectedCampus}</span>
                )}
                {selectedCRN !== 'all' && (
                  <span className="px-2 py-1 bg-[#6e63e5] text-white text-xs rounded-full">CRN: {selectedCRN}</span>
                )}
              </div>
            </div>
            <button 
              onClick={() => {
                setSelectedSemester('all');
                setSelectedCourse('all');
                setSelectedDepartment('all');
                setSelectedCampus('all');
                setSelectedCRN('all');
                setSelectedTimeRange('30d');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:border-gray-400 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* CRN Comparison Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CRN Performance Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select First CRN</label>
              <select 
                value={selectedCrn1} 
                onChange={(e) => setSelectedCrn1(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="">Select CRN</option>
                {filterOptions.crns.map(crn => (
                  <option key={crn} value={crn}>{crn}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Second CRN</label>
              <select 
                value={selectedCrn2} 
                onChange={(e) => setSelectedCrn2(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="">Select CRN</option>
                {filterOptions.crns.map(crn => (
                  <option key={crn} value={crn}>{crn}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={handleCrnComparison}
                disabled={!selectedCrn1 || !selectedCrn2 || loading}
                className="w-full px-4 py-2 bg-[#6e63e5] hover:bg-[#4c46a0] disabled:bg-gray-400 text-white rounded-xl transition-colors"
              >
                Compare CRNs
              </button>
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}
          
          {crnComparisonData && (
            <div className="mt-6">
              {/* Average Performance Comparison Bar Chart */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Average Performance Comparison</h4>
                <div className="h-64">
                  <Bar 
                    data={{
                      labels: [
                        `${crnComparisonData.crn1.courseName} - ${crnComparisonData.crn1.campus}`,
                        `${crnComparisonData.crn2.courseName} - ${crnComparisonData.crn2.campus}`
                      ],
                      datasets: [
                        {
                          label: 'Average Grade',
                          data: [crnComparisonData.crn1.averageGrade, crnComparisonData.crn2.averageGrade],
                          backgroundColor: ['#6e63e5', '#D3CEFC'],
                          borderColor: ['#6e63e5', '#D3CEFC'],
                          borderWidth: 1,
                          borderRadius: 10, // 10px border radius for all corners
                          borderSkipped: false, // Ensure borders are not skipped on any corners
                        }
                      ]
                    }}
                  />
                </div>
                <div className="mt-2 text-center text-sm text-gray-600">
                  Better Average Grade: {crnComparisonData.comparison.betterAverageGrade} 
                  (Difference: {Math.abs(crnComparisonData.comparison.averageGradeDifference).toFixed(2)})
                </div>
              </div>
              
              {/* Detailed CRN Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-2xl p-4">
                  <h5 className="font-medium text-gray-900 mb-3">{crnComparisonData.crn1.crn} - {crnComparisonData.crn1.courseName}</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Course Code:</span>
                      <span className="font-medium">{crnComparisonData.crn1.courseCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{crnComparisonData.crn1.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Campus:</span>
                      <span className="font-medium">{crnComparisonData.crn1.campus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Grade:</span>
                      <span className="font-medium">{crnComparisonData.crn1.averageGrade}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-2xl p-4">
                  <h5 className="font-medium text-gray-900 mb-3">{crnComparisonData.crn2.crn} - {crnComparisonData.crn2.courseName}</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Course Code:</span>
                      <span className="font-medium">{crnComparisonData.crn2.courseCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{crnComparisonData.crn2.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Campus:</span>
                      <span className="font-medium">{crnComparisonData.crn2.campus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Grade:</span>
                      <span className="font-medium">{crnComparisonData.crn2.averageGrade}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Course Overview - Single Column Layout (Removed Students Column) */}
        <div className="bg-white rounded-3xl shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Courses</h3>
          </div>
          <div className="p-6">
            {instructorCourses && instructorCourses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {instructorCourses.map((course, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.course_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.course_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.department}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No course data available
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HomeDashboard;