'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { FormField } from '@/components/patterns/form-field.tsx';
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
import { Input } from '@/components/ui/input.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useAssignmentRubricQuery } from '@/lib/api/queries/assignments.ts';
import {
  usePeerReviewResponsesQuery,
  usePeerReviewsQuery,
  useUpsertPeerReviewResponse,
} from '@/lib/api/queries/peer-reviews.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import type { AssignmentPeerReviewResponse, RubricCriterion } from '@openlms/contracts';
import { Save, Send } from 'lucide-react';
import Link from 'next/link';
import { use, useMemo, useState } from 'react';

type Params = { courseId: string; assignmentId: string; peerReviewId: string };

type DraftValues = { score: string; comment: string };

export default function PeerReviewFormPage({ params }: { params: Promise<Params> }) {
  const { courseId, assignmentId, peerReviewId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);

  const reviews = usePeerReviewsQuery(tenantId, courseId, assignmentId);
  const responses = usePeerReviewResponsesQuery(tenantId, courseId, assignmentId, peerReviewId);
  const rubric = useAssignmentRubricQuery(tenantId, courseId, assignmentId);

  const review = reviews.data?.find((r) => r.id === peerReviewId);
  const criteria = rubric.data?.criteria ?? [];

  const responsesByCriterion = useMemo(() => {
    const map = new Map<string, AssignmentPeerReviewResponse>();
    for (const r of responses.data ?? []) {
      map.set(r.criterionId, r);
    }
    return map;
  }, [responses.data]);

  const isLoading = reviews.isLoading || responses.isLoading || rubric.isLoading;
  const loadError = reviews.error || responses.error || rubric.error;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Workshop"
        title={review ? `Review · submission ${review.submissionId.slice(-12)}` : 'Peer review'}
        description="Score each criterion. Drafts save without locking; submit when you're done."
        actions={
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}/assignments/${assignmentId}/peer-reviews`}>
              Back to reviews
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`crit-${i}`} className="h-40 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : loadError ? (
        <ErrorState
          error={loadError}
          onRetry={() => {
            reviews.refetch();
            responses.refetch();
            rubric.refetch();
          }}
        />
      ) : !review ? (
        <ErrorState
          title="Review not found"
          error={new Error('It may have been cancelled or reassigned.')}
        />
      ) : criteria.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-(--color-text-muted)">
            This assignment doesn't have a rubric, so there are no criteria to score yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {criteria.map((criterion) => (
            <li key={criterion.id}>
              <CriterionRow
                tenantId={tenantId}
                courseId={courseId}
                assignmentId={assignmentId}
                peerReviewId={peerReviewId}
                criterion={criterion}
                existing={responsesByCriterion.get(criterion.id) ?? null}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type CriterionRowProps = {
  tenantId: string | null;
  courseId: string;
  assignmentId: string;
  peerReviewId: string;
  criterion: RubricCriterion;
  existing: AssignmentPeerReviewResponse | null;
};

function CriterionRow({
  tenantId,
  courseId,
  assignmentId,
  peerReviewId,
  criterion,
  existing,
}: CriterionRowProps) {
  const upsert = useUpsertPeerReviewResponse(tenantId, courseId, assignmentId, peerReviewId);
  const { publish } = useToast();
  const maxPoints = Math.max(0, ...criterion.levels.map((l) => l.points));
  const [draft, setDraft] = useState<DraftValues>({
    score: existing?.score === null || existing?.score === undefined ? '' : String(existing.score),
    comment: existing?.comment ?? '',
  });
  const [scoreError, setScoreError] = useState<string | null>(null);

  const isLocked = existing?.status === 'submitted';

  const save = async (status: 'draft' | 'submitted') => {
    setScoreError(null);
    const trimmedScore = draft.score.trim();
    let parsedScore: number | null = null;
    if (trimmedScore !== '') {
      const n = Number(trimmedScore);
      if (!Number.isFinite(n) || n < 0 || n > maxPoints) {
        setScoreError(`Score must be between 0 and ${maxPoints}.`);
        return;
      }
      parsedScore = n;
    } else if (status === 'submitted') {
      setScoreError('Enter a score before submitting.');
      return;
    }
    try {
      await upsert.mutateAsync({
        criterionId: criterion.id,
        score: parsedScore,
        comment: draft.comment.trim() === '' ? null : draft.comment.trim(),
        status,
      });
      publish({
        tone: status === 'submitted' ? 'success' : 'neutral',
        title: status === 'submitted' ? 'Response submitted' : 'Draft saved',
      });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not save your response.';
      publish({ tone: 'danger', title: 'Save failed', description: message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{criterion.label}</CardTitle>
            <CardDescription className="whitespace-pre-wrap">
              {criterion.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {existing ? (
              <Badge tone={existing.status === 'submitted' ? 'success' : 'neutral'}>
                {existing.status}
              </Badge>
            ) : null}
            <Badge tone="outline">Max {maxPoints} pts</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {criterion.levels.map((level) => (
            <li
              key={level.id}
              className="rounded-[var(--radius-sm)] border border-(--color-border-subtle) bg-(--color-surface-base) p-3"
            >
              <p className="text-xs font-medium text-(--color-text-default)">
                {level.label} · {level.points} pts
              </p>
              <p className="mt-1 text-xs text-(--color-text-muted)">{level.description}</p>
            </li>
          ))}
        </ul>
        <div className="grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
          <FormField id={`score-${criterion.id}`} label="Score" error={scoreError ?? undefined}>
            <Input
              id={`score-${criterion.id}`}
              type="number"
              min={0}
              max={maxPoints}
              step="any"
              value={draft.score}
              onChange={(e) => setDraft((d) => ({ ...d, score: e.target.value }))}
              disabled={isLocked}
              invalid={Boolean(scoreError)}
              placeholder={`/ ${maxPoints}`}
            />
          </FormField>
          <FormField id={`comment-${criterion.id}`} label="Comment">
            <Textarea
              id={`comment-${criterion.id}`}
              rows={3}
              value={draft.comment}
              onChange={(e) => setDraft((d) => ({ ...d, comment: e.target.value }))}
              disabled={isLocked}
              placeholder="Optional feedback for the author…"
            />
          </FormField>
          <div className="flex flex-col items-end gap-2">
            <Button
              intent="secondary"
              size="sm"
              onClick={() => save('draft')}
              disabled={isLocked || upsert.isPending}
              loading={upsert.isPending}
            >
              <Save className="size-4" aria-hidden /> Save draft
            </Button>
            <Button
              size="sm"
              onClick={() => save('submitted')}
              disabled={isLocked || upsert.isPending}
              loading={upsert.isPending}
            >
              <Send className="size-4" aria-hidden /> Submit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
