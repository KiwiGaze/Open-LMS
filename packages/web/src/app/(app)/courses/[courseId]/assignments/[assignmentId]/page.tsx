'use client';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import {
  useAssignmentQuery,
  useAssignmentRubricQuery,
  useAssignmentScheduleQuery,
} from '@/lib/api/queries/assignments.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import { CalendarClock, EyeOff, FileText, ListChecks, Pencil, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { MySubmissionPanel } from './my-submission-panel.tsx';
import { SubmitAssignmentPanel } from './submit-panel.tsx';

type Params = { courseId: string; assignmentId: string };

export default function AssignmentDetailPage({ params }: { params: Promise<Params> }) {
  const { courseId, assignmentId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);

  const assignment = useAssignmentQuery(tenantId, courseId, assignmentId);
  const rubric = useAssignmentRubricQuery(tenantId, courseId, assignmentId);
  const schedule = useAssignmentScheduleQuery(tenantId, courseId, assignmentId);

  if (assignment.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (assignment.error) {
    return <ErrorState error={assignment.error} onRetry={() => assignment.refetch()} />;
  }
  if (!assignment.data) return null;

  const a = assignment.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Assignment"
        title={a.title}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              tone={
                a.status === 'published'
                  ? 'success'
                  : a.status === 'archived'
                    ? 'outline'
                    : 'neutral'
              }
            >
              {a.status}
            </Badge>
            {a.anonymousGradingEnabled ? <Badge tone="info">Anonymous</Badge> : null}
            {a.gradingLocked ? <Badge tone="warning">Locked</Badge> : null}
            {a.extraCredit ? <Badge tone="brand">Extra credit</Badge> : null}
            <Button asChild intent="secondary" size="sm">
              <Link href={`/courses/${courseId}/assignments/${assignmentId}/overrides`}>
                <Settings2 className="size-3.5" aria-hidden /> Overrides
              </Link>
            </Button>
            <Button asChild intent="secondary" size="sm">
              <Link href={`/courses/${courseId}/assignments/${assignmentId}/edit`}>
                <Pencil className="size-3.5" aria-hidden /> Edit
              </Link>
            </Button>
          </div>
        }
      />

      {a.anonymousGradingEnabled ? (
        <output className="flex items-start gap-3 rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-elevated) p-3">
          <EyeOff className="mt-0.5 size-4 text-(--color-text-muted)" aria-hidden />
          <div className="text-sm text-(--color-text-default)">
            <p className="font-medium">Anonymous grading is in effect.</p>
            <p className="mt-0.5 text-(--color-text-muted)">
              Staff views of submissions hide the learner&apos;s identity behind labels like
              &ldquo;Student A&rdquo;. The mapping back to identity is only revealed once grading is
              committed.
            </p>
          </div>
        </output>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <span className="rounded-[var(--radius-md)] bg-(--color-brand-subtle) p-2 text-(--color-brand-700)">
              <CalendarClock className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">Due</p>
              <p className="mt-0.5 text-sm font-medium text-(--color-text-default)">
                {schedule.data?.dueAt ? formatDateTime(schedule.data.dueAt) : 'No due date'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <span className="rounded-[var(--radius-md)] bg-(--color-brand-subtle) p-2 text-(--color-brand-700)">
              <ListChecks className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                Resubmission
              </p>
              <p className="mt-0.5 text-sm font-medium text-(--color-text-default)">
                {a.allowResubmission ? 'Allowed' : 'Single attempt'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <span className="rounded-[var(--radius-md)] bg-(--color-brand-subtle) p-2 text-(--color-brand-700)">
              <FileText className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                File types
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-(--color-text-default)">
                {a.allowedFileExtensions.length > 0
                  ? a.allowedFileExtensions.map((ext) => `.${ext}`).join(', ')
                  : 'Any'}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="instructions">
        <TabsList>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="rubric">Rubric</TabsTrigger>
          <TabsTrigger value="submit">Submit</TabsTrigger>
          <TabsTrigger value="my-submission">My submission</TabsTrigger>
        </TabsList>
        <TabsContent value="instructions">
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
              <CardDescription>What you need to complete this assignment.</CardDescription>
            </CardHeader>
            <CardContent>
              <article className="prose prose-sm max-w-none whitespace-pre-wrap text-(--color-text-default)">
                {a.instructions}
              </article>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rubric">
          <Card>
            <CardHeader>
              <CardTitle>Rubric</CardTitle>
              <CardDescription>How your work will be evaluated.</CardDescription>
            </CardHeader>
            <CardContent>
              {rubric.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : rubric.error ? (
                <ErrorState error={rubric.error} onRetry={() => rubric.refetch()} />
              ) : !rubric.data || rubric.data.criteria.length === 0 ? (
                <p className="text-sm text-(--color-text-muted)">
                  No rubric is attached to this assignment.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-(--color-border-subtle)">
                  {rubric.data.criteria.map((criterion) => {
                    const maxPoints = Math.max(0, ...criterion.levels.map((level) => level.points));
                    return (
                      <li key={criterion.id} className="py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-(--color-text-default)">
                            {criterion.label}
                          </p>
                          <span className="text-xs tabular-nums text-(--color-text-muted)">
                            {maxPoints} pts
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-(--color-text-muted)">
                          {criterion.description}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="submit">
          <SubmitAssignmentPanel
            tenantId={tenantId}
            courseId={courseId}
            assignmentId={assignmentId}
            allowedExtensions={a.allowedFileExtensions}
            maxFileSizeBytes={a.maxFileSizeBytes}
          />
        </TabsContent>
        <TabsContent value="my-submission">
          <MySubmissionPanel tenantId={tenantId} courseId={courseId} assignmentId={assignmentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
