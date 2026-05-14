'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  Assignment,
  AssignmentEffectiveSchedule,
  Rubric,
  Submission,
  SubmissionComment,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type AssignmentInput = {
  moduleId: string | null;
  unitId: string | null;
  position: number | null;
  title: string;
  instructions: string;
  status: 'draft' | 'published' | 'archived';
  dueAt: string | null;
  allowResubmission: boolean;
  activeRubricId: string | null;
  aiSettings: {
    precheckEnabled: boolean;
    feedbackDraftEnabled: boolean;
    scoreSuggestionEnabled: boolean;
  };
  extraCredit?: boolean;
  anonymousGradingEnabled?: boolean;
  groupSubmissionEnabled?: boolean;
  groupSetId?: string | null;
  allowedFileExtensions?: string[];
  maxFileSizeBytes?: number | null;
};

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

export function useCreateAssignment(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignmentInput) => {
      if (!tenantId || !courseId) {
        throw new Error('Missing tenant or course context.');
      }
      return apiFetch<Assignment>(`/tenants/${tenantId}/courses/${courseId}/assignments`, {
        method: 'POST',
        body: input,
      });
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseAssignments(tenantId, courseId),
        });
      }
    },
  });
}

export function useUpdateAssignment(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      input,
    }: {
      assignmentId: string;
      input: AssignmentInput;
    }) => {
      if (!tenantId || !courseId) {
        throw new Error('Missing tenant or course context.');
      }
      return apiFetch<Assignment>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}`,
        {
          method: 'PUT',
          body: input,
        },
      );
    },
    onSuccess: (_data, vars) => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseAssignments(tenantId, courseId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.assignment(tenantId, courseId, vars.assignmentId),
        });
        queryClient.invalidateQueries({
          queryKey: ['assignment-rubric', tenantId, courseId, vars.assignmentId],
        });
        queryClient.invalidateQueries({
          queryKey: ['assignment-schedule', tenantId, courseId, vars.assignmentId],
        });
      }
    },
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

export function useSubmissionCommentsQuery(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
  submissionId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && assignmentId && submissionId
        ? queryKeys.submissionComments(tenantId, courseId, assignmentId, submissionId)
        : ['submission-comments', 'inactive'],
    queryFn: () =>
      apiFetch<SubmissionComment[]>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/comments`,
      ),
    enabled: Boolean(tenantId && courseId && assignmentId && submissionId),
  });
}
