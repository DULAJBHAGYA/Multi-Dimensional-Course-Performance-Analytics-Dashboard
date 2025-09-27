// Authentication utilities and helpers

/**
 * Check if a password meets minimum security requirements
 */
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calculate password strength score (0-100)
 */
export const calculatePasswordStrength = (password) => {
  let score = 0;
  
  // Length bonus
  score += Math.min(password.length * 4, 40);
  
  // Character variety bonus
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
  
  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/123|abc|qwerty/i.test(password)) score -= 15; // Common patterns
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (score) => {
  if (score < 30) return { label: 'Weak', color: 'red' };
  if (score < 60) return { label: 'Fair', color: 'yellow' };
  if (score < 80) return { label: 'Good', color: 'blue' };
  return { label: 'Strong', color: 'green' };
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(email),
    error: emailRegex.test(email) ? null : 'Please enter a valid email address'
  };
};

/**
 * Generate a secure random password
 */
export const generateSecurePassword = (length = 12) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each category
  const categories = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    '!@#$%^&*'
  ];
  
  // Add one character from each category
  categories.forEach(category => {
    password += category.charAt(Math.floor(Math.random() * category.length));
  });
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Format session duration for display
 */
export const formatSessionDuration = (startTime) => {
  if (!startTime) return 'Unknown';
  
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now - start;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

/**
 * Check if session is about to expire
 */
export const isSessionNearExpiry = (loginTime, sessionDurationHours = 24, warningHours = 0.5) => {
  if (!loginTime) return false;
  
  const start = new Date(loginTime);
  const now = new Date();
  const sessionDurationMs = sessionDurationHours * 60 * 60 * 1000;
  const warningMs = warningHours * 60 * 60 * 1000;
  const expiry = new Date(start.getTime() + sessionDurationMs);
  const warningTime = new Date(expiry.getTime() - warningMs);
  
  return now >= warningTime && now < expiry;
};

/**
 * Get time remaining in session
 */
export const getSessionTimeRemaining = (loginTime, sessionDurationHours = 24) => {
  if (!loginTime) return 0;
  
  const start = new Date(loginTime);
  const now = new Date();
  const sessionDurationMs = sessionDurationHours * 60 * 60 * 1000;
  const expiry = new Date(start.getTime() + sessionDurationMs);
  
  return Math.max(0, expiry.getTime() - now.getTime());
};

/**
 * Format time remaining for display
 */
export const formatTimeRemaining = (milliseconds) => {
  const totalMinutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

/**
 * Local storage helpers with error handling
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

/**
 * Role-based permission checking
 */
export const permissions = {
  admin: [
    'manage_users',
    'view_all_analytics',
    'manage_courses',
    'manage_system',
    'view_reports',
    'manage_settings',
    'manage_campuses',
    'manage_semesters',
    'view_admin_dashboard'
  ],
  instructor: [
    'view_own_analytics',
    'manage_own_courses',
    'view_students',
    'create_assignments',
    'view_reports',
    'manage_announcements',
    'grade_assignments',
    'view_instructor_dashboard'
  ],
  student: [
    'view_own_progress',
    'submit_assignments',
    'view_grades',
    'view_announcements',
    'view_student_dashboard'
  ]
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (userRole, permission) => {
  const rolePermissions = permissions[userRole] || [];
  return rolePermissions.includes(permission);
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role) => {
  return permissions[role] || [];
};

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (userRole, route) => {
  const routePermissions = {
    '/admin': 'view_admin_dashboard',
    '/admin-dashboard': 'view_admin_dashboard',
    '/admin-reports': 'view_admin_dashboard',
    '/dashboard': 'view_instructor_dashboard',
    '/course-analytics': 'view_own_analytics',
    '/predictive-analytics': 'view_own_analytics',
    '/report-generation': 'view_reports'
  };
  
  const requiredPermission = routePermissions[route];
  return requiredPermission ? hasPermission(userRole, requiredPermission) : true;
};