'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { TenantMembership, TenantRole } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useTenantMembersQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.tenantMembers(tenantId) : ['tenants', 'members', 'inactive'],
    queryFn: () => apiFetch<TenantMembership[]>(`/tenants/${tenantId}/members`),
    enabled: Boolean(tenantId),
  });
}

export function useUpdateTenantMembershipMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, role }: { membershipId: string; role: TenantRole }) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot update membership.'));
      }
      return apiFetch<TenantMembership>(
        `/tenants/${tenantId}/memberships/${encodeURIComponent(membershipId)}`,
        { method: 'PATCH', body: { role } },
      );
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tenantMembers(tenantId) });
      }
    },
  });
}
