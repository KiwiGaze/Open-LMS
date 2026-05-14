'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { MyCredentialAward } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';

export function useMyCredentialAwardsQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId
      ? queryKeys.myCredentialAwards(tenantId)
      : ['my-credential-awards', 'inactive'],
    queryFn: () => apiFetch<MyCredentialAward[]>(`/tenants/${tenantId}/me/credentials`),
    enabled: Boolean(tenantId),
  });
}
