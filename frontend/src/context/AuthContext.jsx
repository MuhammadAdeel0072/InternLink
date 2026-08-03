import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

/**
 * AuthProvider - Provides authentication state and methods to the application
 * Manages user session, login, registration, email verification, and password reset
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Validate existing session on mount by checking localStorage and API
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          try {
            const res = await api.get('/auth/me');
            const freshUser = res.data?.data || res.data || parsedUser;
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          } catch (error) {
            console.warn('Using locally stored session because the server is unavailable.', error.message);
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Authenticate a user with email and password
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @param {boolean} rememberMe - Whether to extend token expiration
   * @returns {Promise<object>} Login result with success status and message
   */
  const login = async (email, password, rememberMe = false) => {
    try {
      const res = await api.post('/auth/login', { email, password, rememberMe });
      
      const { token, ...userData } = res.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData)); 
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      const responseData = error.response?.data;
      return {
        success: false,
        message: responseData?.message || 'Login failed. Please check your credentials.',
        needsVerification: responseData?.needsVerification || false,
        email: responseData?.email || email,
      };
    }
  };

  /**
   * Register a new user account
   * @param {string} name - User's full name
   * @param {string} email - User's email address
   * @param {string} password - User's password (must meet complexity requirements)
   * @param {string} role - User role ('student' or 'recruiter')
   * @param {boolean} acceptedTerms - Whether user accepted terms of service
   * @returns {Promise<object>} Registration result with success status and verification requirement
   */
  const register = async (name, email, password, role, acceptedTerms) => {
    try {
      const res = await api.post('/auth/register', {
        name: name?.trim(),
        email: email?.trim().toLowerCase(),
        password,
        role: role || 'student',
        acceptedTerms: acceptedTerms || false,
      });

      if (res.data.success) {
        return {
          success: true,
          message: res.data.message,
          data: res.data.data,
          requiresVerification: res.data.data?.requiresVerification || false,
        };
      } else {
        return {
          success: false,
          message: res.data.message || 'Registration failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.',
      };
    }
  };

  /**
   * Verify a user's email address using a verification token
   * @param {string} token - The verification token from the email link
   * @returns {Promise<object>} Verification result
   */
  const verifyEmail = async (token) => {
    try {
      const res = await api.get(`/auth/verify-email/${token}`);
      return { success: true, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Verification failed.',
      };
    }
  };

  /**
   * Initiate password reset by sending a reset email
   * @param {string} email - User's email address
   * @returns {Promise<object>} Password reset request result
   */
  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return { success: true, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send reset email.',
        needsVerification: error.response?.data?.needsVerification || false,
        email: error.response?.data?.email || email,
      };
    }
  };

  /**
   * Resend a verification email to an unverified user
   * @param {string} email - User's email address
   * @returns {Promise<object>} Resend result
   */
  const resendVerification = async (email) => {
    try {
      const res = await api.post('/auth/resend-verification', { email });
      return { success: true, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resend verification email.',
      };
    }
  };

  /**
   * Validate a password reset token
   * @param {string} token - The reset token from the email link
   * @returns {Promise<object>} Token validation result
   */
  const validateResetToken = async (token) => {
    try {
      const res = await api.get(`/auth/validate-reset-token/${token}`);
      return { success: true, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid or expired reset token.',
      };
    }
  };

  /**
   * Reset a user's password using a valid reset token
   * @param {string} token - The reset token from the email link
   * @param {string} password - The new password
   * @returns {Promise<object>} Password reset result
   */
  const resetPassword = async (token, password) => {
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      return { success: true, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reset password.',
      };
    }
  };

  /**
   * Log out the current user and clear stored session data
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberedEmail');
    setUser(null);
  };

  /**
   * Update the current user's data in state and localStorage
   * @param {object} userData - Partial user data to merge
   */
  const updateUser = (userData) => {
    setUser(prev => {
      const updated = { ...prev, ...userData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        register,
        verifyEmail,
        forgotPassword,
        resendVerification,
        validateResetToken,
        resetPassword,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context
 * @returns {object} Auth context value
 */
export const useAuth = () => useContext(AuthContext);