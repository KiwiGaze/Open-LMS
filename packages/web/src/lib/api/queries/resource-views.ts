'use client';

import { apiFetch } from '@/lib/api/client.ts';
import type { CourseResourceViewEvent } from '@openlms/contracts';
import { useMutation } from '@tanstack/react-query';

export function useRecordResourceViewMutation(tenantId: string | null, courseId: string | null) {
  return useMutation({
    mutationFn: (resourceId: string) => {
      if (!tenantId || !courseId) {
        return Promise.reject(
          new Error('No active tenant or course — cannot record resource view.'),
        );
      }
      return apiFetch<CourseResourceViewEvent>(
        `/tenants/${tenantId}/courses/${courseId}/resources/${encodeURIComponent(resourceId)}/views`,
        { method: 'POST' },
      );
    },
  });
}
