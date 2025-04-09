import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/stores/auth';
import { useRouter } from 'next/navigation';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
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
      description?: string;
    };
  };
}

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

      // Store auth data in memory
      useAuthStore.getState().setAuth(response.data.token, response.data.user);

      return response.data;
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await apiClient.post<AuthResponse>('/auth/register', credentials);

      // Store auth data in memory
      useAuthStore.getState().setAuth(response.data.token, response.data.user);

      return response;
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await apiClient.post<AuthResponse>('/auth/verify-email', { token });

      // Update user data in store
      const authState = useAuthStore.getState();
      if (authState.user) {
        useAuthStore.getState().setAuth(authState.token!, {
          ...authState.user,
          emailVerified: true,
        });
      }

      return response;
    },
  });
}

export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      return apiClient.post('/auth/resend-verification', { email });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      return apiClient.post('/auth/forgot-password', { email });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      console.log(`Sending reset password request with token/code: ${token.substring(0, 10)}...`);
      return apiClient.post('/auth/reset-password', { token, password });
    },
    onError: (error: any) => {
      console.error('Reset password error:', error.response?.data || error);
      return error.response?.data?.error || 'Failed to reset password. Please try again.';
    }
  });
}

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await apiClient.get<User>('/auth/me');

      // Update user data in store
      const authState = useAuthStore.getState();
      if (authState.token) {
        useAuthStore.getState().setAuth(authState.token, response);
      }

      return response;
    },
    enabled: !!useAuthStore.getState().token, // Only fetch if we have a token
  });
}

export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      try {
        console.log('Initiating logout process');

        // Use the authApi.logout method which handles server-side session invalidation first
        // followed by client-side cleanup
        await authApi.logout();

        console.log('Logout successful, redirecting to login page');

        // Use Next.js router for navigation
        router.push('/login');
        router.refresh(); // Force a refresh of the current route
      } catch (error) {
        console.error('Logout failed:', error);

        // Ensure auth is cleared even if there's an error
        useAuthStore.getState().clearAuth();
        localStorage.removeItem('auth-storage');
        await apiClient.clearCache();

        // Still redirect to login
        router.push('/login');
        router.refresh();
      }
    },
  });
}