import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  address: string | null;
  role: 'customer' | 'merchant' | null;
  merchantId: string | null;
  setAuth: (token: string, address: string, role: 'customer' | 'merchant' | null, merchantId?: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      address: null,
      role: null,
      merchantId: null,
      setAuth: (token, address, role, merchantId = null) => set({ token, address, role, merchantId }),
      clearAuth: () => set({ token: null, address: null, role: null, merchantId: null }),
    }),
    {
      name: 'fiducia-auth',
    }
  )
);
