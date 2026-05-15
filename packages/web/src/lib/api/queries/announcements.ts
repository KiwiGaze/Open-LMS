'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { CourseAnnouncement } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CourseAnnouncementInput = {
  title: string;
  body: string;
  status: 'draft' | 'published';
  pinned: boolean;
};

export function useCourseAnnouncementsQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.courseAnnouncements(tenantId, courseId)
        : ['announcements', 'inactive'],
    queryFn: () =>
      apiFetch<CourseAnnouncement[]>(`/tenants/${tenantId}/courses/${courseId}/announcements`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useTenantAnnouncementsQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId
      ? queryKeys.tenantAnnouncements(tenantId)
      : ['announcements', 'tenant', 'inactive'],
    queryFn: () => apiFetch<CourseAnnouncement[]>(`/tenants/${tenantId}/announcements`),
    enabled: Boolean(tenantId),
  });
}

export function useCreateCourseAnnouncementMutation(
  tenantId: string | null,
  courseId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseAnnouncementInput) =>
      apiFetch<CourseAnnouncement>(`/tenants/${tenantId}/courses/${courseId}/announcements`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseAnnouncements(tenantId, courseId),
        });
      }
    },
  });
}

export function useUpdateCourseAnnouncementMutation(
  tenantId: string | null,
  courseId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      announcementId,
      input,
    }: {
      announcementId: string;
      input: CourseAnnouncementInput;
    }) =>
      apiFetch<CourseAnnouncement>(
        `/tenants/${tenantId}/courses/${courseId}/announcements/${announcementId}`,
        { method: 'PUT', body: input },
      ),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseAnnouncements(tenantId, courseId),
        });
      }
    },
  });
}

export function useDeleteCourseAnnouncementMutation(
  tenantId: string | null,
  courseId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (announcementId: string) =>
      apiFetch<void>(`/tenants/${tenantId}/courses/${courseId}/announcements/${announcementId}`, {
        method: 'DELETE',
        responseType: 'void',
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseAnnouncements(tenantId, courseId),
        });
      }
    },
  });
}
