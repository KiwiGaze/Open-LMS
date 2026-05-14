'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { CoursePage, CoursePageVisibility } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CoursePageInput = {
  title: string;
  body: string;
  visibility: CoursePageVisibility;
  learningObjectiveIds: string[];
};

export function useCoursePagesQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId ? queryKeys.coursePages(tenantId, courseId) : ['pages', 'inactive'],
    queryFn: () => apiFetch<CoursePage[]>(`/tenants/${tenantId}/courses/${courseId}/pages`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useCoursePageQuery(
  tenantId: string | null,
  courseId: string | null,
  pageId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && pageId
        ? queryKeys.coursePage(tenantId, courseId, pageId)
        : ['page', 'inactive'],
    queryFn: () => apiFetch<CoursePage>(`/tenants/${tenantId}/courses/${courseId}/pages/${pageId}`),
    enabled: Boolean(tenantId && courseId && pageId),
  });
}

export function useCreateCoursePageMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CoursePageInput) =>
      apiFetch<CoursePage>(`/tenants/${tenantId}/courses/${courseId}/pages`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.coursePages(tenantId, courseId),
        });
      }
    },
  });
}

export function useUpdateCoursePageMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, input }: { pageId: string; input: CoursePageInput }) =>
      apiFetch<CoursePage>(`/tenants/${tenantId}/courses/${courseId}/pages/${pageId}`, {
        method: 'PUT',
        body: input,
      }),
    onSuccess: (_data, vars) => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.coursePages(tenantId, courseId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.coursePage(tenantId, courseId, vars.pageId),
        });
      }
    },
  });
}

export function useDeleteCoursePageMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pageId: string) =>
      apiFetch<void>(`/tenants/${tenantId}/courses/${courseId}/pages/${pageId}`, {
        method: 'DELETE',
        responseType: 'void',
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.coursePages(tenantId, courseId),
        });
      }
    },
  });
}
