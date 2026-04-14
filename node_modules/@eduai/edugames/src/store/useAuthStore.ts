import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  role: 'teacher' | 'student' | null;
  setRole: (role: 'teacher' | 'student') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      setRole: (role) => set({ role }),
      logout: () => set({ role: null }),
    }),
    {
      name: 'edugames-auth-storage',
    }
  )
);
