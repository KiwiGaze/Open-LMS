'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { UserPushToken } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useMyPushTokensQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.myPushTokens(tenantId) : ['my-push-tokens', 'inactive'],
    queryFn: () => apiFetch<UserPushToken[]>(`/tenants/${tenantId}/push-tokens`),
    enabled: Boolean(tenantId),
  });
}

export function useRevokeMyPushTokenMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tokenId: string) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot revoke push token.'));
      }
      return apiFetch<void>(`/tenants/${tenantId}/push-tokens/${encodeURIComponent(tokenId)}`, {
        method: 'DELETE',
        responseType: 'void',
      });
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.myPushTokens(tenantId) });
      }
    },
  });
}
