'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { signOut } from '@/lib/api/auth-client.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { initialsOf } from '@/lib/format.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function UserMenu() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const clear = useSessionStore((s) => s.clear);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: signOut,
    onSettled: () => {
      clear();
      queryClient.clear();
      router.replace('/login');
    },
  });

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-2 rounded-full p-0.5 hover:bg-(--color-surface-muted) focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-focus)]"
        aria-label="Open user menu"
      >
        <Avatar size="sm">
          {user.image ? <AvatarImage src={user.image} alt={user.name ?? user.email} /> : null}
          <AvatarFallback>{initialsOf(user.name ?? user.email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-(--color-text-default)">
          <div className="flex flex-col">
            <span className="truncate text-sm font-medium">{user.name ?? 'Your account'}</span>
            <span className="truncate text-xs text-(--color-text-muted)">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" className="cursor-pointer">
            <UserIcon className="size-4" aria-hidden />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/notifications" className="cursor-pointer">
            <Settings className="size-4" aria-hidden />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onSelect={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          disabled={mutation.isPending}
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
