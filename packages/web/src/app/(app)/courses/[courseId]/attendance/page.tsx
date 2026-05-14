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
import { useAttendanceSessionsQuery } from '@/lib/api/queries/attendance.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import { CalendarCheck, ClipboardList, Plus } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
import { SessionDialog } from './session-dialog.tsx';

type Params = { courseId: string };

export default function CourseAttendancePage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const sessions = useAttendanceSessionsQuery(tenantId, courseId);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Attendance"
        title="Sessions"
        description="Take roll for each class meeting and view per-session summaries."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" aria-hidden /> New session
          </Button>
        }
      />

      {sessions.isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`att-skel-${i}`} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : sessions.error ? (
        <ErrorState error={sessions.error} onRetry={() => sessions.refetch()} />
      ) : (sessions.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No sessions yet"
          description="Create the first attendance session for this course."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" aria-hidden /> New session
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {sessions.data
            ?.slice()
            .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
            .map((session) => (
              <Card key={session.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base">{session.title}</CardTitle>
                      <CardDescription>
                        {formatDateTime(session.startsAt)} — {formatDateTime(session.endsAt)}
                      </CardDescription>
                    </div>
                    <Badge
                      tone={
                        session.status === 'scheduled'
                          ? 'brand'
                          : session.status === 'completed'
                            ? 'success'
                            : 'outline'
                      }
                    >
                      {session.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild intent="secondary" size="sm">
                    <Link href={`/courses/${courseId}/attendance/${session.id}`}>
                      <ClipboardList className="size-4" aria-hidden /> Take roll
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <SessionDialog
        tenantId={tenantId}
        courseId={courseId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
