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

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    role: {
      id: string;
      name: string;
    };
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
}) as CustomAxiosInstance;

// Add request interceptor to include auth header
apiClient.interceptors.request.use((config) => {
  // Skip auth header for login and register endpoints
  if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
    return config;
  }

  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 errors
    if (error.response?.status === 401) {
      // Only clear auth and redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        // Clear auth state on unauthorized response
        useAuthStore.getState().clearAuth();
        // Clear any cached data
        await apiClient.clearCache();
        // Redirect to login page
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Add method to clear cache
apiClient.clearCache = async () => {
  // Clear any cached data in the API client
  apiClient.defaults.headers.common = {};
};

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    useAuthStore.getState().setAuth(response.data.token, response.data.user);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', data);
      if (!response.data.token || !response.data.user) {
        throw new Error('Invalid response from login endpoint');
      }
      useAuthStore.getState().setAuth(response.data.token, response.data.user);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      await apiClient.clearCache();
      useAuthStore.getState().clearAuth();
    }
  },

  verifySession: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/auth/verify-session');
      if (!response.data || !response.data.user) {
        return false;
      }
      
      const { user } = response.data;
      const token = useAuthStore.getState().token;
      
      if (token) {
        useAuthStore.getState().setAuth(token, user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session verification failed:', error);
      return false;
    }
  },
}; 