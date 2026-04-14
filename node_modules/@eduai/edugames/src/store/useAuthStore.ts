import { create } from 'zustand';

interface AuthState {
  role: 'teacher' | 'student' | null;
  setRole: (role: 'teacher' | 'student') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: 'student', // default for dev testing EduGames
  setRole: (role) => set({ role }),
  logout: () => set({ role: null }),
}));
