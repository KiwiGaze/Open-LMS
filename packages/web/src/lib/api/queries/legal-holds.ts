'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { UserLegalHold } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type LegalHoldStatusFilter = 'active' | 'released' | 'all';

export type CreateLegalHoldInput = {
  userId: string;
  reason: string;
};

export function useUserLegalHoldsQuery(tenantId: string | null, status: LegalHoldStatusFilter) {
  return useQuery({
    queryKey: tenantId ? queryKeys.userLegalHolds(tenantId, status) : ['legal-holds', 'inactive'],
    queryFn: () =>
      apiFetch<UserLegalHold[]>(`/tenants/${tenantId}/legal-holds`, {
        query: { status },
      }),
    enabled: Boolean(tenantId),
  });
}

const invalidateAllStatuses = (
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: string,
) => {
  for (const status of ['active', 'released', 'all'] as const) {
    queryClient.invalidateQueries({ queryKey: queryKeys.userLegalHolds(tenantId, status) });
  }
};

export function useCreateLegalHoldMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLegalHoldInput) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot create legal hold.'));
      }
      return apiFetch<UserLegalHold>(`/tenants/${tenantId}/legal-holds`, {
        method: 'POST',
        body: input,
      });
    },
    onSuccess: () => {
      if (tenantId) invalidateAllStatuses(queryClient, tenantId);
    },
  });
}

export function useReleaseLegalHoldMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (legalHoldId: string) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot release legal hold.'));
      }
      return apiFetch<UserLegalHold>(
        `/tenants/${tenantId}/legal-holds/${encodeURIComponent(legalHoldId)}/release`,
        { method: 'POST' },
      );
    },
    onSuccess: () => {
      if (tenantId) invalidateAllStatuses(queryClient, tenantId);
    },
  });
}
