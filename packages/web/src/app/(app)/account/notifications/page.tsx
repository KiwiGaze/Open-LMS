'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import type { NotificationPreference } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';

export default function NotificationPreferencesPage() {
  const prefs = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => apiFetch<NotificationPreference[]>('/me/notification-preferences'),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Choose how you'd like to be told about activity in your courses."
      />

      {prefs.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : prefs.error ? (
        <ErrorState error={prefs.error} onRetry={() => prefs.refetch()} />
      ) : (prefs.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Bell}
          title="Defaults in effect"
          description="You haven't customised any notification preferences yet."
        />
      ) : (
        <div className="grid gap-3">
          {prefs.data?.map((pref) => (
            <Card key={`${pref.category}-${pref.channel}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base capitalize">
                    {pref.category.replace(/_/g, ' ')}
                  </CardTitle>
                  <Badge tone="brand">{pref.channel}</Badge>
                </div>
                <CardDescription>Frequency: {pref.frequency}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-(--color-text-muted)">
                {pref.frequency === 'off'
                  ? 'You will not be notified for this activity.'
                  : `Delivered via ${pref.channel}.`}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
