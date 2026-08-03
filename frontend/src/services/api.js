import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      if (import.meta.env.DEV) {
        console.error('Forbidden:', error.response.data);
      }
    } else if (error.response?.status >= 500) {
      if (import.meta.env.DEV) {
        console.error('Server error:', error.response.data);
      }
    } else if (!error.response) {
      if (import.meta.env.DEV) {
        console.error('Network error - no response received:', error.message);
      }
    }
    return Promise.reject(error);
  }
);

export default api;