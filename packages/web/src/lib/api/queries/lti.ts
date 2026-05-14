'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { CourseExternalTool, Lti1p3OidcLoginInitiation } from '@openlms/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';

export function useExternalToolsQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.externalTools(tenantId, courseId)
        : ['external-tools', 'inactive'],
    queryFn: () =>
      apiFetch<CourseExternalTool[]>(`/tenants/${tenantId}/courses/${courseId}/external-tools`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useStartLtiLaunch(tenantId: string | null, courseId: string | null) {
  return useMutation({
    mutationFn: (toolId: string) =>
      apiFetch<Lti1p3OidcLoginInitiation>(
        `/tenants/${tenantId}/courses/${courseId}/external-tools/${toolId}/lti-1p3/launch`,
        { method: 'POST', body: {} },
      ),
  });
}
