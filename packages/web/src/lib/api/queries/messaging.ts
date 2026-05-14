'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  ConversationMessage,
  ConversationThread,
  CourseMembership,
  MessageableUser,
  TenantMessageableUser,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useInboxThreadsQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.inboxThreads(tenantId) : ['inbox', 'inactive'],
    queryFn: () => apiFetch<ConversationThread[]>(`/tenants/${tenantId}/inbox/threads`),
    enabled: Boolean(tenantId),
  });
}

export function useConversationMessagesQuery(tenantId: string | null, threadId: string | null) {
  return useQuery({
    queryKey:
      tenantId && threadId
        ? queryKeys.conversationMessages(tenantId, threadId)
        : ['conversation-messages', 'inactive'],
    queryFn: () =>
      apiFetch<ConversationMessage[]>(`/tenants/${tenantId}/inbox/threads/${threadId}/messages`),
    enabled: Boolean(tenantId && threadId),
  });
}

export function useCreateConversationMessageMutation(
  tenantId: string | null,
  threadId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      apiFetch<ConversationMessage>(`/tenants/${tenantId}/inbox/threads/${threadId}/messages`, {
        method: 'POST',
        body: { body },
      }),
    onSuccess: () => {
      if (tenantId && threadId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversationMessages(tenantId, threadId),
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
  courseId: string | null;
};

export function useCreateConversationThreadMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateConversationThreadInput) =>
      apiFetch<ConversationThread>(`/tenants/${tenantId}/inbox/threads`, {
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

export function useMessageableUsersQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.messageableUsers(tenantId, courseId)
        : ['messageable-users', 'inactive'],
    queryFn: () =>
      apiFetch<MessageableUser[]>(`/tenants/${tenantId}/courses/${courseId}/messageable-users`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useTenantMessageableUsersQuery(tenantId: string | null, enabled = true) {
  return useQuery({
    queryKey: tenantId
      ? queryKeys.tenantMessageableUsers(tenantId)
      : ['tenant-messageable-users', 'inactive'],
    queryFn: () => apiFetch<TenantMessageableUser[]>(`/tenants/${tenantId}/messageable-users`),
    enabled: Boolean(tenantId) && enabled,
  });
}
