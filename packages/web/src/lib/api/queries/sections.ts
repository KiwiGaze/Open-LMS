'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  CourseSection,
  CourseSectionInstructor,
  CourseSectionMember,
  CourseSectionStatus,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CourseSectionInput = {
  name: string;
  status: CourseSectionStatus;
  position: number;
};

export function useCourseSectionsQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.courseSections(tenantId, courseId)
        : ['sections', 'inactive'],
    queryFn: () => apiFetch<CourseSection[]>(`/tenants/${tenantId}/courses/${courseId}/sections`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useCreateCourseSectionMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseSectionInput) =>
      apiFetch<CourseSection>(`/tenants/${tenantId}/courses/${courseId}/sections`, {
        method: 'POST',
        body: {
          ...input,
          meetingDays: [],
          meetingStartTime: null,
          meetingEndTime: null,
          location: null,
        },
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseSections(tenantId, courseId),
        });
      }
    },
  });
}

export function useDeleteCourseSectionMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sectionId: string) =>
      apiFetch<void>(`/tenants/${tenantId}/courses/${courseId}/sections/${sectionId}`, {
        method: 'DELETE',
        responseType: 'void',
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseSections(tenantId, courseId),
        });
      }
    },
  });
}

export function useSectionMembersQuery(
  tenantId: string | null,
  courseId: string | null,
  sectionId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && sectionId
        ? queryKeys.sectionMembers(tenantId, courseId, sectionId)
        : ['section-members', 'inactive'],
    queryFn: () =>
      apiFetch<CourseSectionMember[]>(
        `/tenants/${tenantId}/courses/${courseId}/sections/${sectionId}/members`,
      ),
    enabled: Boolean(tenantId && courseId && sectionId),
  });
}

export function useAssignSectionMemberMutation(
  tenantId: string | null,
  courseId: string | null,
  sectionId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) =>
      apiFetch<CourseSectionMember>(
        `/tenants/${tenantId}/courses/${courseId}/sections/${sectionId}/members`,
        { method: 'POST', body: { studentId } },
      ),
    onSuccess: () => {
      if (tenantId && courseId && sectionId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.sectionMembers(tenantId, courseId, sectionId),
        });
      }
    },
  });
}

export function useRemoveSectionMemberMutation(
  tenantId: string | null,
  courseId: string | null,
  sectionId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) =>
      apiFetch<void>(
        `/tenants/${tenantId}/courses/${courseId}/sections/${sectionId}/members/${studentId}`,
        { method: 'DELETE', responseType: 'void' },
      ),
    onSuccess: () => {
      if (tenantId && courseId && sectionId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.sectionMembers(tenantId, courseId, sectionId),
        });
      }
    },
  });
}

export function useSectionInstructorsQuery(
  tenantId: string | null,
  courseId: string | null,
  sectionId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && sectionId
        ? queryKeys.sectionInstructors(tenantId, courseId, sectionId)
        : ['section-instructors', 'inactive'],
    queryFn: () =>
      apiFetch<CourseSectionInstructor[]>(
        `/tenants/${tenantId}/courses/${courseId}/sections/${encodeURIComponent(sectionId ?? '')}/instructors`,
      ),
    enabled: Boolean(tenantId && courseId && sectionId),
  });
}

export function useAssignSectionInstructorMutation(
  tenantId: string | null,
  courseId: string | null,
  sectionId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instructorId: string) => {
      if (!tenantId || !courseId || !sectionId) {
        return Promise.reject(new Error('No active section — cannot assign instructor.'));
      }
      return apiFetch<CourseSectionInstructor>(
        `/tenants/${tenantId}/courses/${courseId}/sections/${encodeURIComponent(sectionId)}/instructors`,
        { method: 'POST', body: { instructorId } },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId && sectionId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.sectionInstructors(tenantId, courseId, sectionId),
        });
      }
    },
  });
}

export function useRemoveSectionInstructorMutation(
  tenantId: string | null,
  courseId: string | null,
  sectionId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instructorId: string) => {
      if (!tenantId || !courseId || !sectionId) {
        return Promise.reject(new Error('No active section — cannot remove instructor.'));
      }
      return apiFetch<void>(
        `/tenants/${tenantId}/courses/${courseId}/sections/${encodeURIComponent(sectionId)}/instructors/${encodeURIComponent(instructorId)}`,
        { method: 'DELETE', responseType: 'void' },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId && sectionId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.sectionInstructors(tenantId, courseId, sectionId),
        });
      }
    },
  });
}
