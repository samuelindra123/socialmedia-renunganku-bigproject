import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie'; // Install: npm install js-cookie
import apiClient from '@/lib/api/client';
import { User, LoginResponse } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  sessionToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void; // Helper baru untuk onboarding
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      sessionToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post<LoginResponse>('/auth/login', {
            email,
            password,
          });

          // 1. Simpan ke LocalStorage (via Persist & manual untuk client.ts)
          localStorage.setItem('auth_token', data.accessToken);
          if (data.session?.token) {
            localStorage.setItem('session_token', data.session.token);
          }
          
          // 2. Simpan ke Cookies (Untuk Middleware Next.js)
          Cookies.set('token', data.accessToken, { expires: 7, secure: true, sameSite: 'strict' });

          set({
            user: data.user,
            token: data.accessToken,
            sessionToken: data.session?.token ?? null,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiClient.delete('/auth/sessions/current');
        } catch (error) {
          console.error('Gagal mencabut sesi', error);
        }
        // Hapus dari Storage & Cookies
        localStorage.removeItem('auth_token');
        localStorage.removeItem('session_token');
        localStorage.removeItem('user');
        Cookies.remove('token');
        
        set({
          user: null,
          token: null,
          sessionToken: null,
          isAuthenticated: false,
        });
        window.location.href = '/login';
      },

      checkAuth: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        
        // Pastikan cookie juga ada (jika user clear cookie manual)
        if (!Cookies.get('token')) {
           Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'strict' });
        }

        set({ isLoading: true });
        try {
          const { data } = await apiClient.get<User>('/users/profile');
          set({
            user: data,
            token,
            sessionToken:
              typeof window !== 'undefined'
                ? localStorage.getItem('session_token')
                : null,
            isAuthenticated: true,
            isLoading: false
          });
        } catch {
          // Jika token invalid/expired
          localStorage.removeItem('auth_token');
          localStorage.removeItem('session_token');
          Cookies.remove('token');
          set({ isAuthenticated: false, user: null, token: null, sessionToken: null, isLoading: false });
        }
      },

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        sessionToken: state.sessionToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;