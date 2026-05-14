'use client';

import { useMyTenantMembershipsQuery } from '@/lib/api/queries/me.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { cn } from '@/lib/cn';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV, PRIMARY_NAV } from './nav-config.ts';

export function AppSidebar() {
  const pathname = usePathname();
  const activeTenantId = useSessionStore((s) => s.activeTenantId);
  const myMemberships = useMyTenantMembershipsQuery();

  const isInstitutionAdmin =
    !!activeTenantId &&
    (myMemberships.data?.some(
      (m) => m.tenantId === activeTenantId && m.role === 'institution_admin',
    ) ??
      false);

  const adminItems = ADMIN_NAV.filter((item) => !item.staffOnly || isInstitutionAdmin);

  return (
    <aside className="hidden lg:flex w-(--spacing-shell) shrink-0 flex-col border-r border-(--color-border-subtle) bg-(--color-surface-elevated)">
      <Link
        href="/dashboard"
        className="flex h-(--spacing-topbar) items-center gap-2 border-b border-(--color-border-subtle) px-5"
      >
        <span className="grid size-8 place-items-center rounded-[var(--radius-md)] bg-(--color-brand) text-(--color-text-onbrand)">
          <GraduationCap className="size-4" aria-hidden />
        </span>
        <span className="font-display text-base font-semibold tracking-tight">Open-LMS</span>
      </Link>
      <nav className="flex flex-col gap-0.5 p-3" aria-label="Primary">
        {PRIMARY_NAV.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-(--color-brand-subtle) text-(--color-brand-700)'
                  : 'text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text-default)',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {adminItems.length > 0 ? (
        <div className="mt-auto p-3">
          <p className="px-3 py-1 text-2xs font-medium uppercase tracking-wider text-(--color-text-subtle)">
            Admin
          </p>
          <nav className="flex flex-col gap-0.5" aria-label="Admin">
            {adminItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-(--color-brand-subtle) text-(--color-brand-700)'
                      : 'text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text-default)',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </aside>
  );
}
