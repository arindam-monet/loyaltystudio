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
      // Get the current token before clearing anything
      const token = useAuthStore.getState().token;

      // First call the logout endpoint to invalidate the session on the server
      if (token) {
        console.log('Calling logout API to invalidate session on server');
        await apiClient.post('/auth/logout');
      } else {
        console.log('No token found, skipping server logout');
      }

      // Then clear the auth store and local storage
      console.log('Clearing auth store and local storage');
      useAuthStore.getState().clearAuth();
      localStorage.removeItem('auth-storage');

      // Clear any cached data
      await apiClient.clearCache();

      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
      useAuthStore.getState().clearAuth();
      localStorage.removeItem('auth-storage');
      await apiClient.clearCache();
    }
  },

  verifySession: async (): Promise<boolean> => {
    try {
      // Check if we have a token in the store
      const token = useAuthStore.getState().token;
      if (!token) {
        console.log('No token found in auth store, session invalid');
        return false;
      }

      // Call the verify-session endpoint
      const response = await apiClient.get('/auth/verify-session');
      if (!response.data || !response.data.user) {
        console.log('Invalid response from verify-session endpoint');
        // Clear auth store if the session is invalid
        useAuthStore.getState().clearAuth();
        localStorage.removeItem('auth-storage');
        return false;
      }

      const { user } = response.data;

      // Update the user data in the store
      useAuthStore.getState().setAuth(token, user);
      return true;
    } catch (error) {
      console.error('Session verification failed:', error);
      // Clear auth store on error
      useAuthStore.getState().clearAuth();
      localStorage.removeItem('auth-storage');
      return false;
    }
  },
};