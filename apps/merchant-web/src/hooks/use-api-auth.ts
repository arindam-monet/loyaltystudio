import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api-client';

export function useApiAuth() {
  const { token, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Set up axios interceptor to add auth header
    const interceptor = apiClient.interceptors.request.use(
      (config) => {
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
      const { user } = response.data;
      
      // Update auth store with fresh user data
      setAuth(token, user);
      return true;
    } catch (error) {
      // Clear auth state on verification failure
      clearAuth();
      return false;
    }
  };

  return {
    verifySession,
    isAuthenticated: !!token
  };
} 