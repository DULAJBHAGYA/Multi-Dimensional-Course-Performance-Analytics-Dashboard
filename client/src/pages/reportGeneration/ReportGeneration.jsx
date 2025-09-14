import React from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';

const ReportGeneration = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Generation</h2>
          <p className="text-gray-600 mb-6">This page will contain report generation tools and export functionality.</p>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-sm text-gray-500">Coming soon: PDF generation, Excel exports, and customizable report templates.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportGeneration;
