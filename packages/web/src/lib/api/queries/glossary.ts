'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { GlossaryEntry, GlossaryEntryStatus } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type GlossaryEntryInput = {
  term: string;
  definition: string;
  status: GlossaryEntryStatus;
};

export function useGlossaryEntriesQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.glossaryEntries(tenantId, courseId)
        : ['glossary', 'inactive'],
    queryFn: () => apiFetch<GlossaryEntry[]>(`/tenants/${tenantId}/courses/${courseId}/glossary`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useCreateGlossaryEntryMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GlossaryEntryInput) =>
      apiFetch<GlossaryEntry>(`/tenants/${tenantId}/courses/${courseId}/glossary`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.glossaryEntries(tenantId, courseId) });
      }
    },
  });
}

export function useUpdateGlossaryEntryMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, input }: { entryId: string; input: GlossaryEntryInput }) =>
      apiFetch<GlossaryEntry>(`/tenants/${tenantId}/courses/${courseId}/glossary/${entryId}`, {
        method: 'PUT',
        body: input,
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.glossaryEntries(tenantId, courseId) });
      }
    },
  });
}

export function useDeleteGlossaryEntryMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      apiFetch<void>(`/tenants/${tenantId}/courses/${courseId}/glossary/${entryId}`, {
        method: 'DELETE',
        responseType: 'void',
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.glossaryEntries(tenantId, courseId) });
      }
    },
  });
}
