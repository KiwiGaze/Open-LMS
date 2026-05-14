'use client';

import { AppSidebar } from '@/components/shell/app-sidebar.tsx';
import { AppTopbar } from '@/components/shell/app-topbar.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import type { Tenant } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasToken = useSessionStore((s) => Boolean(s.token));
  const activeTenantId = useSessionStore((s) => s.activeTenantId);
  const setActiveTenant = useSessionStore((s) => s.setActiveTenant);
  const hasHydrated = useSessionStore.persist?.hasHydrated() ?? true;

  const tenants = useQuery({
    queryKey: queryKeys.tenants(),
    queryFn: () => apiFetch<Tenant[]>('/tenants'),
    enabled: hasHydrated && hasToken,
  });

  useEffect(() => {
    if (hasHydrated && !hasToken) {
      router.replace('/login');
    }
  }, [hasHydrated, hasToken, router]);

  // When the membership list is known, prefer the persisted active tenant if it
  // is still valid; otherwise fall back to the first membership. If the user
  // belongs to no tenants and isn't already at onboarding, send them there.
  useEffect(() => {
    if (!tenants.data) return;
    if (tenants.data.length === 0) {
      if (pathname !== '/onboarding') router.replace('/onboarding');
      return;
    }
    const stillValid = activeTenantId && tenants.data.some((t) => t.id === activeTenantId);
    if (!stillValid) {
      const first = tenants.data[0];
      if (first) setActiveTenant(first.id);
    }
  }, [tenants.data, activeTenantId, pathname, router, setActiveTenant]);

  if (!hasHydrated || !hasToken) {
    return (
      <div className="grid min-h-svh place-items-center bg-(--color-surface-sunken)">
        <div className="size-6 rounded-full border-2 border-(--color-brand-200) border-t-(--color-brand-600) animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh bg-(--color-surface-sunken)">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
