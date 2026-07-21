import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
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

  // ✅ REAL login function - calls backend
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

  // ✅ REAL register function - calls backend API
  const register = async (name, email, password, role, acceptedTerms) => {
    try {
      const res = await api.post('/auth/register', {
        name: name?.trim(),
        email: email?.trim().toLowerCase(),
        password,
        role: role || 'student',
        acceptedTerms: acceptedTerms || false,
      });

      // Backend returns: { success, message, data: { _id, name, email, role, isVerified, token, verificationToken } }
      if (res.data.success) {
        return {
          success: true,
          message: res.data.message,
          data: res.data.data, // Contains verificationToken
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

  // ✅ Verify email function
  const verifyEmail = async (token) => {
    try {
      const res = await api.get(`/auth/verify/${token}`);
      return { success: true, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Verification failed.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberedEmail');
    setUser(null);
  };
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
    logout,
    updateUser
  }}
>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);