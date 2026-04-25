import { create } from 'zustand';

interface AuthState {
  user: { email: string; name: string } | null;
}

export const useAuthStore = create<AuthState>((set) => {
  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      user = { 
        email: parsed.email || parsed.sub || 'teacher@eduai.com', 
        name: parsed.name || 'Teacher' 
      };
    }
  } catch (e) {}

  if (!user) {
    user = { email: 'teacher@eduai.com', name: 'Teacher' };
  }

  return { user };
});
