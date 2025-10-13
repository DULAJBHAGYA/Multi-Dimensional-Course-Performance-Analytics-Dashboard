import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { generateBarChartData, generateLineChartData, generatePieChartData, getChartOptions } from '../../utils/chartUtils';
import apiService from '../../services/api';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campuses, setCampuses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [platformMetrics, setPlatformMetrics] = useState({
    totalInstructors: 0,
    totalCourses: 0,
    totalDepartmentHeads: 0,
    totalAdmins: 0
  });
  const [roleDistribution, setRoleDistribution] = useState([
    { role: 'Instructors', count: 0, percentage: 0 },
    { role: 'Admins', count: 0, percentage: 0 },
    { role: 'Department Heads', count: 0, percentage: 0 }
  ]);
  const [coursePopularityData, setCoursePopularityData] = useState([]);
  const [campusPerformanceData, setCampusPerformanceData] = useState([]);
  const [campusPerformanceLoading, setCampusPerformanceLoading] = useState(false);

  
  // Memoized fetch functions with error handling
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const usersData = await apiService.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlatformMetrics = useCallback(async () => {
    try {
      const metricsData = await apiService.getAdminPlatformMetrics();
      setPlatformMetrics(metricsData);
      
      // Calculate percentages for role distribution
      const totalUsers = metricsData.totalInstructors + metricsData.totalAdmins + metricsData.totalDepartmentHeads;
      const roleDistributionData = [
        { 
          role: 'Instructors', 
          count: metricsData.totalInstructors,
          percentage: totalUsers > 0 ? Math.round((metricsData.totalInstructors / totalUsers) * 100) : 0
        },
        { 
          role: 'Admins', 
          count: metricsData.totalAdmins,
          percentage: totalUsers > 0 ? Math.round((metricsData.totalAdmins / totalUsers) * 100) : 0
        },
        { 
          role: 'Department Heads', 
          count: metricsData.totalDepartmentHeads,
          percentage: totalUsers > 0 ? Math.round((metricsData.totalDepartmentHeads / totalUsers) * 100) : 0
        }
      ];
      setRoleDistribution(roleDistributionData);
    } catch (err) {
      console.error('Failed to fetch platform metrics:', err);
    }
  }, []);

  const fetchCoursePopularity = useCallback(async () => {
    try {
      const popularityData = await apiService.getAdminCoursePopularity();
      setCoursePopularityData(popularityData);
    } catch (err) {
      console.error('Failed to fetch course popularity data:', err);
    }
  }, []);

  const fetchCampusPerformance = useCallback(async () => {
    try {
      setCampusPerformanceLoading(true);
      const performanceData = await apiService.getAdminCampusPerformance();
      setCampusPerformanceData(performanceData);
    } catch (err) {
      console.error('Failed to fetch campus performance data:', err);
    } finally {
      setCampusPerformanceLoading(false);
    }
  }, []);





  // Fetch users when activeTab is 'users'
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // Fetch platform metrics and course popularity when activeTab is 'metrics'
  useEffect(() => {
    if (activeTab === 'metrics') {
      fetchPlatformMetrics();
      fetchCoursePopularity();
      fetchCampusPerformance();
    }
  }, [activeTab, fetchPlatformMetrics, fetchCoursePopularity, fetchCampusPerformance]);



  // Chart data using Chart.js format
  const coursesPerInstructor = []; // This would need to be fetched from API in a real implementation
  const studentGrowthData = [
    { month: 'Jan', students: 1200 },
    { month: 'Feb', students: 1250 },
    { month: 'Mar', students: 1300 },
    { month: 'Apr', students: 1350 },
    { month: 'May', students: 1400 },
    { month: 'Jun', students: 1450 }
  ];

  const coursesPerInstructorChartData = generateBarChartData(coursesPerInstructor, 'instructor', 'courses', 'Courses');
  const studentGrowthChartData = generateLineChartData(studentGrowthData, 'month', 'students', 'Students');
  
  // Custom role distribution chart data with custom colors
  const roleDistributionChartData = {
    labels: roleDistribution.map(item => item.role),
    datasets: [{
      data: roleDistribution.map(item => item.count),
      backgroundColor: [
        '#6e63e5', // Purple for Instructors
        '#d3cefc', // Light purple for Admins
        '#fbbf24'  // Amber for Department Heads
      ],
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverBackgroundColor: [
        '#7C3AED', // Darker purple on hover
        '#D97706', // Darker amber on hover
        '#f59e0b'  // Darker amber for Department Heads on hover
      ],
      hoverBorderColor: '#ffffff',
      hoverBorderWidth: 4,
    }]
  };

  // Course distribution chart data with performance optimizations
  const courseDistributionChartData = {
    labels: coursePopularityData.map(course => course.department),
    datasets: [
      {
        label: '',
        data: coursePopularityData.map(course => course.total_courses),
        backgroundColor: coursePopularityData.map((_, index) => 
          index % 2 === 0 ? '#6e63e5' : '#D3CEFC'  // Alternate between purple and light purple
        ),
        borderWidth: 0,  // Remove border by setting width to 0
        hoverBackgroundColor: coursePopularityData.map((_, index) => 
          index % 2 === 0 ? '#7C3AED' : '#d3cefc'  // Hover colors
        ),
        borderRadius: 20,
        borderSkipped: false
      }
    ]
  };

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'instructor',
    password: '',
    department: '',
    campus: ''
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const renderDepartmentOptions = () => {
    return departments.map((department) => (
      <option key={department} value={department}>{department}</option>
    ));
  };

  const renderCampusOptions = () => {
    return campuses.map((campus) => (
      <option key={campus} value={campus}>{campus}</option>
    ));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Call API to create user
      const userData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        password: newUser.password,
        department: newUser.department,
        campus: newUser.campus,
        username: newUser.email.split('@')[0]
      };
      
      const createdUser = await apiService.createUser(userData);
      
      // Add the created user to the state
      setUsers([...users, createdUser]);
      
      // Reset form and close modal
      setNewUser({ name: '', email: '', role: 'instructor', password: '', department: '', campus: '' });
      setShowAddUserForm(false);
    } catch (err) {
      console.error('Failed to create user:', err);
      alert('Failed to create user: ' + (err.message || 'Unknown error'));
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      // Call API to update user
      const userData = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        department: editingUser.department,
        campus: editingUser.campus
      };
      
      const updatedUser = await apiService.updateUser(editingUser.id, userData);
      
      // Update the user in the state
      setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
      
      // Close modal
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update user:', err);
      alert('Failed to update user: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        // Call API to delete user
        await apiService.deleteUser(userId);
        
        // Remove the user from the state
        setUsers(users.filter(u => u.id !== userId));
      } catch (err) {
        console.error('Failed to delete user:', err);
        alert('Failed to delete user: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const getRoleColor = (role) => {
    if (role === 'admin') {
      return 'text-[#6e63e5] bg-[#D3CEFC]';
    } else if (role === 'department_head') {  // Add color for department heads
      return 'text-amber-600 bg-amber-100';
    } else {
      return 'text-blue-400 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6e63e5]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => {
              setError(null);
              if (activeTab === 'users') {
                fetchUsers();
              } else if (activeTab === 'metrics') {
                fetchPlatformMetrics();
                fetchCoursePopularity();
              }
            }}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 flex items-center">
            Admin Panel
          </h1>
          <p className="text-gray-600 mt-2">User management and platform administration</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-[#6e63e5] text-[#6e63e5]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'metrics'
                    ? 'border-[#6e63e5] text-[#6e63e5]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Platform Metrics
              </button>
            </nav>
          </div>
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Management Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                  />
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                >
                  <option value="all">All Roles</option>
                  <option value="instructor">Instructors</option>
                  <option value="admin">Admins</option>
                  <option value="department_head">Department Heads</option>  {/* Add department head option */}
                </select>
              </div>
              <button
                onClick={() => setShowAddUserForm(true)}
                className="flex items-center px-4 py-2 bg-[#6e63e5] hover:bg-[#4c46a0] text-white rounded-2xl text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New User
              </button>
            </div>

            {/* Add User Form Modal */}
            {showAddUserForm && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-3xl bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                        >
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                          <option value="department_head">Department Head</option>  {/* Add department head option */}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Department</label>
                        <select
                          value={newUser.department}
                          onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                        >
                          <option value="">Select Department</option>
                          {renderDepartmentOptions()}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Campus</label>
                        <select
                          value={newUser.campus}
                          onChange={(e) => setNewUser({ ...newUser, campus: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                        >
                          <option value="">Select Campus</option>
                          {renderCampusOptions()}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                          placeholder="Auto-generate or set custom"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowAddUserForm(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-[#6e63e5] hover:bg-[#4c46a0] rounded-2xl transition-colors"
                        >
                          Add User
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Edit User Form Modal */}
            {editingUser && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-2xl bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          value={editingUser.name}
                          onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                        >
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                          <option value="department_head">Department Head</option>  {/* Add department head option */}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Department</label>
                        <select
                          value={editingUser.department}
                          onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                        >
                          <option value="">Select Department</option>
                          {renderDepartmentOptions()}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Campus</label>
                        <select
                          value={editingUser.campus}
                          onChange={(e) => setEditingUser({ ...editingUser, campus: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e63e5]"
                        >
                          <option value="">Select Campus</option>
                          {renderCampusOptions()}
                        </select>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-[#6e63e5] hover:bg-[#4c46a0] rounded-2xl transition-colors"
                        >
                          Update User
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campus</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.campus || 'Not assigned'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditUser(user.id)}
                              className="p-2 text-[#6e63e5] hover:bg-[#D3CEFC] rounded-md transition-colors"
                              title="Edit User"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            
                            
                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"
                              title="Delete User"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Platform Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* High-Level Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#6e63e5]">{platformMetrics.totalInstructors}</div>
                  <div className="text-sm text-gray-600">Total Instructors</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#6e63e5]">{platformMetrics.totalCourses}</div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#6e63e5]">{platformMetrics.totalDepartmentHeads.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Department Heads</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#6e63e5]">{platformMetrics.totalAdmins}</div>
                  <div className="text-sm text-gray-600">Total Admins</div>
                </div>
              </div>
            </div>

            {/* Course Distribution Bar Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Distribution by Department</h3>
              <div className="h-64">
                <Bar 
                  data={courseDistributionChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#6e63e5',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                      }
                    },
                    scales: {
                      x: {
                        display: true,
                        grid: {
                          display: false,
                        },
                        ticks: {
                          color: '#6B7280',
                          font: {
                            size: 12
                          }
                        }
                      },
                      y: {
                        display: true,
                        grid: {
                          color: '#F3F4F6',
                        },
                        ticks: {
                          color: '#6B7280',
                          font: {
                            size: 12
                          }
                        },
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Role Distribution Pie Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Distribution</h3>
              <div className="h-64">
                <Pie 
                  data={roleDistributionChartData} 
                  options={getChartOptions('pie', '')}
                />
              </div>
              {/* Role Distribution Legend */}
              <div className="flex justify-center mt-4 space-x-8">
                {roleDistribution.map((item, index) => (
                  <div key={item.role} className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ 
                        backgroundColor: index === 0 ? '#6e63e5' : index === 1 ? '#d3cefc' : '#fbbf24' 
                      }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {item.role}: {item.count} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Metrics Table */}
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campus Performance Metrics</h3>
              {campusPerformanceLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6e63e5]"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campus ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campus</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Grade</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {campusPerformanceData && campusPerformanceData.length > 0 ? (
                        campusPerformanceData.map((campus, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campus.campus_id || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campus.campus || 'Unknown'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campus.averageGrade !== undefined ? `${campus.averageGrade}%` : 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                            No campus performance data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;