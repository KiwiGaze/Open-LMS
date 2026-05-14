'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  CatalogCourse,
  CatalogVisibility,
  Course,
  CourseAnalyticsSummary,
  CourseCatalogSettings,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CreateCourseInput = {
  code: string;
  title: string;
  status: 'draft' | 'active' | 'archived';
  startsAt: string | null;
  endsAt: string | null;
  catalogCategory?: string | null;
  academicTerm?: string | null;
  isBlueprint?: boolean;
};

export function useCoursesQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.courses(tenantId) : ['courses', 'inactive'],
    queryFn: () => apiFetch<Course[]>(`/tenants/${tenantId}/courses`),
    enabled: Boolean(tenantId),
  });
}

export function useCourseAnalyticsQuery(
  tenantId: string | null,
  courseId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.courseAnalytics(tenantId, courseId)
        : ['course-analytics', 'inactive'],
    queryFn: () =>
      apiFetch<CourseAnalyticsSummary>(
        `/tenants/${tenantId}/courses/${courseId}/analytics/summary`,
      ),
    enabled: Boolean(tenantId && courseId) && enabled,
  });
}

export function useCatalogQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.catalogCourses(tenantId) : ['catalog', 'inactive'],
    queryFn: () => apiFetch<CatalogCourse[]>(`/tenants/${tenantId}/catalog/courses`),
    enabled: Boolean(tenantId),
  });
}

export function useCreateCourse(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCourseInput) =>
      apiFetch<Course>(`/tenants/${tenantId}/courses`, { method: 'POST', body: input }),
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses(tenantId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.catalogCourses(tenantId) });
      }
    },
  });
}

export function useCourseQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey: tenantId && courseId ? queryKeys.course(tenantId, courseId) : ['course', 'inactive'],
    queryFn: () => apiFetch<Course>(`/tenants/${tenantId}/courses/${courseId}`),
    enabled: Boolean(tenantId && courseId),
  });
}

export type CatalogSettingsInput = {
  catalogVisibility: CatalogVisibility;
  enrollmentCode: string | null;
  catalogCategory: string | null;
  academicTerm: string | null;
  maxEnrollments: number | null;
  waitlistEnabled: boolean;
  enrollmentApprovalRequired: boolean;
};

export function useUpdateCourseCatalogSettingsMutation(
  tenantId: string | null,
  courseId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CatalogSettingsInput) =>
      apiFetch<CourseCatalogSettings>(`/tenants/${tenantId}/courses/${courseId}/catalog-settings`, {
        method: 'PUT',
        body: input,
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.course(tenantId, courseId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.courses(tenantId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.catalogCourses(tenantId) });
      }
    },
  });
}

export function useDeleteCourseMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      apiFetch<void>(`/tenants/${tenantId}/courses/${courseId}`, {
        method: 'DELETE',
        responseType: 'void',
      }),
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses(tenantId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.catalogCourses(tenantId) });
      }
    },
  });
}
