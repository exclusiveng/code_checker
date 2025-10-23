import axios from 'axios';

// Allow runtime override for the API base URL. This helps when the backend URL
// is known only at runtime (e.g., different dev ports or proxied hosts).
const envBase = import.meta.env.VITE_API_BASE_URL;
const runtimeOverride = (window as any).__API_BASE || localStorage.getItem('API_BASE');
const API_BASE = envBase

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

// Small helper to update the base at runtime if needed
export function setApiBase(url: string) {
  api.defaults.baseURL = url;
  try {
    localStorage.setItem('API_BASE', url);
  } catch (e) {
    // ignore storage errors
  }
}

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
