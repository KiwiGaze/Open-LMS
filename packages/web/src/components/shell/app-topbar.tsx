'use client';

import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Bell, Search } from 'lucide-react';
import Link from 'next/link';
import { TenantSwitcher } from './tenant-switcher.tsx';
import { ThemeToggle } from './theme-toggle.tsx';
import { UserMenu } from './user-menu.tsx';

export function AppTopbar() {
  return (
    <header className="flex h-(--spacing-topbar) items-center gap-3 border-b border-(--color-border-subtle) bg-(--color-surface-elevated) px-4 lg:px-6">
      <TenantSwitcher />
      <div className="relative ml-4 hidden flex-1 max-w-md md:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-muted)"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search courses, assignments, people..."
          className="pl-9"
          aria-label="Search"
        />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button intent="ghost" size="icon-sm" aria-label="Notifications" asChild>
          <Link href="/notifications">
            <Bell className="size-4" aria-hidden />
          </Link>
        </Button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
