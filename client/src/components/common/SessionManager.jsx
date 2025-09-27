import React, { useEffect, useState } from 'react';
import { useAuthExtended } from '../../context/AuthContext';

const SessionManager = () => {
  const { user, logout, refreshUser, isSessionExpiring } = useAuthExtended();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      if (isSessionExpiring()) {
        const loginTime = new Date(user.loginTime);
        const now = new Date();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        const expiryTime = new Date(loginTime.getTime() + sessionDuration);
        const remaining = Math.max(0, expiryTime.getTime() - now.getTime());
        
        setTimeLeft(Math.floor(remaining / 1000 / 60)); // minutes
        setShowWarning(true);

        // Auto logout when session expires
        if (remaining <= 0) {
          logout();
        }
      }
    };

    // Check session status every minute
    const interval = setInterval(checkSession, 60000);
    checkSession(); // Check immediately

    return () => clearInterval(interval);
  }, [user, isSessionExpiring, logout]);

  const handleExtendSession = async () => {
    try {
      await refreshUser();
      setShowWarning(false);
    } catch (error) {
      console.error('Failed to extend session:', error);
      logout();
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Session Expiring Soon
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your session will expire in {timeLeft} minutes. Would you like to extend it?
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleExtendSession}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-lg hover:bg-yellow-200 transition-colors"
              >
                Extend Session
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-lg hover:bg-red-200 transition-colors"
              >
                Logout Now
              </button>
            </div>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              onClick={() => setShowWarning(false)}
              className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;