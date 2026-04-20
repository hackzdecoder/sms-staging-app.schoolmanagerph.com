import axios from 'axios';

// Base URL configuration
const API_BASE_URL = 'https://sms-api.schoolmanagerph.com/api';

// Calculate APP_BASE_URL by removing '/api' from API_BASE_URL
export const APP_BASE_URL = API_BASE_URL.replace('/api', '');

// Axios instance configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json; charset=utf-8',
  },
});

// Request interceptor to add authorization token
api.interceptors.request.use((config: any) => {
  try {
    const token = localStorage.getItem('auth_token');

    // Skip auth token if skipAuthInterceptor is true
    if (token && !config?.skipAuthInterceptor) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  } catch (error) {
    // ERROR HANDLING: Log request interceptor errors
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response, // Simply return successful responses
  (error: any) => {
    try {
      const config: any = error.config;
      if (config?.skipAuthInterceptor) return Promise.reject(error);

      // ERROR HANDLING: Log response errors
      if (error.response) {
        console.error('API Response Error:', {
          status: error.response.status,
          data: error.response.data,
          url: error.config?.url,
        });
      } else if (error.request) {
        console.error('API Network Error - No response received:', error.request);
      } else {
        console.error('API Request Setup Error:', error.message);
      }

      return Promise.reject(error);
    } catch (interceptorError) {
      // ERROR HANDLING: Log response interceptor errors
      console.error('Response error interceptor error:', interceptorError);
      return Promise.reject(error);
    }
  }
);

export default api;
