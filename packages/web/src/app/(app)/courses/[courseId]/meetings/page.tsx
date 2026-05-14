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
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useMyCourseMembershipsQuery } from '@/lib/api/queries/me.ts';
import {
  useCourseMeetingsQuery,
  useDeleteCourseMeetingMutation,
} from '@/lib/api/queries/meetings.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { CourseMeeting } from '@openlms/contracts';
import { ExternalLink, Pencil, Plus, Trash2, Video } from 'lucide-react';
import { use, useMemo, useState } from 'react';
import { MeetingDialog } from './meeting-dialog.tsx';

type Params = { courseId: string };

const COURSE_STAFF_ROLES = new Set(['instructor', 'teaching_assistant', 'course_admin']);

export default function CourseMeetingsPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();

  const meetings = useCourseMeetingsQuery(tenantId, courseId);
  const myCourseMemberships = useMyCourseMembershipsQuery();
  const deleteMeeting = useDeleteCourseMeetingMutation(tenantId, courseId);

  const isStaff =
    myCourseMemberships.data?.some(
      (m) => m.courseId === courseId && COURSE_STAFF_ROLES.has(m.role),
    ) ?? false;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CourseMeeting | null>(null);

  const { upcoming, past } = useMemo(() => {
    const list = meetings.data ?? [];
    const now = Date.now();
    const visible = list.slice().sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    const isPast = (m: CourseMeeting) => {
      if (m.status === 'ended' || m.status === 'cancelled') return true;
      if (m.endsAt) return m.endsAt.getTime() < now;
      return m.startsAt.getTime() < now - 4 * 60 * 60 * 1000;
    };
    return {
      upcoming: visible.filter((m) => !isPast(m)),
      past: visible.filter(isPast).reverse(),
    };
  }, [meetings.data]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (meeting: CourseMeeting) => {
    setEditing(meeting);
    setDialogOpen(true);
  };
  const handleDelete = async (meeting: CourseMeeting) => {
    if (deleteMeeting.isPending) return;
    if (!window.confirm(`Delete meeting “${meeting.title}”?`)) return;
    try {
      await deleteMeeting.mutateAsync(meeting.id);
      publish({ tone: 'success', title: 'Meeting deleted' });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not delete. Try again.';
      publish({ tone: 'danger', title: 'Delete failed', description: message });
    }
  };

  const renderCard = (meeting: CourseMeeting) => (
    <Card key={meeting.id}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{meeting.title}</CardTitle>
            <CardDescription>
              {formatDateTime(meeting.startsAt)}
              {meeting.endsAt ? ` — ${formatDateTime(meeting.endsAt)}` : null}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge tone="neutral">{meeting.provider.replace(/_/g, ' ')}</Badge>
            <Badge
              tone={
                meeting.status === 'scheduled'
                  ? 'brand'
                  : meeting.status === 'in_progress'
                    ? 'success'
                    : meeting.status === 'cancelled'
                      ? 'danger'
                      : 'outline'
              }
            >
              {meeting.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {meeting.description ? (
          <p className="text-sm whitespace-pre-wrap text-(--color-text-default)">
            {meeting.description}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {meeting.status === 'ended' && meeting.playbackUrl ? (
            <Button asChild intent="secondary" size="sm">
              <a href={meeting.playbackUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" aria-hidden /> Watch playback
              </a>
            </Button>
          ) : meeting.status === 'cancelled' ? null : (
            <Button asChild size="sm">
              <a href={meeting.externalUrl} target="_blank" rel="noopener noreferrer">
                <Video className="size-4" aria-hidden /> Join
              </a>
            </Button>
          )}
          {isStaff ? (
            <>
              <Button
                intent="ghost"
                size="icon-sm"
                aria-label="Edit meeting"
                onClick={() => openEdit(meeting)}
              >
                <Pencil className="size-4" aria-hidden />
              </Button>
              <Button
                intent="ghost"
                size="icon-sm"
                aria-label="Delete meeting"
                onClick={() => handleDelete(meeting)}
                disabled={deleteMeeting.isPending}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Meetings"
        title="Course meetings"
        description="Live sessions, office hours, and other synchronous time."
        actions={
          isStaff ? (
            <Button onClick={openNew}>
              <Plus className="size-4" aria-hidden /> New meeting
            </Button>
          ) : null
        }
      />

      {meetings.isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`mtg-skel-${i}`} className="h-32 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : meetings.error ? (
        <ErrorState error={meetings.error} onRetry={() => meetings.refetch()} />
      ) : (meetings.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Video}
          title="No meetings yet"
          description={
            isStaff
              ? 'Schedule the first live session for this course.'
              : 'Your instructor has not scheduled any meetings yet.'
          }
          action={
            isStaff ? (
              <Button onClick={openNew}>
                <Plus className="size-4" aria-hidden /> New meeting
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-(--color-text-muted)">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-(--color-text-muted)">No upcoming meetings.</p>
            ) : (
              <div className="grid gap-3">{upcoming.map(renderCard)}</div>
            )}
          </section>
          {past.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium uppercase tracking-wider text-(--color-text-muted)">
                Past
              </h2>
              <div className="grid gap-3">{past.map(renderCard)}</div>
            </section>
          ) : null}
        </div>
      )}

      {isStaff ? (
        <MeetingDialog
          tenantId={tenantId}
          courseId={courseId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          existing={editing}
        />
      ) : null}
    </div>
  );
}
