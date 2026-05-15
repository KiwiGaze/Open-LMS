'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { FormField } from '@/components/patterns/form-field.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useAssignmentSubmissionsQuery,
  useSubmissionCommentsQuery,
} from '@/lib/api/queries/assignments.ts';
import {
  useCreateGradeAppealMutation,
  useGradebookEntriesQuery,
} from '@/lib/api/queries/gradebook.ts';
import { useMeQuery } from '@/lib/api/queries/me.ts';
import {
  pickLatestPlagiarismReport,
  useSubmissionPlagiarismReportsQuery,
} from '@/lib/api/queries/plagiarism.ts';
import { formatDateTime, formatNumber } from '@/lib/format.ts';
import { ExternalLink, FileText, Flag, MessageSquare, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

function sanitizeHttpsUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function MySubmissionPanel({
  tenantId,
  courseId,
  assignmentId,
}: {
  tenantId: string | null;
  courseId: string;
  assignmentId: string;
}) {
  const me = useMeQuery();
  const submissions = useAssignmentSubmissionsQuery(tenantId, courseId, assignmentId);
  const gradebook = useGradebookEntriesQuery(tenantId, courseId);

  const myUserId = me.data?.id;
  const mySubmissions = (submissions.data ?? []).filter((s) => s.studentId === myUserId);
  const latest = mySubmissions.reduce<(typeof mySubmissions)[number] | null>(
    (best, s) => (best === null || s.version > best.version ? s : best),
    null,
  );
  const myGradebookEntry = (gradebook.data ?? []).find(
    (entry) => entry.assignmentId === assignmentId && entry.studentId === myUserId,
  );

  const comments = useSubmissionCommentsQuery(tenantId, courseId, assignmentId, latest?.id ?? null);
  const plagiarism = useSubmissionPlagiarismReportsQuery(tenantId, latest?.id ?? null);
  const latestPlagiarismReport = pickLatestPlagiarismReport(plagiarism.data);
  const safeReportUrl = sanitizeHttpsUrl(latestPlagiarismReport?.reportUrl ?? null);
  const canAppeal = myGradebookEntry?.gradeStatus === 'published';
  const [appealOpen, setAppealOpen] = useState(false);

  if (submissions.isLoading || me.isLoading) {
    return <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />;
  }
  if (submissions.error) {
    return <ErrorState error={submissions.error} onRetry={() => submissions.refetch()} />;
  }
  if (me.error) {
    return <ErrorState error={me.error} onRetry={() => me.refetch()} />;
  }
  if (!latest) {
    return (
      <EmptyState
        icon={FileText}
        title="No submission yet"
        description="When you submit, your work and any instructor feedback will appear here."
      />
    );
  }

  const bodyText = latest.contentSnapshot
    .map((block) => block.text)
    .filter(Boolean)
    .join('\n\n');

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Your submission</CardTitle>
              <CardDescription>
                Submitted {formatDateTime(latest.submittedAt)} · version {latest.version}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                tone={
                  latest.status === 'returned'
                    ? 'success'
                    : latest.status === 'late'
                      ? 'warning'
                      : 'neutral'
                }
              >
                {latest.status}
              </Badge>
              {myGradebookEntry ? (
                <Badge tone="brand">
                  {formatNumber(myGradebookEntry.score, 1)} /{' '}
                  {formatNumber(myGradebookEntry.maxScore, 1)}
                </Badge>
              ) : null}
              {myGradebookEntry?.gradeStatus === 'appealed' ? (
                <Badge tone="warning">Appeal pending</Badge>
              ) : null}
              {canAppeal && latest ? (
                <Button intent="secondary" size="sm" onClick={() => setAppealOpen(true)}>
                  <Flag className="size-3.5" aria-hidden /> Appeal grade
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bodyText.length === 0 ? (
            <p className="text-sm text-(--color-text-muted)">
              This submission was made without inline text content.
            </p>
          ) : (
            <article className="prose prose-sm max-w-none whitespace-pre-wrap text-(--color-text-default)">
              {bodyText}
            </article>
          )}
        </CardContent>
      </Card>

      {latestPlagiarismReport ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Originality report</CardTitle>
                <CardDescription>
                  Checked {formatDateTime(latestPlagiarismReport.checkedAt)}
                </CardDescription>
              </div>
              <Badge
                tone={
                  latestPlagiarismReport.status === 'failed'
                    ? 'danger'
                    : latestPlagiarismReport.status === 'pending'
                      ? 'warning'
                      : latestPlagiarismReport.similarityPercent >= 40
                        ? 'danger'
                        : latestPlagiarismReport.similarityPercent >= 20
                          ? 'warning'
                          : 'success'
                }
              >
                <ShieldAlert className="mr-1 size-3" aria-hidden />
                {latestPlagiarismReport.status === 'complete'
                  ? `${latestPlagiarismReport.similarityPercent.toFixed(1)}% similar`
                  : latestPlagiarismReport.status}
              </Badge>
            </div>
          </CardHeader>
          {safeReportUrl ? (
            <CardContent className="pt-0">
              <a
                href={safeReportUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-sm font-medium text-(--color-brand-700) hover:underline"
              >
                Open full report
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Feedback</CardTitle>
          <CardDescription>Comments from your instructor.</CardDescription>
        </CardHeader>
        <CardContent>
          {comments.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : comments.error ? (
            <ErrorState error={comments.error} onRetry={() => comments.refetch()} />
          ) : (comments.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No feedback yet"
              description="Comments from your instructor will appear here after grading."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {comments.data?.map((comment) => (
                <li
                  key={comment.id}
                  className="rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-elevated) p-3"
                >
                  <p className="text-sm whitespace-pre-wrap text-(--color-text-default)">
                    {comment.body}
                  </p>
                  <p className="mt-1 text-xs text-(--color-text-muted)">
                    {formatDateTime(comment.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AppealDialog
        tenantId={tenantId}
        courseId={courseId}
        assignmentId={assignmentId}
        submissionId={latest.id}
        open={appealOpen}
        onOpenChange={setAppealOpen}
      />
    </div>
  );
}

function AppealDialog({
  tenantId,
  courseId,
  assignmentId,
  submissionId,
  open,
  onOpenChange,
}: {
  tenantId: string | null;
  courseId: string;
  assignmentId: string;
  submissionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { publish } = useToast();
  const create = useCreateGradeAppealMutation(tenantId, courseId, assignmentId, submissionId);
  const [reason, setReason] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length === 0) return;
    try {
      await create.mutateAsync(trimmed);
      publish({ tone: 'success', title: 'Appeal submitted' });
      setReason('');
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not file appeal.';
      publish({ tone: 'danger', title: 'Appeal failed', description: message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Appeal grade</DialogTitle>
          <DialogDescription>
            Explain why you believe the grade should be reconsidered. Your instructor will review.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Reason" id="appeal-reason" required>
            <Textarea
              id="appeal-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Describe the discrepancy and what you'd like reviewed."
              autoFocus
            />
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={create.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!reason.trim() || create.isPending}
              loading={create.isPending}
            >
              Submit appeal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
