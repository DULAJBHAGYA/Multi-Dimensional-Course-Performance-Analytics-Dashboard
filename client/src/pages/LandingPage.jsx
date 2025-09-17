import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Development Navigation */}
      <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-lg shadow-lg">
        <div className="text-xs font-mono">
          <div className="mb-1">Dev Navigation:</div>
          <div className="space-y-1">
            <Link to="/" className="block text-blue-300 hover:text-blue-100">Landing</Link>
            <Link to="/login" className="block text-green-300 hover:text-green-100">Login</Link>
            <button 
              onClick={() => {
                localStorage.setItem('user', JSON.stringify({
                  email: 'instructor@example.com',
                  name: 'Instructor User',
                  role: 'instructor',
                  id: 'instructor-user'
                }));
                window.location.href = '/dashboard';
              }}
              className="block text-yellow-300 hover:text-yellow-100 w-full text-left"
            >
              Login as Instructor
            </button>
            <button 
              onClick={() => {
                localStorage.setItem('user', JSON.stringify({
                  email: 'admin@example.com',
                  name: 'Admin User',
                  role: 'admin',
                  id: 'admin-user'
                }));
                window.location.href = '/dashboard';
              }}
              className="block text-red-300 hover:text-red-100 w-full text-left"
            >
              Login as Admin
            </button>
            <Link to="/dashboard" className="block text-yellow-300 hover:text-yellow-100">Dashboard</Link>
            <Link to="/course-analytics" className="block text-purple-300 hover:text-purple-100">Course Analytics</Link>
            <Link to="/predictive-analytics" className="block text-pink-300 hover:text-pink-100">Predictive</Link>
            <Link to="/report-generation" className="block text-orange-300 hover:text-orange-100">Reports</Link>
            <Link to="/admin" className="block text-red-300 hover:text-red-100">Admin</Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[#6e63e5]">EduAnalytics</h1>
            </div>
            <div className="flex space-x-4">
              <Link 
                to="/login" 
                className="bg-[#6e63e5] hover:bg-[#4c46a0] text-white px-4 py-2 rounded-2xl text-md font-medium transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-4">
        <div className="text-center">
          <h1 className="text-3xl md:text-7xl font-semibold text-gray-900 mb-4">
            Multi-Dimensional Course
            <span className="text-[#6e63e5] block">Performance Analytics</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock insights into student performance with advanced analytics, predictive modeling, 
            and comprehensive reporting for educational institutions.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-8 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Powerful Analytics Features</h2>
            <p className="text-xl text-gray-600">Everything you need to understand and improve course performance</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-gray-100 p-4 rounded-3xl">
              <div className="w-10 h-10 bg-[#d3cefc] rounded-2xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#6e63e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Analytics</h3>
              <p className="text-md text-gray-600">Comprehensive analysis of course performance metrics and student engagement.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-100 p-4 rounded-3xl">
              <div className="w-10 h-10 bg-[#d3cefc] rounded-2xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#6e63e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Predictive Analytics</h3>
              <p className="text-md text-gray-600">AI-powered predictions to identify at-risk students and optimize strategies.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-100 p-4 rounded-3xl">
              <div className="w-10 h-10 bg-[#d3cefc] rounded-2xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#6e63e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Generation</h3>
              <p className="text-md text-gray-600">Generate detailed reports and visualizations for stakeholders.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-100 p-4 rounded-3xl">
              <div className="w-10 h-10 bg-[#d3cefc] rounded-2xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#6e63e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Insights</h3>
              <p className="text-md text-gray-600">Deep dive into individual student performance patterns.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-100 p-4 rounded-3xl">
              <div className="w-10 h-10 bg-[#d3cefc] rounded-2xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#6e63e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Monitoring</h3>
              <p className="text-md text-gray-600">Live dashboards and alerts to track performance metrics.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-100 p-4 rounded-3xl">
              <div className="w-10 h-10 bg-[#d3cefc] rounded-2xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#6e63e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customizable Dashboards</h3>
              <p className="text-md text-gray-600">Tailor your analytics experience with customizable dashboards.</p>
            </div>
          </div>
        </div>
      </div>

     

      {/* Footer */}
      <footer className="bg-white text-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-gray-500 text-md">
              &copy; 2025 EduAnalytics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
