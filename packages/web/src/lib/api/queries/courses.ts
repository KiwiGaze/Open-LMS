'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { CatalogCourse, Course } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';

export function useCoursesQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.courses(tenantId) : ['courses', 'inactive'],
    queryFn: () => apiFetch<Course[]>(`/tenants/${tenantId}/courses`),
    enabled: Boolean(tenantId),
  });
}

export function useCatalogQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.catalogCourses(tenantId) : ['catalog', 'inactive'],
    queryFn: () => apiFetch<CatalogCourse[]>(`/tenants/${tenantId}/catalog/courses`),
    enabled: Boolean(tenantId),
  });
}

export function useCourseQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey: tenantId && courseId ? queryKeys.course(tenantId, courseId) : ['course', 'inactive'],
    queryFn: () => apiFetch<Course>(`/tenants/${tenantId}/courses/${courseId}`),
    enabled: Boolean(tenantId && courseId),
  });
}
