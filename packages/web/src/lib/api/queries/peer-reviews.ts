'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { AssignmentPeerReview, AssignmentPeerReviewResponse } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function usePeerReviewsQuery(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && assignmentId
        ? queryKeys.assignmentPeerReviews(tenantId, courseId, assignmentId)
        : ['peer-reviews', 'inactive'],
    queryFn: () =>
      apiFetch<AssignmentPeerReview[]>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/peer-reviews`,
      ),
    enabled: Boolean(tenantId && courseId && assignmentId),
  });
}

export function usePeerReviewResponsesQuery(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
  peerReviewId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && assignmentId && peerReviewId
        ? queryKeys.peerReviewResponses(tenantId, courseId, assignmentId, peerReviewId)
        : ['peer-review-responses', 'inactive'],
    queryFn: () =>
      apiFetch<AssignmentPeerReviewResponse[]>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/peer-reviews/${peerReviewId}/responses`,
      ),
    enabled: Boolean(tenantId && courseId && assignmentId && peerReviewId),
  });
}

export function useUpsertPeerReviewResponse(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
  peerReviewId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      criterionId: string;
      score: number | null;
      comment: string | null;
      status: 'draft' | 'submitted';
    }) =>
      apiFetch<AssignmentPeerReviewResponse>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/peer-reviews/${peerReviewId}/responses/${input.criterionId}`,
        {
          method: 'PUT',
          body: { score: input.score, comment: input.comment, status: input.status },
        },
      ),
    onSuccess: () => {
      if (tenantId && courseId && assignmentId && peerReviewId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.peerReviewResponses(tenantId, courseId, assignmentId, peerReviewId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.assignmentPeerReviews(tenantId, courseId, assignmentId),
        });
      }
    },
  });
}
