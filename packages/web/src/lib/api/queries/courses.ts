'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  CatalogCourse,
  CatalogVisibility,
  CommonCartridgeImportRequest,
  CommonCartridgeImportResult,
  Course,
  CourseAnalyticsSummary,
  CourseBackup,
  CourseCatalogSettings,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CreateCourseInput = {
  code: string;
  title: string;
  status: 'draft' | 'active' | 'archived';
  startsAt: string | null;
  endsAt: string | null;
  catalogCategory?: string | null;
  academicTerm?: string | null;
  isBlueprint?: boolean;
};

export function useCoursesQuery(tenantId: string | null, enabled = true) {
  return useQuery({
    queryKey: tenantId ? queryKeys.courses(tenantId) : ['courses', 'inactive'],
    queryFn: () => apiFetch<Course[]>(`/tenants/${tenantId}/courses`),
    enabled: Boolean(tenantId) && enabled,
  });
}

export function useCourseAnalyticsQuery(
  tenantId: string | null,
  courseId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.courseAnalytics(tenantId, courseId)
        : ['course-analytics', 'inactive'],
    queryFn: () =>
      apiFetch<CourseAnalyticsSummary>(
        `/tenants/${tenantId}/courses/${courseId}/analytics/summary`,
      ),
    enabled: Boolean(tenantId && courseId) && enabled,
  });
}

export type CopyCourseResult = {
  learningObjectivesCopied: number;
  modulesCopied: number;
  unitsCopied: number;
  pagesCopied: number;
  resourcesCopied: number;
};

export function useCopyCourseMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sourceCourseId,
      targetCourseId,
    }: {
      sourceCourseId: string;
      targetCourseId: string;
    }) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot copy course.'));
      }
      return apiFetch<CopyCourseResult>(`/tenants/${tenantId}/courses/${sourceCourseId}/copy`, {
        method: 'POST',
        body: { targetCourseId },
      });
    },
    onSuccess: (_data, variables) => {
      if (tenantId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.course(tenantId, variables.targetCourseId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.courses(tenantId) });
      }
    },
  });
}

export type RestoreCourseBackupResult = {
  learningObjectivesRestored: number;
  modulesRestored: number;
  unitsRestored: number;
  pagesRestored: number;
  resourcesRestored: number;
};

export function useRestoreCourseBackupMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (backup: CourseBackup) => {
      if (!tenantId || !courseId) {
        return Promise.reject(new Error('No active course — cannot restore backup.'));
      }
      return apiFetch<RestoreCourseBackupResult>(
        `/tenants/${tenantId}/courses/${courseId}/restore`,
        { method: 'POST', body: { backup } },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.course(tenantId, courseId) });
      }
    },
  });
}

export function useImportCommonCartridgeMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartridge: CommonCartridgeImportRequest) => {
      if (!tenantId || !courseId) {
        return Promise.reject(new Error('No active course — cannot import cartridge.'));
      }
      return apiFetch<CommonCartridgeImportResult>(
        `/tenants/${tenantId}/courses/${courseId}/common-cartridge/import`,
        { method: 'POST', body: cartridge },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.course(tenantId, courseId) });
      }
    },
  });
}

export function useCatalogQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.catalogCourses(tenantId) : ['catalog', 'inactive'],
    queryFn: () => apiFetch<CatalogCourse[]>(`/tenants/${tenantId}/catalog/courses`),
    enabled: Boolean(tenantId),
  });
}

export function useCreateCourse(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCourseInput) =>
      apiFetch<Course>(`/tenants/${tenantId}/courses`, { method: 'POST', body: input }),
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses(tenantId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.catalogCourses(tenantId) });
      }
    },
  });
}

export function useCourseQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey: tenantId && courseId ? queryKeys.course(tenantId, courseId) : ['course', 'inactive'],
    queryFn: () => apiFetch<Course>(`/tenants/${tenantId}/courses/${courseId}`),
    enabled: Boolean(tenantId && courseId),
  });
}

export type CatalogSettingsInput = {
  catalogVisibility: CatalogVisibility;
  enrollmentCode: string | null;
  catalogCategory: string | null;
  academicTerm: string | null;
  maxEnrollments: number | null;
  waitlistEnabled: boolean;
  enrollmentApprovalRequired: boolean;
};

export function useUpdateCourseCatalogSettingsMutation(
  tenantId: string | null,
  courseId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CatalogSettingsInput) =>
      apiFetch<CourseCatalogSettings>(`/tenants/${tenantId}/courses/${courseId}/catalog-settings`, {
        method: 'PUT',
        body: input,
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.course(tenantId, courseId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.courses(tenantId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.catalogCourses(tenantId) });
      }
    },
  });
}

export function useDeleteCourseMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      apiFetch<void>(`/tenants/${tenantId}/courses/${courseId}`, {
        method: 'DELETE',
        responseType: 'void',
      }),
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses(tenantId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.catalogCourses(tenantId) });
      }
    },
  });
}
