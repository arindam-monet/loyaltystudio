import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { AxiosError, AxiosInstance } from 'axios';

export function useApiAuth() {
  const { token, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Set up axios interceptor to add auth header
    const interceptor = apiClient.interceptors.request.use(
      (config) => {
        // Skip auth header for login and register endpoints
        if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
          return config;
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Clean up interceptor on unmount
    return () => {
      apiClient.interceptors.request.eject(interceptor);
    };
  }, [token]);

  const verifySession = async () => {
    if (!token) return false;

    try {
      const response = await apiClient.get('/auth/verify-session');
      if (!response.data || !response.data.user) {
        console.error('Invalid response from verify-session:', response);
        return false;
      }
      
      const { user } = response.data;
      
      // Update auth store with fresh user data
      setAuth(token, user);
      return true;
    } catch (error) {
      console.error('Session verification failed:', error);
      // Only clear auth state if we get a 401 or 403 error
      if (error instanceof AxiosError && (error.response?.status === 401 || error.response?.status === 403)) {
        clearAuth();
      }
      return false;
    }
  };

  return {
    verifySession,
    isAuthenticated: !!token,
    apiClient, // Expose the apiClient instance
  };
} 