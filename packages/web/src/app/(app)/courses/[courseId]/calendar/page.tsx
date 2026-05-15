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
import { useToast } from '@/components/ui/toast.tsx';
import {
  useCourseCalendarEventsQuery,
  useDeleteCourseCalendarEventMutation,
} from '@/lib/api/queries/course-calendar.ts';
import { useMyCourseMembershipsQuery } from '@/lib/api/queries/me.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { use, useState } from 'react';
import { CalendarEventDialog } from './event-dialog.tsx';

const STAFF_ROLES = new Set(['instructor', 'teaching_assistant', 'course_admin']);

type Params = { courseId: string };

export default function CourseCalendarPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();
  const myCourseMemberships = useMyCourseMembershipsQuery();
  const isStaff =
    myCourseMemberships.data?.some((m) => m.courseId === courseId && STAFF_ROLES.has(m.role)) ??
    false;

  const events = useCourseCalendarEventsQuery(tenantId, courseId);
  const deleteEvent = useDeleteCourseCalendarEventMutation(tenantId, courseId);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = (eventId: string, title: string) => {
    if (!window.confirm(`Delete event "${title}"?`)) return;
    deleteEvent.mutate(eventId, {
      onSuccess: () => publish({ tone: 'success', title: 'Event deleted' }),
      onError: (error) =>
        publish({
          tone: 'danger',
          title: 'Delete failed',
          description: error instanceof Error ? error.message : undefined,
        }),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-(--color-text-muted)">
          Lectures, office hours, and ad-hoc events for this course.
        </p>
        {isStaff ? (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" aria-hidden /> New event
          </Button>
        ) : null}
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
                  <div className="flex items-center gap-2">
                    <Badge tone={event.visibility === 'published' ? 'success' : 'neutral'}>
                      {event.visibility}
                    </Badge>
                    {isStaff ? (
                      <Button
                        intent="ghost"
                        size="icon-sm"
                        aria-label={`Delete event ${event.title}`}
                        onClick={() => handleDelete(event.id, event.title)}
                        disabled={deleteEvent.isPending}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
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

      <CalendarEventDialog
        tenantId={tenantId}
        courseId={courseId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
