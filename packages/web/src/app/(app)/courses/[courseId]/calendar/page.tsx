'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
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
import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { CourseCalendarEvent } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Plus } from 'lucide-react';
import { use } from 'react';

type Params = { courseId: string };

export default function CourseCalendarPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);

  const events = useQuery({
    queryKey: tenantId ? queryKeys.courseCalendar(tenantId, courseId) : ['cal', 'inactive'],
    queryFn: () =>
      apiFetch<CourseCalendarEvent[]>(`/tenants/${tenantId}/courses/${courseId}/calendar-events`),
    enabled: Boolean(tenantId),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-(--color-text-muted)">
          Lectures, office hours, and ad-hoc events for this course.
        </p>
        <Button>
          <Plus className="size-4" aria-hidden /> New event
        </Button>
      </div>

      {events.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`ce-${i}`} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : events.error ? (
        <ErrorState error={events.error} onRetry={() => events.refetch()} />
      ) : (events.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No events"
          description="Add lectures, office hours, and study sessions to keep everyone aligned."
        />
      ) : (
        <div className="grid gap-3">
          {events.data
            ?.slice()
            .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
            .map((event) => (
              <Card key={event.id}>
                <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
                  <div>
                    <CardTitle className="text-base">{event.title}</CardTitle>
                    <CardDescription>
                      {event.endsAt
                        ? `${formatDateTime(event.startsAt)} – ${formatDateTime(event.endsAt)}`
                        : formatDateTime(event.startsAt)}
                      {event.location ? ` · ${event.location}` : ''}
                      {event.recurrenceRule ? ' · recurring' : ''}
                    </CardDescription>
                  </div>
                  <Badge tone={event.visibility === 'published' ? 'success' : 'neutral'}>
                    {event.visibility}
                  </Badge>
                </CardHeader>
                {event.description ? (
                  <CardContent className="text-sm text-(--color-text-default)">
                    {event.description}
                  </CardContent>
                ) : null}
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
