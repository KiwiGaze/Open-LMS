'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  AiProviderType,
  ModelPreferences,
  ProviderCapabilities,
  ProviderConfigSummary,
  ProviderQuota,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type UpsertProviderConfigInput = {
  providerType: AiProviderType;
  baseUrl: string | null;
  apiKey?: string;
  modelPreferences: ModelPreferences;
  capabilities: ProviderCapabilities;
  quota: ProviderQuota;
};

export function useProviderConfigQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.providerConfig(tenantId) : ['provider-config', 'inactive'],
    queryFn: async () => {
      try {
        return await apiFetch<ProviderConfigSummary>(`/tenants/${tenantId}/provider-config`);
      } catch (error) {
        if (error instanceof ApiHttpError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: Boolean(tenantId),
  });
}

export function useUpsertProviderConfigMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertProviderConfigInput) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot save provider config.'));
      }
      return apiFetch<ProviderConfigSummary>(`/tenants/${tenantId}/provider-config`, {
        method: 'PUT',
        body: input,
      });
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.providerConfig(tenantId) });
      }
    },
  });
}

export function useDeleteProviderConfigMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot delete provider config.'));
      }
      return apiFetch<void>(`/tenants/${tenantId}/provider-config`, {
        method: 'DELETE',
        responseType: 'void',
      });
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.providerConfig(tenantId) });
      }
    },
  });
}
