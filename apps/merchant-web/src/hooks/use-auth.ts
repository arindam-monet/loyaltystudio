import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import Cookies from 'js-cookie';

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
      const { token, user } = response.data;
      
      // Set cookies
      Cookies.set('token', token, { secure: true, sameSite: 'strict' });
      Cookies.set('user', JSON.stringify(user), { secure: true, sameSite: 'strict' });
      
      return response.data;
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
      const { token, user } = response.data;
      
      // Set cookies
      Cookies.set('token', token, { secure: true, sameSite: 'strict' });
      Cookies.set('user', JSON.stringify(user), { secure: true, sameSite: 'strict' });
      
      return response.data;
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await apiClient.post('/auth/verify-email', { token });
      const { user } = response.data;
      
      // Update user cookie with verified status
      Cookies.set('user', JSON.stringify(user), { secure: true, sameSite: 'strict' });
      
      return response.data;
    },
  });
}

export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await apiClient.post('/auth/resend-verification', { email });
      return response.data;
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const response = await apiClient.post('/auth/reset-password', { token, password });
      return response.data;
    },
  });
}

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await apiClient.get<AuthResponse['user']>('/auth/me');
      const user = response.data;
      
      // Update user cookie
      Cookies.set('user', JSON.stringify(user), { secure: true, sameSite: 'strict' });
      
      return user;
    },
    enabled: false, // Only fetch when explicitly needed
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
      // Clear cookies
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      Cookies.remove('user');
    },
  });
} 