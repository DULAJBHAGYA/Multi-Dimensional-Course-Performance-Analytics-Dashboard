import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Mock data for users
  const [users, setUsers] = useState([
    { id: 1, name: 'Dr. Sarah Johnson', email: 'sarah.johnson@university.edu', role: 'instructor', status: 'active', dateCreated: '2024-01-15', lastLogin: '2024-01-20', courses: 12, students: 456, department: 'Mathematics' },
    { id: 2, name: 'Prof. Michael Chen', email: 'michael.chen@university.edu', role: 'instructor', status: 'active', dateCreated: '2024-01-10', lastLogin: '2024-01-19', courses: 8, students: 389, department: 'Computer Science' },
    { id: 3, name: 'Dr. Emily Rodriguez', email: 'emily.rodriguez@university.edu', role: 'instructor', status: 'active', dateCreated: '2024-01-08', lastLogin: '2024-01-18', courses: 15, students: 523, department: 'Physics' },
    { id: 4, name: 'Admin User', email: 'admin@university.edu', role: 'admin', status: 'active', dateCreated: '2024-01-01', lastLogin: '2024-01-20', courses: 0, students: 0, department: 'Administration' },
    { id: 5, name: 'Prof. David Kim', email: 'david.kim@university.edu', role: 'instructor', status: 'inactive', dateCreated: '2024-01-05', lastLogin: '2024-01-10', courses: 6, students: 234, department: 'Chemistry' },
    { id: 6, name: 'Dr. Lisa Thompson', email: 'lisa.thompson@university.edu', role: 'instructor', status: 'active', dateCreated: '2024-01-12', lastLogin: '2024-01-17', courses: 10, students: 312, department: 'Biology' },
    { id: 7, name: 'Dr. James Wilson', email: 'james.wilson@university.edu', role: 'instructor', status: 'active', dateCreated: '2024-01-14', lastLogin: '2024-01-19', courses: 7, students: 298, department: 'Engineering' },
    { id: 8, name: 'Prof. Maria Garcia', email: 'maria.garcia@university.edu', role: 'instructor', status: 'active', dateCreated: '2024-01-11', lastLogin: '2024-01-18', courses: 9, students: 367, department: 'Psychology' }
  ]);

  // Mock data for high-level metrics
  const platformMetrics = {
    totalInstructors: 89,
    totalCourses: 156,
    totalStudents: 1247,
    overallCompletionRate: 78.5,
    dropoutRate: 12.3,
    activeUsers: 892,
    inactiveUsers: 355,
    dailyLogins: 234,
    weeklyLogins: 1647
  };

  const coursesPerInstructor = [
    { instructor: 'Dr. Sarah Johnson', courses: 12 },
    { instructor: 'Dr. Emily Rodriguez', courses: 15 },
    { instructor: 'Dr. Lisa Thompson', courses: 10 },
    { instructor: 'Prof. Michael Chen', courses: 8 },
    { instructor: 'Prof. David Kim', courses: 6 }
  ];

  const studentGrowthData = [
    { month: 'Jan', students: 1200 },
    { month: 'Feb', students: 1250 },
    { month: 'Mar', students: 1300 },
    { month: 'Apr', students: 1350 },
    { month: 'May', students: 1400 },
    { month: 'Jun', students: 1450 }
  ];

  const roleDistribution = [
    { role: 'Instructors', count: 89, percentage: 89.9 },
    { role: 'Admins', count: 10, percentage: 10.1 }
  ];

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'instructor',
    password: '',
    department: ''
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = (e) => {
    e.preventDefault();
    const user = {
      id: Date.now(),
      ...newUser,
      status: 'active',
      dateCreated: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      courses: 0,
      students: 0
    };
    setUsers([...users, user]);
    setNewUser({ name: '', email: '', role: 'instructor', password: '', department: '' });
    setShowAddUserForm(false);
  };

  const handleEditUser = (userId) => {
    const user = users.find(u => u.id === userId);
    setEditingUser(user);
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editingUser } : u));
    setEditingUser(null);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const handleToggleUserStatus = (userId) => {
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ));
  };

  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'text-green-600 bg-green-100' 
      : 'text-red-600 bg-red-100';
  };

  const getRoleColor = (role) => {
    return role === 'admin' 
      ? 'text-purple-600 bg-purple-100' 
      : 'text-blue-600 bg-blue-100';
  };

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
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'metrics'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Platform Metrics
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'security'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Security Settings
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
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Roles</option>
                  <option value="instructor">Instructors</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
              <button
                onClick={() => setShowAddUserForm(true)}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
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
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Department</label>
                        <select
                          value={newUser.department}
                          onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Select Department</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Biology">Biology</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Psychology">Psychology</option>
                          <option value="Administration">Administration</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Auto-generate or set custom"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowAddUserForm(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
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
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          value={editingUser.name}
                          onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Department</label>
                        <select
                          value={editingUser.department}
                          onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Select Department</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Biology">Biology</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Psychology">Psychology</option>
                          <option value="Administration">Administration</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                          value={editingUser.status}
                          onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
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
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(user.status)}`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.courses}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.students}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditUser(user.id)}
                              className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Edit User"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            
                            {/* Toggle Status Button */}
                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className={`p-2 rounded-md transition-colors ${
                                user.status === 'active' 
                                  ? 'text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50' 
                                  : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                              }`}
                              title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                            >
                              {user.status === 'active' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                            
                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
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
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{platformMetrics.totalInstructors}</div>
                  <div className="text-sm text-gray-600">Total Instructors</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{platformMetrics.totalCourses}</div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{platformMetrics.totalStudents.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{platformMetrics.overallCompletionRate}%</div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{platformMetrics.dropoutRate}%</div>
                  <div className="text-sm text-gray-600">Dropout Rate</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{platformMetrics.activeUsers}</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{platformMetrics.inactiveUsers}</div>
                  <div className="text-sm text-gray-600">Inactive Users</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{platformMetrics.dailyLogins}</div>
                  <div className="text-sm text-gray-600">Daily Logins</div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Courses per Instructor Bar Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Courses per Instructor</h3>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {coursesPerInstructor.map((instructor, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="bg-blue-500 rounded-t w-full mb-2"
                        style={{ height: `${(instructor.courses / 15) * 150}px` }}
                        title={`${instructor.courses} courses`}
                      ></div>
                      <span className="text-xs text-gray-600 text-center">{instructor.instructor.split(' ')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Growth Line Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Growth Trend</h3>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {studentGrowthData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="bg-green-500 rounded-t w-full"
                        style={{ height: `${((data.students - 1200) / 250) * 150}px` }}
                        title={`${data.students} students`}
                      ></div>
                      <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Role Distribution Pie Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Distribution</h3>
              <div className="flex items-center justify-center">
                <div className="w-64 h-64 relative">
                  <div className="absolute inset-0 rounded-full border-8 border-blue-500" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)' }}></div>
                  <div className="absolute inset-0 rounded-full border-8 border-purple-500" style={{ clipPath: 'polygon(50% 50%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{roleDistribution[0].count + roleDistribution[1].count}</div>
                      <div className="text-sm text-gray-600">Total Users</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-center space-x-6">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Instructors ({roleDistribution[0].percentage}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Admins ({roleDistribution[1].percentage}%)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Control & Security Settings</h3>
              
              <div className="space-y-6">
                {/* Password Policy */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Password Policy</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Require strong passwords (8+ characters, mixed case, numbers)</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Force password reset every 90 days</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">Prevent password reuse (last 5 passwords)</span>
                    </label>
                  </div>
                </div>

                {/* Account Security */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Account Security</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Enable two-factor authentication for admins</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">Require email verification for new accounts</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Lock accounts after 5 failed login attempts</span>
                    </label>
                  </div>
                </div>

                {/* System Access */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">System Access</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Allow instructors to create courses</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">Require admin approval for new courses</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Enable user self-registration</span>
                    </label>
                  </div>
                </div>

                {/* Bulk Actions */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Bulk Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors">
                      Force Password Reset (All Users)
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors">
                      Deactivate Inactive Users
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                      Export User Data
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">
                      Send Welcome Emails
                    </button>
                  </div>
                </div>

                {/* Advanced Security Settings */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Advanced Security Settings</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">Enable IP whitelist for admin access</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Log all admin actions for audit trail</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">Require admin approval for instructor role changes</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Send security alerts for suspicious activities</span>
                    </label>
                  </div>
                </div>

                {/* System Maintenance */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">System Maintenance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Database Cleanup</h5>
                      <p className="text-xs text-gray-600 mb-3">Remove old logs and temporary data</p>
                      <button className="px-3 py-1 text-xs font-medium text-white bg-gray-600 hover:bg-gray-700 rounded transition-colors">
                        Clean Database
                      </button>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Cache Management</h5>
                      <p className="text-xs text-gray-600 mb-3">Clear system cache for better performance</p>
                      <button className="px-3 py-1 text-xs font-medium text-white bg-gray-600 hover:bg-gray-700 rounded transition-colors">
                        Clear Cache
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;