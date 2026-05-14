'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { TenantFeatureFlag } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type UpsertFeatureFlagInput = {
  enabled: boolean;
  description: string | null;
};

export function useTenantFeatureFlagsQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.tenantFeatureFlags(tenantId) : ['feature-flags', 'inactive'],
    queryFn: () => apiFetch<TenantFeatureFlag[]>(`/tenants/${tenantId}/feature-flags`),
    enabled: Boolean(tenantId),
  });
}

export function useUpsertFeatureFlagMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, ...input }: UpsertFeatureFlagInput & { key: string }) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot save feature flag.'));
      }
      return apiFetch<TenantFeatureFlag>(`/tenants/${tenantId}/feature-flags/${key}`, {
        method: 'PUT',
        body: input,
      });
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tenantFeatureFlags(tenantId) });
      }
    },
  });
}

export function useDeleteFeatureFlagMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot delete feature flag.'));
      }
      return apiFetch<void>(`/tenants/${tenantId}/feature-flags/${key}`, {
        method: 'DELETE',
        responseType: 'void',
      });
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tenantFeatureFlags(tenantId) });
      }
    },
  });
}
