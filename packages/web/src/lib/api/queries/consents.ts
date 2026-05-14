'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { Consent, ConsentActionType, ConsentScope } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type RecordConsentInput = {
  actionType: ConsentActionType;
  scope: ConsentScope;
  scopeId: string;
  state: 'granted' | 'revoked';
  expiresAt?: string | null;
  evidence?: string | null;
};

export function useMyConsentsQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.myConsents(tenantId) : ['my-consents', 'inactive'],
    queryFn: () => apiFetch<Consent[]>(`/tenants/${tenantId}/me/consents`),
    enabled: Boolean(tenantId),
  });
}

export function useRecordMyConsentMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordConsentInput) => {
      if (!tenantId) {
        return Promise.reject(new Error('No active tenant — cannot record consent.'));
      }
      return apiFetch<Consent>(`/tenants/${tenantId}/me/consents`, {
        method: 'POST',
        body: input,
      });
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.myConsents(tenantId) });
      }
    },
  });
}

// Picks the most recent consent record for a given (actionType, scope, scopeId)
// triple. The schema types `updatedAt` as `Date`, but the JSON response carries
// an ISO 8601 string; coerce both cases to a numeric timestamp before comparing
// (locale-formatted `Date.toString()` output does not sort chronologically).
// Returns `null` when no record matches.
const toTimestamp = (value: Date | string): number =>
  value instanceof Date ? value.getTime() : Date.parse(value);

export function pickCurrentConsent(
  consents: Consent[] | undefined,
  actionType: ConsentActionType,
  scope: ConsentScope,
  scopeId: string,
): Consent | null {
  if (!consents) return null;
  const matches = consents.filter(
    (c) => c.actionType === actionType && c.scope === scope && c.scopeId === scopeId,
  );
  if (matches.length === 0) return null;
  return (
    matches.slice().sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt))[0] ?? null
  );
}
