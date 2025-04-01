import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  tenantId: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, userData: any) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, userData) => {
    // Handle both API response and JWT payload formats
    const user: User = {
      id: userData.sub || userData.id,
      email: userData.email,
      name: userData.user_metadata?.name || userData.name,
      emailVerified: userData.user_metadata?.email_verified || userData.emailVerified,
      tenantId: userData.user_metadata?.tenant_id || userData.tenantId,
      role: userData.user_metadata?.role || (userData.role?.name || userData.role),
    };
    set({ token, user });
  },
  clearAuth: () => set({ token: null, user: null }),
})); 