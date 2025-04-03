import { apiClient } from './api-client';
import { useAuthStore } from './stores/auth-store';

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