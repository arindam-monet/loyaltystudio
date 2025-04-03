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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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