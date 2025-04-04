import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from './stores/auth-store';

// Extend AxiosInstance to include our custom methods
interface CustomAxiosInstance extends AxiosInstance {
  clearCache: () => Promise<void>;
}

export interface ApiError {
  error: string;
  message?: string;
}

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
}) as CustomAxiosInstance;

// Add request interceptor for auth
apiClient.interceptors.request.use(
  (config) => {
    // Skip auth header for login and register endpoints
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
      return config;
    }

    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`API Request [${config.method?.toUpperCase()}] ${config.url}:`, {
      data: config.data,
      params: config.params,
      headers: config.headers
    });

    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for handling auth errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error(`API Error [${error.config?.method?.toUpperCase()}] ${error.config?.url}:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      // Clear auth on unauthorized
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  }
);

// Add method to clear cache
apiClient.clearCache = async () => {
  // Clear any cached data in the API client
  apiClient.defaults.headers.common = {};
};