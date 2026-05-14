'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { cn } from '@/lib/cn.ts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';

type Tenant = {
  id: string;
  slug: string;
  displayName: string;
};

export function TenantSwitcher() {
  const activeTenantId = useSessionStore((s) => s.activeTenantId);
  const setActiveTenant = useSessionStore((s) => s.setActiveTenant);
  const queryClient = useQueryClient();

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(),
    queryFn: () => apiFetch<Tenant[]>('/tenants'),
  });

  const switchTenant = (tenantId: string) => {
    if (tenantId === activeTenantId) return;
    setActiveTenant(tenantId);
    // Refetch every active query and mark inactive ones stale so the next mount
    // does not read previous-tenant data from the cache.
    queryClient.invalidateQueries();
  };

  const tenants = tenantsQuery.data ?? [];
  const active = tenants.find((t) => t.id === activeTenantId) ?? tenants[0] ?? null;

  if (tenantsQuery.isLoading) {
    return <Skeleton className="h-9 w-44" />;
  }

  if (!tenantsQuery.data || tenantsQuery.data.length === 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-(--color-border-default) px-3 py-1.5 text-sm text-(--color-text-muted)">
        <Building2 className="size-4" aria-hidden />
        <span>No institutions</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-(--color-border-default) bg-(--color-surface-elevated)',
          'px-3 py-1.5 text-sm font-medium text-(--color-text-default)',
          'hover:bg-(--color-surface-muted) focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus)]',
        )}
        aria-label="Switch institution"
      >
        <span className="grid size-5 place-items-center rounded-[var(--radius-xs)] bg-(--color-brand-subtle) text-(--color-brand-700)">
          <Building2 className="size-3" aria-hidden />
        </span>
        <span className="truncate max-w-40">{active?.displayName ?? 'Select institution'}</span>
        <ChevronsUpDown className="size-4 text-(--color-text-muted)" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch institution</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onSelect={() => switchTenant(tenant.id)}
            className="justify-between"
          >
            <div className="flex flex-col">
              <span className="text-sm text-(--color-text-default)">{tenant.displayName}</span>
              <span className="text-xs text-(--color-text-subtle)">{tenant.slug}</span>
            </div>
            {tenant.id === activeTenantId ? (
              <Check className="size-4 text-(--color-brand-600)" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
