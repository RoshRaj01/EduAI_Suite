import { create } from 'zustand';

interface AuthState {
  user: { id: number; email: string; name: string } | null;
  login: (user: { id: number; email: string; name: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  let initialUser = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      initialUser = { 
        id: parsed.id || 1,
        email: parsed.email || parsed.sub || 'teacher@eduai.com', 
        name: parsed.name || 'Teacher' 
      };
    }
  } catch (e) {}

  return {
    user: initialUser,
    login: (user) => set({ user }),
    logout: () => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      set({ user: null });
    }
  };
});
