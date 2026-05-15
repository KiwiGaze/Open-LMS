'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  DiscussionPostGrade,
  DiscussionTopic,
  DiscussionTopicSubscription,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useDiscussionTopicsQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.courseDiscussions(tenantId, courseId)
        : ['discussion-topics', 'inactive'],
    queryFn: () =>
      apiFetch<DiscussionTopic[]>(`/tenants/${tenantId}/courses/${courseId}/discussion-topics`),
    enabled: Boolean(tenantId && courseId),
  });
}

export type CreateDiscussionTopicInput = {
  title: string;
  prompt: string | null;
  visibility: 'draft' | 'published' | 'archived';
  position: number;
  gradingEnabled?: boolean;
  pointsPossible?: number | null;
  rubricId?: string | null;
  moduleId?: string | null;
  unitId?: string | null;
};

export function useCreateDiscussionTopic(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDiscussionTopicInput) =>
      apiFetch<DiscussionTopic>(`/tenants/${tenantId}/courses/${courseId}/discussion-topics`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseDiscussions(tenantId, courseId),
        });
      }
    },
  });
}

export function useSubscribeDiscussionTopic(
  tenantId: string | null,
  courseId: string | null,
  topicId: string | null,
) {
  return useMutation({
    mutationFn: () => {
      if (!tenantId || !courseId || !topicId) {
        return Promise.reject(new Error('No active topic — cannot subscribe.'));
      }
      return apiFetch<DiscussionTopicSubscription>(
        `/tenants/${tenantId}/courses/${courseId}/discussion-topics/${encodeURIComponent(topicId)}/subscription`,
        { method: 'PUT' },
      );
    },
  });
}

export function useUnsubscribeDiscussionTopic(
  tenantId: string | null,
  courseId: string | null,
  topicId: string | null,
) {
  return useMutation({
    mutationFn: () => {
      if (!tenantId || !courseId || !topicId) {
        return Promise.reject(new Error('No active topic — cannot unsubscribe.'));
      }
      return apiFetch<void>(
        `/tenants/${tenantId}/courses/${courseId}/discussion-topics/${encodeURIComponent(topicId)}/subscription`,
        { method: 'DELETE', responseType: 'void' },
      );
    },
  });
}

export function useDiscussionGradesQuery(
  tenantId: string | null,
  courseId: string | null,
  topicId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && topicId
        ? queryKeys.discussionGrades(tenantId, courseId, topicId)
        : ['discussion-grades', 'inactive'],
    queryFn: () =>
      apiFetch<DiscussionPostGrade[]>(
        `/tenants/${tenantId}/courses/${courseId}/discussion-topics/${topicId}/grades`,
      ),
    enabled: Boolean(tenantId && courseId && topicId),
  });
}

export function useUpsertDiscussionPostGrade(
  tenantId: string | null,
  courseId: string | null,
  topicId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      postId: string;
      score: number;
      maxScore: number;
      status: 'draft' | 'published' | 'revised';
      comment: string | null;
    }) =>
      apiFetch<DiscussionPostGrade>(
        `/tenants/${tenantId}/courses/${courseId}/discussion-topics/${topicId}/posts/${input.postId}/grade`,
        {
          method: 'PUT',
          body: {
            score: input.score,
            maxScore: input.maxScore,
            status: input.status,
            comment: input.comment,
          },
        },
      ),
    onSuccess: () => {
      if (tenantId && courseId && topicId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.discussionGrades(tenantId, courseId, topicId),
        });
      }
    },
  });
}
