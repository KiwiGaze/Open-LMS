'use client';

import { apiFetch } from '@/lib/api/client.ts';
import type { Rubric, RubricCriterion } from '@openlms/contracts';
import { useMutation } from '@tanstack/react-query';

export type RubricInput = {
  title: string;
  sourceTemplateId: string | null;
  criteria: RubricCriterion[];
};

export function useCreateRubricMutation(tenantId: string | null) {
  return useMutation({
    mutationFn: (input: RubricInput) =>
      apiFetch<Rubric>(`/tenants/${tenantId}/rubrics`, {
        method: 'POST',
        body: input,
      }),
  });
}

export function useUpdateRubricMutation(tenantId: string | null) {
  return useMutation({
    mutationFn: ({ rubricId, input }: { rubricId: string; input: RubricInput }) =>
      apiFetch<Rubric>(`/tenants/${tenantId}/rubrics/${rubricId}`, {
        method: 'PUT',
        body: input,
      }),
  });
}

export function useDeleteRubricMutation(tenantId: string | null) {
  return useMutation({
    mutationFn: (rubricId: string) =>
      apiFetch<void>(`/tenants/${tenantId}/rubrics/${rubricId}`, {
        method: 'DELETE',
        responseType: 'void',
      }),
  });
}
