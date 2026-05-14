'use client';

import { apiFetch } from '@/lib/api/client.ts';
import type { Rubric, RubricCriterion } from '@openlms/contracts';
import { useMutation } from '@tanstack/react-query';

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
  return useMutation({
    mutationFn: (input: RubricInput) => {
      const tenant = requireTenantId(tenantId);
      return apiFetch<Rubric>(`/tenants/${tenant}/rubrics`, {
        method: 'POST',
        body: input,
      });
    },
  });
}

export function useUpdateRubricMutation(tenantId: string | null) {
  return useMutation({
    mutationFn: ({ rubricId, input }: { rubricId: string; input: RubricInput }) => {
      const tenant = requireTenantId(tenantId);
      return apiFetch<Rubric>(`/tenants/${tenant}/rubrics/${rubricId}`, {
        method: 'PUT',
        body: input,
      });
    },
  });
}

export function useDeleteRubricMutation(tenantId: string | null) {
  return useMutation({
    mutationFn: (rubricId: string) => {
      const tenant = requireTenantId(tenantId);
      return apiFetch<void>(`/tenants/${tenant}/rubrics/${rubricId}`, {
        method: 'DELETE',
        responseType: 'void',
      });
    },
  });
}
