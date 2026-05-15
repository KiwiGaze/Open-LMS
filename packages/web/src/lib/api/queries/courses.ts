'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { ApiHttpError } from '@/lib/api/errors.ts';
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
  CourseMembership,
  CourseSyllabus,
  CourseSyllabusVisibility,
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

function downloadJsonBlob(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useExportCourseBackupMutation(tenantId: string | null, courseId: string | null) {
  return useMutation({
    mutationFn: async () => {
      if (!tenantId || !courseId) {
        throw new Error('No active course — cannot export backup.');
      }
      const backup = await apiFetch<CourseBackup>(
        `/tenants/${tenantId}/courses/${courseId}/backup`,
      );
      downloadJsonBlob(`course-backup-${courseId}.json`, backup);
      return backup;
    },
  });
}

export function useExportCommonCartridgeMutation(tenantId: string | null, courseId: string | null) {
  return useMutation({
    mutationFn: async () => {
      if (!tenantId || !courseId) {
        throw new Error('No active course — cannot export cartridge.');
      }
      const cartridge = await apiFetch<unknown>(
        `/tenants/${tenantId}/courses/${courseId}/common-cartridge`,
      );
      downloadJsonBlob(`course-cartridge-${courseId}.json`, cartridge);
      return cartridge;
    },
  });
}

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

export function useSelfEnrollMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      enrollmentCode,
    }: {
      courseId: string;
      enrollmentCode: string;
    }) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot enroll.'));
      }
      return apiFetch<CourseMembership>(`/tenants/${tenantId}/courses/${courseId}/self-enroll`, {
        method: 'POST',
        body: { enrollmentCode },
      });
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses(tenantId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.catalogCourses(tenantId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.myCourseMemberships });
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

export function useCourseSyllabusQuery(tenantId: string | null, courseId: string | null) {
  return useQuery<CourseSyllabus | null>({
    queryKey:
      tenantId && courseId
        ? queryKeys.courseSyllabus(tenantId, courseId)
        : ['course-syllabus', 'inactive'],
    queryFn: async () => {
      try {
        return await apiFetch<CourseSyllabus>(`/tenants/${tenantId}/courses/${courseId}/syllabus`);
      } catch (e) {
        if (e instanceof ApiHttpError && e.status === 404) return null;
        throw e;
      }
    },
    enabled: Boolean(tenantId && courseId),
  });
}

export type UpsertCourseSyllabusInput = {
  body: string;
  visibility: CourseSyllabusVisibility;
};

export function useUpsertCourseSyllabusMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertCourseSyllabusInput) => {
      if (!tenantId || !courseId) {
        return Promise.reject(new Error('No active tenant or course — cannot save syllabus.'));
      }
      return apiFetch<CourseSyllabus>(`/tenants/${tenantId}/courses/${courseId}/syllabus`, {
        method: 'PUT',
        body: input,
      });
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.courseSyllabus(tenantId, courseId) });
      }
    },
  });
}

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
