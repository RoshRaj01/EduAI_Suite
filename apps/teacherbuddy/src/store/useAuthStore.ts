import { create } from 'zustand';

interface AuthState {
  user: { id: number; email: string; name: string } | null;
}

export const useAuthStore = create<AuthState>((set) => {
  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      user = { 
        id: parsed.id || 1,
        email: parsed.email || parsed.sub || 'teacher@eduai.com', 
        name: parsed.name || 'Teacher' 
      };
    }
  } catch (e) {}

  if (!user) {
    user = { id: 1, email: 'teacher@eduai.com', name: 'Teacher' };
  }

  return { user };
});
