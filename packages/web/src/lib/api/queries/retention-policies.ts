'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { RetentionPolicy, RetentionPolicyTargetType } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useRetentionPoliciesQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.retentionPolicies(tenantId) : ['retention-policies', 'inactive'],
    queryFn: () => apiFetch<RetentionPolicy[]>(`/tenants/${tenantId}/retention-policies`),
    enabled: Boolean(tenantId),
  });
}

export function useUpsertRetentionPolicyMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      targetType,
      retainDays,
    }: { targetType: RetentionPolicyTargetType; retainDays: number }) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot save retention policy.'));
      }
      return apiFetch<RetentionPolicy>(
        `/tenants/${tenantId}/retention-policies/${encodeURIComponent(targetType)}`,
        {
          method: 'PUT',
          body: { retainDays },
        },
      );
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.retentionPolicies(tenantId) });
      }
    },
  });
}
