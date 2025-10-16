import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  address: string | null;
  role: 'customer' | 'merchant' | null;
  setAuth: (token: string, address: string, role: 'customer' | 'merchant' | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      address: null,
      role: null,
      setAuth: (token, address, role) => set({ token, address, role }),
      clearAuth: () => set({ token: null, address: null, role: null }),
    }),
    {
      name: 'fiducia-auth',
    }
  )
);
