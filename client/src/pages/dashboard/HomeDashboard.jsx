import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import apiService from '../../services/api';
import { Bar } from 'react-chartjs-2';

const HomeDashboard = () => {
  const { user } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [dashboardData, setDashboardData] = useState(null);
  const [crnComparisonData, setCrnComparisonData] = useState(null);
  const [selectedCrn1, setSelectedCrn1] = useState('');
  const [selectedCrn2, setSelectedCrn2] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    semesters: [],
    courses: [], // This will now be courseCodes
    departments: [],
    campuses: [],
    crns: []
  });
  const [students, setStudents] = useState([]); // Add state for student data
  const [instructorCourses, setInstructorCourses] = useState([]); // Add state for instructor courses
  const [courseCount, setCourseCount] = useState(0); // Add state for course count
  const [uniqueStudentCount, setUniqueStudentCount] = useState(0); // Add state for unique student count
  const [performanceAverage, setPerformanceAverage] = useState(0); // Add state for performance average
  const [sectionCount, setSectionCount] = useState(0); // Add state for section count
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [crnComparisonLoading, setCrnComparisonLoading] = useState(false); // New loading state for CRN comparison section
  
  // New state for filtered performance data
  const [filteredPerformance, setFilteredPerformance] = useState({
    averageGrade: 0,
    passRate: 0,
    totalSections: 0
  });
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false); // New loading state for performance section

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all required data in parallel
        const [data, studentData, instructorCoursesData, uniqueCoursesCountData, coursesWithDepartmentsData, performanceAverageData, sectionCountData, instructorCrnsData, filterOptionsData] = await Promise.all([
          apiService.getInstructorDashboard(),
          apiService.getInstructorStudents(), // Use the existing endpoint
          apiService.getInstructorCourses(), // Fetch instructor courses data
          apiService.getInstructorUniqueCoursesCount(), // Fetch unique courses count
          apiService.getInstructorCoursesWithDepartments(), // Fetch courses with department info
          apiService.getInstructorSectionBasedPerformanceAverage(), // Fetch section-based performance average
          apiService.getInstructorSectionCount(), // Fetch section count
          apiService.getInstructorCRNs(), // Fetch instructor CRNs
          apiService.getInstructorFilterOptions() // Fetch new filter options
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
        setSectionCount(sectionCountData?.total_sections || 0); // Set section count
        
        // Set filter options from the new API
        console.log('Filter options data:', filterOptionsData);
        setFilterOptions({
          semesters: filterOptionsData?.semesters?.sort() || [],
          courses: filterOptionsData?.courseCodes?.sort() || [], // Now using courseCodes
          departments: filterOptionsData?.departments?.sort() || [],
          campuses: filterOptionsData?.campuses?.sort() || [],
          crns: instructorCrnsData?.crns?.sort() || []
        });
        
        // Fetch initial filtered performance data (no filters applied)
        const initialPerformanceData = await apiService.getFilteredPerformance();
        setFilteredPerformance({
          averageGrade: initialPerformanceData?.averageGrade || 0,
          passRate: initialPerformanceData?.passRate || 0,
          totalSections: initialPerformanceData?.totalSections || 0
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Function to apply filters and fetch filtered performance data
  const applyFilters = async () => {
    try {
      setPerformanceLoading(true); // Set loading state for performance section only
      const courseCode = selectedCourse !== 'all' ? selectedCourse : null;
      const campus = selectedCampus !== 'all' ? selectedCampus : null;
      const semester = selectedSemester !== 'all' ? selectedSemester : null;
      const department = selectedDepartment !== 'all' ? selectedDepartment : null;
      
      const performanceData = await apiService.getFilteredPerformance(
        courseCode,
        campus,
        semester,
        department
      );
      
      setFilteredPerformance({
        averageGrade: performanceData?.averageGrade || 0,
        passRate: performanceData?.passRate || 0,
        totalSections: performanceData?.totalSections || 0
      });
      
      setFiltersApplied(
        selectedCourse !== 'all' || 
        selectedCampus !== 'all' || 
        selectedSemester !== 'all' || 
        selectedDepartment !== 'all'
      );
    } catch (err) {
      console.error('Error fetching filtered performance data:', err);
      setError('Failed to load filtered performance data');
    } finally {
      setPerformanceLoading(false); // Always reset loading state
    }
  };

  // Function to clear all filters
  const clearFilters = () => {
    setSelectedSemester('all');
    setSelectedCourse('all');
    setSelectedDepartment('all');
    setSelectedCampus('all');
    setFiltersApplied(false);
  };

  // Apply filters when any filter changes
  useEffect(() => {
    if (filterOptions.semesters.length > 0) { // Only apply after initial data load
      const timer = setTimeout(() => {
        applyFilters();
      }, 300); // Debounce filter application
      
      return () => clearTimeout(timer);
    }
  }, [selectedSemester, selectedCourse, selectedDepartment, selectedCampus]);

  const handleCrnComparison = async () => {
    if (!selectedCrn1 || !selectedCrn2) {
      setError('Please select two CRNs to compare');
      return;
    }
    
    try {
      setCrnComparisonLoading(true); // Set loading state for CRN comparison section only
      setError(null); // Clear any previous errors
      const comparisonData = await apiService.getInstructorCRNComparison(selectedCrn1, selectedCrn2);
      setCrnComparisonData(comparisonData);
    } catch (err) {
      console.error('Error fetching CRN comparison data:', err);
      setError('Failed to load CRN comparison data');
      setCrnComparisonData(null); // Clear previous comparison data on error
    } finally {
      setCrnComparisonLoading(false); // Always reset loading state
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
    return true;
  }) || [];

  // Use real data from Firebase or fallback to mock data
  const kpiData = dashboardData ? {
    totalStudents: sectionCount, // Use the section count instead of student count
    activeCourses: courseCount, // Use the course count from our new API endpoint
    avgPerformance: performanceAverage // Use the performance average from our new API endpoint
  } : {
    totalStudents: sectionCount, // Use the section count instead of student count
    activeCourses: courseCount, // Use the course count from our new API endpoint
    avgPerformance: performanceAverage // Use the performance average from our new API endpoint
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
        {/* Changed from 4 cards to 3 cards and updated grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          
          {/* Removed Grade Improvement Rate KPI card as requested */}
        </div>

        {/* Filter Section with Dropdowns and Bar Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Filter</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

            {/* Semester Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select 
                value={selectedSemester} 
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
              >
                <option value="all">All Semesters</option>
                {console.log('Semesters data:', filterOptions.semesters)}
                {filterOptions.semesters.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Performance Bar Chart or Loader */}
          <div className="h-80">
            {performanceLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6e63e5]"></div>
              </div>
            ) : (
              <Bar 
                data={{
                  labels: ['Average Grade', 'Pass Rate'],
                  datasets: [
                    {
                      label: 'Performance Metrics',
                      data: [filteredPerformance.averageGrade, filteredPerformance.passRate],
                      backgroundColor: ['#6e63e5', '#D3CEFC'],
                      borderColor: ['#6e63e5', '#D3CEFC'],
                      borderWidth: 1,
                      borderRadius: 10,
                      borderSkipped: false,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        callback: function(value) {
                          return value + '%';
                        }
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': ' + context.parsed.y + '%';
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
          
          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors"
            >
              Clear Filters
            </button>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            {filtersApplied 
              ? "Showing performance metrics for applied filters" 
              : "Showing overall performance metrics for all sections"}
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
                disabled={!selectedCrn1 || !selectedCrn2 || crnComparisonLoading}
                className="w-full px-4 py-2 bg-[#6e63e5] hover:bg-[#4c46a0] disabled:bg-gray-400 text-white rounded-xl transition-colors"
              >
                {crnComparisonLoading ? 'Comparing...' : 'Compare CRNs'}
              </button>
            </div>
          </div>
          
          {error && !crnComparisonLoading && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}
          
          {crnComparisonLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6e63e5]"></div>
            </div>
          ) : crnComparisonData ? (
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
          ) : null}
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