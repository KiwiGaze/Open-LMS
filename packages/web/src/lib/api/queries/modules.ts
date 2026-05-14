'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { CourseModule, CourseResource, CourseUnit } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';

export function useCourseModulesQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId ? queryKeys.courseModules(tenantId, courseId) : ['modules', 'inactive'],
    queryFn: () => apiFetch<CourseModule[]>(`/tenants/${tenantId}/courses/${courseId}/modules`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useCourseUnitsQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId ? queryKeys.courseUnits(tenantId, courseId) : ['units', 'inactive'],
    queryFn: () => apiFetch<CourseUnit[]>(`/tenants/${tenantId}/courses/${courseId}/units`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useCourseResourcesQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.courseResources(tenantId, courseId)
        : ['resources', 'inactive'],
    queryFn: () => apiFetch<CourseResource[]>(`/tenants/${tenantId}/courses/${courseId}/resources`),
    enabled: Boolean(tenantId && courseId),
  });
}
