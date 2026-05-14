'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  AssignmentOverride,
  AssignmentOverrideStatus,
  AssignmentOverrideTargetType,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type AssignmentOverrideInput = {
  targetType: AssignmentOverrideTargetType;
  targetId: string;
  opensAt: string | null;
  dueAt: string | null;
  closesAt: string | null;
  status: AssignmentOverrideStatus;
};

export type AssignmentOverridePatch = {
  opensAt: string | null;
  dueAt: string | null;
  closesAt: string | null;
  status: AssignmentOverrideStatus;
};

export function useAssignmentOverridesQuery(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && assignmentId
        ? queryKeys.assignmentOverrides(tenantId, courseId, assignmentId)
        : ['overrides', 'inactive'],
    queryFn: () =>
      apiFetch<AssignmentOverride[]>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/overrides`,
      ),
    enabled: Boolean(tenantId && courseId && assignmentId),
  });
}

export function useCreateAssignmentOverrideMutation(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignmentOverrideInput) =>
      apiFetch<AssignmentOverride>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/overrides`,
        { method: 'POST', body: input },
      ),
    onSuccess: () => {
      if (tenantId && courseId && assignmentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assignmentOverrides(tenantId, courseId, assignmentId),
        });
      }
    },
  });
}

export function useUpdateAssignmentOverrideMutation(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      overrideId,
      patch,
    }: {
      overrideId: string;
      patch: AssignmentOverridePatch;
    }) =>
      apiFetch<AssignmentOverride>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/overrides/${overrideId}`,
        { method: 'PATCH', body: patch },
      ),
    onSuccess: () => {
      if (tenantId && courseId && assignmentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assignmentOverrides(tenantId, courseId, assignmentId),
        });
      }
    },
  });
}

export function useDeleteAssignmentOverrideMutation(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (overrideId: string) =>
      apiFetch<void>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/overrides/${overrideId}`,
        { method: 'DELETE', responseType: 'void' },
      ),
    onSuccess: () => {
      if (tenantId && courseId && assignmentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.assignmentOverrides(tenantId, courseId, assignmentId),
        });
      }
    },
  });
}
