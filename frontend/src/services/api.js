import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
if (!rawApiUrl) {
  throw new Error('❌ Missing VITE_API_URL environment variable. Set VITE_API_URL in frontend/.env for development or in your production deployment environment.');
}

export const API_URL = rawApiUrl.replace(/\/$/, '');
export const API_BASE_URL = `${API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  // Timeout — must be longer than the backend's per-request timeout (30s)
  // so we don't reject a request that the server is still processing.
  timeout: 30000, // 30 seconds
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      if (import.meta.env.DEV) {
        console.error('Forbidden:', error.response?.data);
      }
    } else if (status && status >= 500) {
      if (import.meta.env.DEV) {
        console.error('Server error:', error.response?.data);
      }
    } else if (!error.response) {
      if (import.meta.env.DEV) {
        console.error('Network error - no response received:', error.message);
      }
      // On network errors (server down), do NOT force a redirect to /login.
      // The user may have a valid cached session. Let the calling code handle it.
    }
    return Promise.reject(error);
  }
);

export default api;