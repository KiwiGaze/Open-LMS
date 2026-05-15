'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { CourseMembership, CourseRole, RosterImportSummary } from '@openlms/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateCourseMembershipMutation(
  tenantId: string | null,
  courseId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: CourseRole }) =>
      apiFetch<CourseMembership>(`/tenants/${tenantId}/courses/${courseId}/memberships`, {
        method: 'POST',
        body: { userId, role, status: 'active' },
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.coursePeople(tenantId, courseId),
        });
      }
    },
  });
}

export function useUpdateCourseMembershipMutation(
  tenantId: string | null,
  courseId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      membershipId,
      role,
    }: {
      membershipId: string;
      role: CourseRole;
    }) =>
      apiFetch<CourseMembership>(
        `/tenants/${tenantId}/courses/${courseId}/memberships/${membershipId}`,
        { method: 'PUT', body: { role } },
      ),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.coursePeople(tenantId, courseId),
        });
      }
    },
  });
}

export function useApproveCourseMembershipMutation(
  tenantId: string | null,
  courseId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) =>
      apiFetch<CourseMembership>(
        `/tenants/${tenantId}/courses/${courseId}/memberships/${encodeURIComponent(membershipId)}`,
        { method: 'PUT', body: { status: 'active' } },
      ),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.coursePeople(tenantId, courseId),
        });
      }
    },
  });
}

export function useDeleteCourseMembershipMutation(
  tenantId: string | null,
  courseId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) =>
      apiFetch<void>(`/tenants/${tenantId}/courses/${courseId}/memberships/${membershipId}`, {
        method: 'DELETE',
        responseType: 'void',
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.coursePeople(tenantId, courseId),
        });
      }
    },
  });
}

export function useExportCourseRosterCsvMutation(tenantId: string | null, courseId: string | null) {
  return useMutation({
    mutationFn: async (filename: string) => {
      if (!tenantId || !courseId) {
        throw new Error('No active course — cannot export roster.');
      }
      const blob = await apiFetch<Blob>(
        `/tenants/${tenantId}/courses/${courseId}/memberships/export.csv`,
        { responseType: 'blob' },
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    },
  });
}

export function useImportCourseRosterCsvMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (csv: string) =>
      apiFetch<RosterImportSummary>(
        `/tenants/${tenantId}/courses/${courseId}/memberships/import-csv`,
        {
          method: 'POST',
          // Wrap as Blob so apiFetch passes the bytes through without
          // forcing application/json content-type.
          body: new Blob([csv], { type: 'text/csv' }),
          headers: { 'content-type': 'text/csv' },
        },
      ),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.coursePeople(tenantId, courseId),
        });
      }
    },
  });
}
