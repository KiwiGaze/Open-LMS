'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  CourseGroup,
  CourseGroupMember,
  CourseGroupMemberRole,
  CourseGroupSet,
  CourseGroupSetStatus,
  CourseGroupStatus,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CourseGroupSetInput = {
  name: string;
  selfSignupEnabled: boolean;
  status: CourseGroupSetStatus;
  position: number;
};

export type CourseGroupInput = {
  groupSetId: string;
  name: string;
  description: string | null;
  status: CourseGroupStatus;
  position: number;
};

export function useCourseGroupSetsQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.courseGroupSets(tenantId, courseId)
        : ['group-sets', 'inactive'],
    queryFn: () =>
      apiFetch<CourseGroupSet[]>(`/tenants/${tenantId}/courses/${courseId}/group-sets`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useCourseGroupsQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId ? queryKeys.courseGroups(tenantId, courseId) : ['groups', 'inactive'],
    queryFn: () => apiFetch<CourseGroup[]>(`/tenants/${tenantId}/courses/${courseId}/groups`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useCourseGroupMembersQuery(
  tenantId: string | null,
  courseId: string | null,
  groupId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && groupId
        ? queryKeys.courseGroupMembers(tenantId, courseId, groupId)
        : ['group-members', 'inactive'],
    queryFn: () =>
      apiFetch<CourseGroupMember[]>(
        `/tenants/${tenantId}/courses/${courseId}/groups/${groupId}/members`,
      ),
    enabled: Boolean(tenantId && courseId && groupId),
  });
}

export function useCreateCourseGroupSetMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseGroupSetInput) =>
      apiFetch<CourseGroupSet>(`/tenants/${tenantId}/courses/${courseId}/group-sets`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseGroupSets(tenantId, courseId),
        });
      }
    },
  });
}

export function useCreateCourseGroupMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseGroupInput) =>
      apiFetch<CourseGroup>(`/tenants/${tenantId}/courses/${courseId}/groups`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseGroups(tenantId, courseId),
        });
      }
    },
  });
}

export function useAddCourseGroupMemberMutation(
  tenantId: string | null,
  courseId: string | null,
  groupId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: CourseGroupMemberRole }) =>
      apiFetch<CourseGroupMember>(
        `/tenants/${tenantId}/courses/${courseId}/groups/${groupId}/members`,
        { method: 'POST', body: { userId, role } },
      ),
    onSuccess: () => {
      if (tenantId && courseId && groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseGroupMembers(tenantId, courseId, groupId),
        });
      }
    },
  });
}
