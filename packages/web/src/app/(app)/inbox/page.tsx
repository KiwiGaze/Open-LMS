'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatRelative, initialsOf } from '@/lib/format.ts';
import type { ConversationThread } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { Inbox as InboxIcon, MessagesSquare, Plus } from 'lucide-react';

export default function InboxPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const threads = useQuery({
    queryKey: tenantId ? queryKeys.inboxThreads(tenantId) : ['inbox', 'inactive'],
    queryFn: () => apiFetch<ConversationThread[]>(`/tenants/${tenantId}/inbox/threads`),
    enabled: Boolean(tenantId),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inbox"
        description="Conversations across all your courses and institution-wide messages."
        actions={
          <Button>
            <Plus className="size-4" aria-hidden /> New message
          </Button>
        }
      />

      {threads.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`thread-${i}`} className="h-20 w-full rounded-[var(--radius-md)]" />
          ))}
        </div>
      ) : threads.error ? (
        <ErrorState error={threads.error} onRetry={() => threads.refetch()} />
      ) : (threads.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="Your inbox is empty"
          description="When someone messages you, conversations will appear here."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-(--color-border-subtle) overflow-hidden rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-elevated)">
          {threads.data?.map((thread) => (
            <li
              key={thread.id}
              className="flex items-center gap-3 p-4 hover:bg-(--color-surface-sunken) cursor-pointer"
            >
              <Avatar size="sm">
                <AvatarFallback>
                  <MessagesSquare className="size-4" aria-hidden />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-(--color-text-default)">
                    {thread.subject ?? 'Conversation'}
                  </p>
                  <span className="text-xs text-(--color-text-subtle)">
                    {thread.lastMessageAt ? formatRelative(thread.lastMessageAt) : ''}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-(--color-text-muted)">
                  {initialsOf(thread.id.slice(-6))} · {thread.status}
                </p>
              </div>
              {thread.status === 'open' ? <Badge tone="brand">Active</Badge> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
