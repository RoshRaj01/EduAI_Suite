import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  role: 'teacher' | 'student' | null;
  user: { email: string; name: string } | null;
  setRole: (role: 'teacher' | 'student') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      user: null,
      setRole: (role) => {
        set({ 
          role,
          user: {
            email: role === 'teacher' ? 'teacher@eduai.com' : 'student@eduai.com',
            name: role === 'teacher' ? 'Teacher' : 'Student'
          }
        });
      },
      logout: () => set({ role: null, user: null }),
    }),
    {
      name: 'edugames-auth-storage',
    }
  )
);
