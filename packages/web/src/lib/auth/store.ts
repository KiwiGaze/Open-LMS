'use client';

import type { AuthSession, AuthUser } from '@/lib/api/auth-client.ts';
import { setAuthToken } from '@/lib/api/client.ts';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SessionState = {
  user: AuthUser | null;
  token: string | null;
  activeTenantId: string | null;
  setSession: (session: AuthSession | null) => void;
  setActiveTenant: (tenantId: string | null) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      activeTenantId: null,
      setSession: (session) => {
        const token = session?.token ?? null;
        setAuthToken(token);
        set({
          user: session?.user ?? null,
          token,
          activeTenantId: session?.activeTenantId ?? null,
        });
      },
      setActiveTenant: (tenantId) => set({ activeTenantId: tenantId }),
      clear: () => {
        setAuthToken(null);
        set({ user: null, token: null, activeTenantId: null });
      },
    }),
    {
      name: 'openlms.session',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        activeTenantId: state.activeTenantId,
      }),
      onRehydrateStorage: () => (rehydrated) => {
        if (rehydrated?.token) setAuthToken(rehydrated.token);
      },
    },
  ),
);

export function useAuthToken(): string | null {
  return useSessionStore((s) => s.token);
}

export function useCurrentUser(): AuthUser | null {
  return useSessionStore((s) => s.user);
}

export function useActiveTenantId(): string | null {
  return useSessionStore((s) => s.activeTenantId);
}
