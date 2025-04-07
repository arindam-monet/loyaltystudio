import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { AxiosError, AxiosInstance } from 'axios';

// Refresh token interval in milliseconds (every 30 minutes)
const REFRESH_TOKEN_INTERVAL = 30 * 60 * 1000;

export function useApiAuth() {
  const { token, setAuth, clearAuth } = useAuthStore();

  // Set up token refresh interval
  useEffect(() => {
    if (!token) return;

    // Refresh token periodically to keep the session alive
    const refreshInterval = setInterval(async () => {
      try {
        console.log('Refreshing auth token...');
        const response = await apiClient.post('/auth/refresh-token');
        if (response.data?.token) {
          // Update token in auth store
          setAuth(response.data.token, response.data.user || useAuthStore.getState().user);
          console.log('Auth token refreshed successfully');
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }, REFRESH_TOKEN_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [token, setAuth]);

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