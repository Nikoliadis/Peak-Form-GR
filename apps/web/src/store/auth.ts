import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string, activeRole?: 'TRAINER' | 'ATHLETE') => Promise<{ needsRoleSelection: boolean }>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  switchRole: (role: 'TRAINER' | 'ATHLETE') => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: ('TRAINER' | 'ATHLETE')[];
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password, activeRole) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post<AuthResponse & { needsRoleSelection?: boolean; availableRoles?: string[] }>(
            '/auth/login',
            { email, password, ...(activeRole ? { activeRole } : {}) }
          );
          if (data.needsRoleSelection) {
            return { needsRoleSelection: true };
          }
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
          return { needsRoleSelection: false };
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (registerData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post<AuthResponse>('/auth/register', registerData);
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          await api.post('/auth/logout', { refreshToken });
        } catch {}
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get<User>('/auth/me');
          set({ user: data });
        } catch {
          set({ user: null, accessToken: null, refreshToken: null });
        }
      },

      switchRole: async (role) => {
        const { refreshToken } = get();
        const { data } = await api.post<AuthResponse>('/auth/switch-role', { role, refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      },
    }),
    {
      name: 'peakform-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
