import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

// Attach auth token dynamically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API] → Sending Authorization header:', config.headers.Authorization.slice(0, 30) + '...');
  } else {
    console.log('[API] → No token found in localStorage');
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized:', error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default api;
