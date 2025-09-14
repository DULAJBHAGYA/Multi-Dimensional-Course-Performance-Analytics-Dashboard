import React from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/common/DashboardLayout';

const AdminPanel = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h2>
          <p className="text-gray-600 mb-6">This page will contain administrative controls and system management tools.</p>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-sm text-gray-500">Coming soon: User management, system settings, and administrative controls.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;
