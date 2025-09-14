import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import HomeDashboard from './pages/dashboard/HomeDashboard';
import CourseAnalytics from './pages/courseAnalytics/CourseAnalytics';
import PredictiveAnalytics from './pages/predictiveAnalytics/PredictiveAnalytics';
import ReportGeneration from './pages/reportGeneration/ReportGeneration';
import AdminPanel from './pages/admin/AdminPanel';

function App() {
  return (
    <AuthProvider>
      <FilterProvider>
        <Router>
          <div className="App">
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
              
              {/* Redirect any unknown routes to landing page */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </FilterProvider>
    </AuthProvider>
  );
}

export default App
