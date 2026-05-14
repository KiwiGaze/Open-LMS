'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  Assignment,
  AssignmentEffectiveSchedule,
  Rubric,
  Submission,
} from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';

export function useAssignmentsQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.courseAssignments(tenantId, courseId)
        : ['assignments', 'inactive'],
    queryFn: () => apiFetch<Assignment[]>(`/tenants/${tenantId}/courses/${courseId}/assignments`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useAssignmentQuery(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && assignmentId
        ? queryKeys.assignment(tenantId, courseId, assignmentId)
        : ['assignment', 'inactive'],
    queryFn: () =>
      apiFetch<Assignment>(`/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}`),
    enabled: Boolean(tenantId && courseId && assignmentId),
  });
}

export function useAssignmentRubricQuery(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
) {
  return useQuery({
    queryKey: ['assignment-rubric', tenantId ?? '', courseId ?? '', assignmentId ?? ''],
    queryFn: async () => {
      const res = await apiFetch<{ rubric: Rubric | null }>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/rubric`,
      );
      return res.rubric;
    },
    enabled: Boolean(tenantId && courseId && assignmentId),
  });
}

export function useAssignmentScheduleQuery(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
) {
  return useQuery({
    queryKey: ['assignment-schedule', tenantId ?? '', courseId ?? '', assignmentId ?? ''],
    queryFn: () =>
      apiFetch<AssignmentEffectiveSchedule>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/effective-schedule`,
      ),
    enabled: Boolean(tenantId && courseId && assignmentId),
  });
}

export function useAssignmentSubmissionsQuery(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && assignmentId
        ? queryKeys.assignmentSubmissions(tenantId, courseId, assignmentId)
        : ['submissions', 'inactive'],
    queryFn: () =>
      apiFetch<Submission[]>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions`,
      ),
    enabled: Boolean(tenantId && courseId && assignmentId),
  });
}
