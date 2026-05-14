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
import { useCalendarItemsQuery } from '@/lib/api/queries/calendar.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDate, formatDateTime, formatRelative } from '@/lib/format.ts';
import { CalendarClock, ExternalLink } from 'lucide-react';
import { useMemo } from 'react';

export default function CalendarPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const from = useMemo(() => new Date(), []);
  const to = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d;
  }, []);
  const items = useCalendarItemsQuery(tenantId, { from, to });

  const grouped = useMemo(() => {
    const byDay = new Map<string, typeof items.data>();
    for (const item of items.data ?? []) {
      const date = item.startsAt ? new Date(item.startsAt) : null;
      const key = date ? date.toISOString().slice(0, 10) : 'unscheduled';
      const list = byDay.get(key) ?? [];
      list.push(item);
      byDay.set(key, list);
    }
    return Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items.data]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendar"
        description="Everything due across all your courses for the next 60 days."
        actions={
          <Button intent="secondary" asChild>
            <a href={`/api/v1/tenants/${tenantId}/calendar.ics`} download>
              <ExternalLink className="size-4" aria-hidden /> Subscribe (.ics)
            </a>
          </Button>
        }
      />

      {items.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`cal-${i}`} className="h-20 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : items.error ? (
        <ErrorState error={items.error} onRetry={() => items.refetch()} />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nothing on your calendar"
          description="When work is assigned, it will show up here."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([dayKey, list]) => (
            <section key={dayKey} className="flex flex-col gap-3">
              <h3 className="font-display text-sm font-semibold tracking-tight text-(--color-text-default)">
                {dayKey === 'unscheduled' ? 'No date' : formatDate(dayKey)}
              </h3>
              {list?.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription>
                        {item.startsAt
                          ? `${formatDateTime(item.startsAt)} · ${formatRelative(item.startsAt)}`
                          : 'No date'}
                      </CardDescription>
                    </div>
                    <Badge tone="brand">{item.itemType.replace(/_/g, ' ')}</Badge>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-(--color-text-subtle)">
                    {item.courseCode ? <span>{item.courseCode}</span> : null}
                  </CardContent>
                </Card>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
