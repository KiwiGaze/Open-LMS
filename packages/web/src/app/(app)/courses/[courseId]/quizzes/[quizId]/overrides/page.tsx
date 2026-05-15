'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useDeleteQuizOverrideMutation,
  useQuizOverridesQuery,
} from '@/lib/api/queries/quiz-overrides.ts';
import { useQuizQuery } from '@/lib/api/queries/quizzes.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { QuizOverride } from '@openlms/contracts';
import { ArrowLeft, CalendarClock, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
import { QuizOverrideDialog } from './override-dialog.tsx';

type Params = { courseId: string; quizId: string };

export default function QuizOverridesPage({ params }: { params: Promise<Params> }) {
  const { courseId, quizId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();

  const quiz = useQuizQuery(tenantId, courseId, quizId);
  const overrides = useQuizOverridesQuery(tenantId, courseId, quizId);
  const deleteOverride = useDeleteQuizOverrideMutation(tenantId, courseId, quizId);

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = async (override: QuizOverride) => {
    if (deleteOverride.isPending) return;
    if (!window.confirm(`Delete override for ${override.targetId.slice(-12)}?`)) return;
    try {
      await deleteOverride.mutateAsync(override.id);
      publish({ tone: 'success', title: 'Override deleted' });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not delete. Try again.';
      publish({ tone: 'danger', title: 'Delete failed', description: message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Quiz overrides"
        title={quiz.data ? `Overrides for "${quiz.data.title}"` : 'Overrides'}
        description="Customize availability, time limit, and attempt count for individual users, groups, or sections."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild intent="ghost">
              <Link href={`/courses/${courseId}/quizzes/${quizId}`}>
                <ArrowLeft className="size-4" aria-hidden /> Back to quiz
              </Link>
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" aria-hidden /> New override
            </Button>
          </div>
        }
      />

      {overrides.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      ) : overrides.error ? (
        <ErrorState error={overrides.error} onRetry={() => overrides.refetch()} />
      ) : (overrides.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No overrides"
          description="Apply per-student, per-section, or per-group accommodations here."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" aria-hidden /> New override
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 110 }}>Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Opens at</TableHead>
              <TableHead>Closes at</TableHead>
              <TableHead style={{ width: 110 }}>Time limit</TableHead>
              <TableHead style={{ width: 100 }}>Attempts</TableHead>
              <TableHead style={{ width: 100 }}>Status</TableHead>
              <TableHead style={{ width: 80, textAlign: 'right' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overrides.data?.map((override) => (
              <TableRow key={override.id}>
                <TableCell>
                  <Badge tone="info">{override.targetType}</Badge>
                </TableCell>
                <TableCell className="text-sm text-(--color-text-default)">
                  <code className="font-mono text-xs">{override.targetId.slice(-12)}</code>
                </TableCell>
                <TableCell className="text-(--color-text-muted)">
                  {override.opensAt ? formatDateTime(override.opensAt) : '—'}
                </TableCell>
                <TableCell className="text-(--color-text-muted)">
                  {override.closesAt ? formatDateTime(override.closesAt) : '—'}
                </TableCell>
                <TableCell className="text-(--color-text-muted)">
                  {override.timeLimitMinutes !== null ? `${override.timeLimitMinutes} min` : '—'}
                </TableCell>
                <TableCell className="text-(--color-text-muted)">
                  {override.maxAttempts !== null ? override.maxAttempts : '—'}
                </TableCell>
                <TableCell>
                  <Badge tone={override.status === 'active' ? 'success' : 'neutral'}>
                    {override.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      intent="ghost"
                      size="icon-sm"
                      aria-label="Delete override"
                      onClick={() => handleDelete(override)}
                      disabled={deleteOverride.isPending}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <QuizOverrideDialog
        tenantId={tenantId}
        courseId={courseId}
        quizId={quizId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
