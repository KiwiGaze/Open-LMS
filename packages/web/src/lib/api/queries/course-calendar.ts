'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { CourseCalendarEvent, CourseCalendarEventVisibility } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CourseCalendarEventInput = {
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  visibility: CourseCalendarEventVisibility;
  recurrenceRule: string | null;
};

export function useCourseCalendarEventsQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.courseCalendar(tenantId, courseId)
        : ['course-calendar', 'inactive'],
    queryFn: () =>
      apiFetch<CourseCalendarEvent[]>(`/tenants/${tenantId}/courses/${courseId}/calendar-events`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useCreateCourseCalendarEventMutation(
  tenantId: string | null,
  courseId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseCalendarEventInput) => {
      if (!tenantId || !courseId) {
        return Promise.reject(new Error('No active course — cannot create event.'));
      }
      return apiFetch<CourseCalendarEvent>(
        `/tenants/${tenantId}/courses/${courseId}/calendar-events`,
        { method: 'POST', body: input },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseCalendar(tenantId, courseId),
        });
      }
    },
  });
}

export function useDeleteCourseCalendarEventMutation(
  tenantId: string | null,
  courseId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => {
      if (!tenantId || !courseId) {
        return Promise.reject(new Error('No active course — cannot delete event.'));
      }
      return apiFetch<void>(
        `/tenants/${tenantId}/courses/${courseId}/calendar-events/${encodeURIComponent(eventId)}`,
        { method: 'DELETE', responseType: 'void' },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseCalendar(tenantId, courseId),
        });
      }
    },
  });
}
