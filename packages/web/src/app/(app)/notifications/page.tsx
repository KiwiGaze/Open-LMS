'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import {
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/lib/api/queries/notifications.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatRelative } from '@/lib/format.ts';
import { Bell, Check } from 'lucide-react';

export default function NotificationsPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const notifications = useNotificationsQuery(tenantId);
  const markRead = useMarkNotificationReadMutation(tenantId);

  const unread = (notifications.data ?? []).filter((n) => !n.readAt);

  const markAll = () => {
    void Promise.allSettled(unread.map((n) => markRead.mutateAsync(n.id)));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Recent activity across your courses."
        actions={
          unread.length > 0 ? (
            <Button intent="secondary" size="sm" onClick={markAll} disabled={markRead.isPending}>
              <Check className="size-3.5" aria-hidden /> Mark all as read
            </Button>
          ) : null
        }
      />

      {notifications.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`n-${i}`} className="h-20 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : notifications.error ? (
        <ErrorState error={notifications.error} onRetry={() => notifications.refetch()} />
      ) : (notifications.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="When something happens that needs your attention, it'll appear here."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.data?.map((n) => (
            <li key={n.id}>
              <Card className={n.readAt ? 'opacity-75' : 'border-(--color-brand-200)'}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm">{n.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {!n.readAt ? <Badge tone="brand">New</Badge> : null}
                      {!n.readAt ? (
                        <Button
                          intent="ghost"
                          size="sm"
                          onClick={() => markRead.mutate(n.id)}
                          disabled={markRead.isPending}
                        >
                          Mark read
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <CardDescription>{formatRelative(n.createdAt)}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-(--color-text-default)">{n.body}</CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
