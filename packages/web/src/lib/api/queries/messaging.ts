'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { ConversationMessage, ConversationThread, CourseMembership } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useInboxThreadsQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.inboxThreads(tenantId) : ['inbox', 'inactive'],
    queryFn: () => apiFetch<ConversationThread[]>(`/tenants/${tenantId}/inbox/threads`),
    enabled: Boolean(tenantId),
  });
}

export function useConversationMessagesQuery(
  tenantId: string | null,
  courseId: string | null,
  threadId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && threadId
        ? queryKeys.conversationMessages(tenantId, courseId, threadId)
        : ['conversation-messages', 'inactive'],
    queryFn: () =>
      apiFetch<ConversationMessage[]>(
        `/tenants/${tenantId}/courses/${courseId}/conversations/${threadId}/messages`,
      ),
    enabled: Boolean(tenantId && courseId && threadId),
  });
}

export function useCreateConversationMessageMutation(
  tenantId: string | null,
  courseId: string | null,
  threadId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      apiFetch<ConversationMessage>(
        `/tenants/${tenantId}/courses/${courseId}/conversations/${threadId}/messages`,
        { method: 'POST', body: { body } },
      ),
    onSuccess: () => {
      if (tenantId && courseId && threadId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversationMessages(tenantId, courseId, threadId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.inboxThreads(tenantId) });
      }
    },
  });
}

export type CreateConversationThreadInput = {
  subject: string;
  body: string;
  participantIds: string[];
};

export function useCreateConversationThreadMutation(
  tenantId: string | null,
  courseId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateConversationThreadInput) =>
      apiFetch<ConversationThread>(`/tenants/${tenantId}/courses/${courseId}/conversations`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.inboxThreads(tenantId) });
      }
    },
  });
}

export function useCourseMembershipsQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.coursePeople(tenantId, courseId)
        : ['memberships', 'inactive'],
    queryFn: () =>
      apiFetch<CourseMembership[]>(`/tenants/${tenantId}/courses/${courseId}/memberships`),
    enabled: Boolean(tenantId && courseId),
  });
}
