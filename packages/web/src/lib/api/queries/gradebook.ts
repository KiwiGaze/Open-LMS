'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  CourseMembership,
  Grade,
  GradeAppeal,
  GradeStatus,
  GradebookEntry,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useGradebookEntriesQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId ? queryKeys.gradebook(tenantId, courseId) : ['gradebook', 'inactive'],
    queryFn: () => apiFetch<GradebookEntry[]>(`/tenants/${tenantId}/courses/${courseId}/gradebook`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useCourseMembershipsQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.coursePeople(tenantId, courseId)
        : ['memberships', 'inactive'],
    queryFn: () =>
      apiFetch<CourseMembership[]>(`/tenants/${tenantId}/courses/${courseId}/memberships`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useUpsertSubmissionGrade(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      assignmentId: string;
      submissionId: string;
      score: number;
      maxScore: number;
      status: GradeStatus;
    }) =>
      apiFetch<Grade>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${input.assignmentId}/submissions/${input.submissionId}/grade`,
        {
          method: 'PUT',
          body: { score: input.score, maxScore: input.maxScore, status: input.status },
        },
      ),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.gradebook(tenantId, courseId),
        });
      }
    },
  });
}

export function useImportAssignmentGradesCsv(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { assignmentId: string; csv: string }) =>
      apiFetch<{ savedCount: number; failedCount: number }>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${input.assignmentId}/grades/import-csv`,
        {
          method: 'POST',
          body: new Blob([input.csv], { type: 'text/csv' }),
        },
      ),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.gradebook(tenantId, courseId),
        });
      }
    },
  });
}

export function useCreateGradeAppealMutation(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
  submissionId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => {
      if (!tenantId || !courseId || !assignmentId || !submissionId) {
        return Promise.reject(new Error('No active submission — cannot file appeal.'));
      }
      return apiFetch<GradeAppeal>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions/${encodeURIComponent(submissionId)}/grade/appeals`,
        { method: 'POST', body: { reason } },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.gradebook(tenantId, courseId),
        });
      }
    },
  });
}
