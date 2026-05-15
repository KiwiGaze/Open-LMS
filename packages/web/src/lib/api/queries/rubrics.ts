'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { Rubric, RubricCriterion } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useRubricsQuery(tenantId: string | null) {
  return useQuery({
    queryKey: tenantId ? queryKeys.rubrics(tenantId) : ['rubrics', 'inactive'],
    queryFn: () => apiFetch<Rubric[]>(`/tenants/${tenantId}/rubrics`),
    enabled: Boolean(tenantId),
  });
}

export function useRubricQuery(tenantId: string | null, rubricId: string | null) {
  return useQuery({
    queryKey: tenantId && rubricId ? queryKeys.rubric(tenantId, rubricId) : ['rubric', 'inactive'],
    queryFn: () =>
      apiFetch<Rubric>(`/tenants/${tenantId}/rubrics/${encodeURIComponent(rubricId ?? '')}`),
    enabled: Boolean(tenantId && rubricId),
  });
}

export type RubricInput = {
  title: string;
  sourceTemplateId: string | null;
  criteria: RubricCriterion[];
};

function requireTenantId(tenantId: string | null): string {
  if (!tenantId) throw new Error('Active tenant is required.');
  return tenantId;
}

export function useCreateRubricMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RubricInput) => {
      const tenant = requireTenantId(tenantId);
      return apiFetch<Rubric>(`/tenants/${tenant}/rubrics`, {
        method: 'POST',
        body: input,
      });
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.rubrics(tenantId) });
      }
    },
  });
}

export function useUpdateRubricMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rubricId, input }: { rubricId: string; input: RubricInput }) => {
      const tenant = requireTenantId(tenantId);
      return apiFetch<Rubric>(`/tenants/${tenant}/rubrics/${rubricId}`, {
        method: 'PUT',
        body: input,
      });
    },
    onSuccess: (_data, variables) => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.rubrics(tenantId) });
        queryClient.invalidateQueries({
          queryKey: queryKeys.rubric(tenantId, variables.rubricId),
        });
      }
    },
  });
}

export function useDeleteRubricMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rubricId: string) => {
      const tenant = requireTenantId(tenantId);
      return apiFetch<void>(`/tenants/${tenant}/rubrics/${rubricId}`, {
        method: 'DELETE',
        responseType: 'void',
      });
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.rubrics(tenantId) });
      }
    },
  });
}
