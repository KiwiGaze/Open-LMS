'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useInboxThreadsQuery } from '@/lib/api/queries/messaging.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatRelative } from '@/lib/format.ts';
import { Inbox as InboxIcon, MessagesSquare, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { NewMessageDialog } from './new-message-dialog.tsx';

export default function InboxPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const threads = useInboxThreadsQuery(tenantId);
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inbox"
        description="Conversations across all your courses and institution-wide messages."
        actions={
          <Button onClick={() => setComposeOpen(true)}>
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
          action={
            <Button onClick={() => setComposeOpen(true)}>
              <Plus className="size-4" aria-hidden /> New message
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-(--color-border-subtle) overflow-hidden rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-elevated)">
          {threads.data?.map((thread) => {
            const href = thread.courseId
              ? `/inbox/${thread.id}?courseId=${thread.courseId}`
              : `/inbox/${thread.id}`;
            return (
              <li key={thread.id}>
                <Link
                  href={href}
                  className="flex items-center gap-3 p-4 hover:bg-(--color-surface-sunken)"
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
                      {thread.id.slice(-6)} · {thread.status}
                      {thread.courseId === null ? ' · tenant-wide' : ''}
                    </p>
                  </div>
                  {thread.status === 'open' ? <Badge tone="brand">Active</Badge> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <NewMessageDialog tenantId={tenantId} open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
  );
}
