'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { QuizOverride, QuizOverrideStatus, QuizOverrideTargetType } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type QuizOverrideInput = {
  targetType: QuizOverrideTargetType;
  targetId: string;
  opensAt: string | null;
  closesAt: string | null;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  status: QuizOverrideStatus;
};

export type QuizOverridePatch = {
  opensAt: string | null;
  closesAt: string | null;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  status: QuizOverrideStatus;
};

export function useQuizOverridesQuery(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && quizId
        ? queryKeys.quizOverrides(tenantId, courseId, quizId)
        : ['quiz-overrides', 'inactive'],
    queryFn: () =>
      apiFetch<QuizOverride[]>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${encodeURIComponent(quizId ?? '')}/overrides`,
      ),
    enabled: Boolean(tenantId && courseId && quizId),
  });
}

export function useCreateQuizOverrideMutation(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: QuizOverrideInput) => {
      if (!tenantId || !courseId || !quizId) {
        return Promise.reject(new Error('No active quiz — cannot create override.'));
      }
      return apiFetch<QuizOverride>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${encodeURIComponent(quizId)}/overrides`,
        { method: 'POST', body: input },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId && quizId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.quizOverrides(tenantId, courseId, quizId),
        });
      }
    },
  });
}

export function useUpdateQuizOverrideMutation(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ overrideId, patch }: { overrideId: string; patch: QuizOverridePatch }) => {
      if (!tenantId || !courseId || !quizId) {
        return Promise.reject(new Error('No active quiz — cannot update override.'));
      }
      return apiFetch<QuizOverride>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${encodeURIComponent(quizId)}/overrides/${encodeURIComponent(overrideId)}`,
        { method: 'PATCH', body: patch },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId && quizId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.quizOverrides(tenantId, courseId, quizId),
        });
      }
    },
  });
}

export function useDeleteQuizOverrideMutation(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (overrideId: string) => {
      if (!tenantId || !courseId || !quizId) {
        return Promise.reject(new Error('No active quiz — cannot delete override.'));
      }
      return apiFetch<void>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${encodeURIComponent(quizId)}/overrides/${encodeURIComponent(overrideId)}`,
        { method: 'DELETE', responseType: 'void' },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId && quizId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.quizOverrides(tenantId, courseId, quizId),
        });
      }
    },
  });
}
