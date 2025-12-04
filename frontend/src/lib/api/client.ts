import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const lsToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const cookieToken = Cookies.get('token');
    const token = lsToken || cookieToken || null;

    const headers = (config.headers ?? {}) as any;

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (typeof window !== 'undefined') {
      const sessionToken = localStorage.getItem('session_token');
      if (sessionToken) {
        headers['x-session-token'] = sessionToken;
      }
    }

    config.headers = headers;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('session_token');
      } catch {}
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Helper function for file uploads
export const uploadFile = async (
  endpoint: string,
  file: File,
  additionalData?: Record<string, unknown>
) => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.keys(additionalData).forEach((key) => {
      const val = additionalData[key];
      if (val instanceof Blob) {
        formData.append(key, val);
      } else {
        formData.append(key, typeof val === 'string' ? val : String(val));
      }
    });
  }

  return apiClient.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default apiClient;
