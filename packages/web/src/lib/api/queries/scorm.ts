'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  ScormAttempt,
  ScormPackage,
  ScormPackageStatus,
  ScormRuntimeState,
  ScormVersion,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useScormPackagesQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.scormPackages(tenantId, courseId)
        : ['scorm-packages', 'inactive'],
    queryFn: () =>
      apiFetch<ScormPackage[]>(`/tenants/${tenantId}/courses/${courseId}/scorm-packages`),
    enabled: Boolean(tenantId && courseId),
  });
}

export type CreateScormPackageInput = {
  title: string;
  scormVersion: ScormVersion;
  launchUrl: string;
  manifest: Record<string, unknown>;
  status: ScormPackageStatus;
};

export function useCreateScormPackageMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateScormPackageInput) => {
      if (!tenantId || !courseId) {
        return Promise.reject(new Error('No active course — cannot register SCORM package.'));
      }
      return apiFetch<ScormPackage>(`/tenants/${tenantId}/courses/${courseId}/scorm-packages`, {
        method: 'POST',
        body: input,
      });
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.scormPackages(tenantId, courseId),
        });
      }
    },
  });
}

export function useInitializeScormRuntime(
  tenantId: string | null,
  courseId: string | null,
  scormPackageId: string | null,
) {
  return useMutation({
    mutationFn: () =>
      apiFetch<ScormRuntimeState>(
        `/tenants/${tenantId}/courses/${courseId}/scorm-packages/${scormPackageId}/runtime/initialize`,
        { method: 'POST', body: {} },
      ),
  });
}

export function useFinishScormAttempt(
  tenantId: string | null,
  courseId: string | null,
  scormPackageId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<ScormAttempt>(
        `/tenants/${tenantId}/courses/${courseId}/scorm-packages/${scormPackageId}/runtime/finish`,
        { method: 'POST', body: {} },
      ),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.scormPackages(tenantId, courseId),
        });
      }
    },
  });
}
