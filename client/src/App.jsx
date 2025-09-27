import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import SessionManager from './components/common/SessionManager';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import HomeDashboard from './pages/dashboard/HomeDashboard';
import CourseAnalytics from './pages/courseAnalytics/CourseAnalytics';
import PredictiveAnalytics from './pages/predictiveAnalytics/PredictiveAnalytics';
import ReportGeneration from './pages/reportGeneration/ReportGeneration';
import AdminPanel from './pages/admin/AdminPanel';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReports from './pages/admin/AdminReports';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <FilterProvider>
          <Router>
          <div className="App">
            <SessionManager />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <HomeDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/course-analytics" 
                element={
                  <ProtectedRoute>
                    <CourseAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/predictive-analytics" 
                element={
                  <ProtectedRoute>
                    <PredictiveAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/report-generation" 
                element={
                  <ProtectedRoute>
                    <ReportGeneration />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-reports" 
                element={
                  <ProtectedRoute>
                    <AdminReports />
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirect any unknown routes to landing page */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </FilterProvider>
    </AuthProvider>
  </NotificationProvider>
  );
}

export default App
