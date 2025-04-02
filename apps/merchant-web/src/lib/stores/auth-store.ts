import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified?: boolean;
  role: {
    id: string;
    name: string;
  };
}

interface AuthState {
  token: string | null;
  user: User | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  initialize: () => void;
  getAuthHeader: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isInitialized: false,
      isAuthenticated: false,
      setAuth: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
          isInitialized: true,
        }),
      clearAuth: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isInitialized: true,
        }),
      initialize: () =>
        set((state) => ({
          ...state,
          isInitialized: true,
        })),
      getAuthHeader: () => {
        const token = get().token;
        return token ? `Bearer ${token}` : null;
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Initialize the store after rehydration
        if (state) {
          state.initialize();
        }
      },
    }
  )
); 