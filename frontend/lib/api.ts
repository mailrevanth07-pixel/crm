import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crm-19gz.onrender.com';

// Debug: Log the API URL being used
if (typeof window !== 'undefined') {
  console.log('API Configuration:', {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    resolvedAPI_URL: API_URL,
    nodeEnv: process.env.NODE_ENV
  });
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(`${API_URL}/api/auth/refresh`, {
              refreshToken,
            });
            
            const { accessToken } = response.data.data;
            // Store in the same storage type as the original token
            const isRemembered = localStorage.getItem('rememberMe') === 'true';
            if (isRemembered) {
              localStorage.setItem('accessToken', accessToken);
            } else {
              sessionStorage.setItem('accessToken', accessToken);
            }
            
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('rememberMe');
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          sessionStorage.removeItem('user');
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
