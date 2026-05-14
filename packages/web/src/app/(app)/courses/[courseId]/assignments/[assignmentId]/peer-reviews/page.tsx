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
import { usePeerReviewsQuery } from '@/lib/api/queries/peer-reviews.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDate } from '@/lib/format.ts';
import type { AssignmentPeerReview } from '@openlms/contracts';
import { ClipboardCheck, Pencil, Users } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string; assignmentId: string };

function statusTone(
  status: AssignmentPeerReview['status'],
): 'success' | 'warning' | 'neutral' | 'danger' {
  if (status === 'completed') return 'success';
  if (status === 'submitted') return 'warning';
  if (status === 'cancelled') return 'danger';
  return 'neutral';
}

export default function PeerReviewsPage({ params }: { params: Promise<Params> }) {
  const { courseId, assignmentId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const reviews = usePeerReviewsQuery(tenantId, courseId, assignmentId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Workshop"
        title="Peer reviews"
        description="Reviews assigned to you for this assignment. Submit a per-criterion score and feedback for each."
        actions={
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}/assignments/${assignmentId}`}>
              Back to assignment
            </Link>
          </Button>
        }
      />

      {reviews.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`pr-${i}`} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : reviews.error ? (
        <ErrorState error={reviews.error} onRetry={() => reviews.refetch()} />
      ) : (reviews.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Users}
          title="No reviews assigned"
          description="When your instructor assigns peer reviews, they'll appear here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {(reviews.data ?? [])
            .filter((r) => r.status !== 'cancelled')
            .map((review) => (
              <li key={review.id}>
                <Card>
                  <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
                    <div>
                      <CardTitle className="text-base">
                        Submission{' '}
                        <span className="font-mono text-sm text-(--color-text-muted)">
                          {review.submissionId.slice(-12)}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {review.dueAt
                          ? `Review due ${formatDate(review.dueAt)}`
                          : 'No deadline set'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(review.status)}>{review.status}</Badge>
                      <Button asChild>
                        <Link
                          href={`/courses/${courseId}/assignments/${assignmentId}/peer-reviews/${review.id}`}
                        >
                          {review.status === 'completed' || review.status === 'submitted' ? (
                            <>
                              <ClipboardCheck className="size-4" aria-hidden /> View review
                            </>
                          ) : (
                            <>
                              <Pencil className="size-4" aria-hidden /> Open review
                            </>
                          )}
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-(--color-text-muted)" />
                </Card>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
