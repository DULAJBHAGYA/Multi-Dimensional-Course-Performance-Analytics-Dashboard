import React from 'react';
import { useAuth, useAuthExtended } from '../../context/AuthContext';

const AuthTest = () => {
  const { user, isAuthenticated } = useAuth();
  const { hasPermission, getDashboardRoute, getDisplayName } = useAuthExtended();

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Auth Test Component</h3>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>Display Name: {getDisplayName()}</p>
      <p>Dashboard Route: {getDashboardRoute()}</p>
      {user && (
        <div>
          <p>User Role: {user.role}</p>
          <p>Has manage_users permission: {hasPermission('manage_users') ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

export default AuthTest;