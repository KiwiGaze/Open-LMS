'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { QuestionBank, QuestionBankStatus } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CreateQuestionBankInput = {
  title: string;
  description: string | null;
  status: QuestionBankStatus;
};

export type UpdateQuestionBankInput = CreateQuestionBankInput;

export function useQuestionBanksQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.questionBanks(tenantId, courseId)
        : ['question-banks', 'inactive'],
    queryFn: () =>
      apiFetch<QuestionBank[]>(`/tenants/${tenantId}/courses/${courseId}/question-banks`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useCreateQuestionBankMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuestionBankInput) => {
      if (!tenantId || !courseId) {
        return Promise.reject(new Error('No active course — cannot create bank.'));
      }
      return apiFetch<QuestionBank>(`/tenants/${tenantId}/courses/${courseId}/question-banks`, {
        method: 'POST',
        body: input,
      });
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.questionBanks(tenantId, courseId) });
      }
    },
  });
}

export function useUpdateQuestionBankMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bankId, input }: { bankId: string; input: UpdateQuestionBankInput }) => {
      if (!tenantId || !courseId) {
        return Promise.reject(new Error('No active course — cannot update bank.'));
      }
      return apiFetch<QuestionBank>(
        `/tenants/${tenantId}/courses/${courseId}/question-banks/${encodeURIComponent(bankId)}`,
        { method: 'PUT', body: input },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.questionBanks(tenantId, courseId) });
      }
    },
  });
}

export function useDeleteQuestionBankMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bankId: string) => {
      if (!tenantId || !courseId) {
        return Promise.reject(new Error('No active course — cannot delete bank.'));
      }
      return apiFetch<void>(
        `/tenants/${tenantId}/courses/${courseId}/question-banks/${encodeURIComponent(bankId)}`,
        { method: 'DELETE', responseType: 'void' },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.questionBanks(tenantId, courseId) });
      }
    },
  });
}
