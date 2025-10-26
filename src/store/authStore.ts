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
    (set, get) => ({
      token: null,
      address: null,
      role: null,
      merchantId: null,
      setAuth: (token, address, role, merchantId = null) => {
        const currentState = get();
        const currentAddress = currentState.address;

        // If address is different from stored address, completely replace the state
        if (currentAddress && address && currentAddress.toLowerCase() !== address.toLowerCase()) {
          console.log('New address detected, replacing auth state from', currentAddress, 'to', address);
        }

        // Always set the new auth state (will automatically update localStorage via persist)
        set({ token, address, role, merchantId });
      },
      clearAuth: () => set({ token: null, address: null, role: null, merchantId: null }),
    }),
    {
      name: 'fiducia-auth',
    }
  )
);
