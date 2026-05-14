'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { CourseMeeting, CourseMeetingProvider, CourseMeetingStatus } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CourseMeetingInput = {
  title: string;
  description: string | null;
  provider: CourseMeetingProvider;
  externalUrl: string;
  startsAt: string;
  endsAt: string | null;
  recordingUrl: string | null;
  playbackUrl: string | null;
  status: CourseMeetingStatus;
};

function rejectIfMissingScope(tenantId: string | null, courseId: string | null) {
  if (!tenantId || !courseId) {
    return Promise.reject(new Error('No active tenant or course — cannot save meeting.'));
  }
  return null;
}

export function useCourseMeetingsQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.courseMeetings(tenantId, courseId)
        : ['meetings', 'inactive'],
    queryFn: () => apiFetch<CourseMeeting[]>(`/tenants/${tenantId}/courses/${courseId}/meetings`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useCreateCourseMeetingMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseMeetingInput) => {
      const guard = rejectIfMissingScope(tenantId, courseId);
      if (guard) return guard;
      return apiFetch<CourseMeeting>(`/tenants/${tenantId}/courses/${courseId}/meetings`, {
        method: 'POST',
        body: input,
      });
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.courseMeetings(tenantId, courseId) });
      }
    },
  });
}

export function useUpdateCourseMeetingMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, input }: { meetingId: string; input: CourseMeetingInput }) => {
      const guard = rejectIfMissingScope(tenantId, courseId);
      if (guard) return guard;
      return apiFetch<CourseMeeting>(
        `/tenants/${tenantId}/courses/${courseId}/meetings/${meetingId}`,
        { method: 'PUT', body: input },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.courseMeetings(tenantId, courseId) });
      }
    },
  });
}

export function useDeleteCourseMeetingMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => {
      const guard = rejectIfMissingScope(tenantId, courseId);
      if (guard) return guard;
      return apiFetch<void>(`/tenants/${tenantId}/courses/${courseId}/meetings/${meetingId}`, {
        method: 'DELETE',
        responseType: 'void',
      });
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.courseMeetings(tenantId, courseId) });
      }
    },
  });
}
