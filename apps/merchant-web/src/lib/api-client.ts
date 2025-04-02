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
    tenantId: string;
    emailVerified: boolean;
    role: {
      id: string;
      name: string;
      description: string;
    };
    user_metadata?: {
      tenant_id: string;
      email: string;
      email_verified: boolean;
      phone_verified: boolean;
      role: string;
      sub: string;
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

  const authHeader = useAuthStore.getState().getAuthHeader();
  if (authHeader) {
    config.headers.Authorization = authHeader;
  }
  return config;
});

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors
    if (error.response?.status === 401) {
      // Only clear auth and redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        // Clear auth state on unauthorized response
        useAuthStore.getState().clearAuth();
        // Clear any cached data
        apiClient.clearCache();
        // Redirect to login page using window.location
        window.location.href = '/login';
      }
    }

    // Handle other errors
    if (error.response?.data?.error) {
      console.error('API Error:', error.response.data.error);
    }

    return Promise.reject(error);
  }
);

// Add method to clear cache
apiClient.clearCache = async () => {
  // Clear any cached data in the API client
  apiClient.defaults.headers.common = {};
  // Clear any cached data in the auth store
  useAuthStore.getState().clearAuth();
};

export const authApi = {
  register: async (data: { email: string; password: string; name: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    useAuthStore.getState().setAuth(response.data.token, response.data.user);
    return response.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
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
    }
  },
}; 