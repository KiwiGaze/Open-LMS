'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  QtiQuizItemExport,
  QtiQuizItemImportRequest,
  QtiQuizItemImportResult,
  Quiz,
  QuizAttempt,
  QuizAttemptResponse,
  QuizAttemptResponseAnswer,
  QuizEffectiveSettings,
  QuizQuestion,
  QuizQuestionAnswerKey,
  QuizQuestionChoice,
  QuizQuestionType,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CreateQuizInput = {
  moduleId: string | null;
  unitId: string | null;
  position: number | null;
  title: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  opensAt: string | null;
  closesAt: string | null;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  maxAttempts: number;
  accessPassword?: string | null;
  allowedIpRanges?: string[];
};

export function useCreateQuiz(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuizInput) =>
      apiFetch<Quiz>(`/tenants/${tenantId}/courses/${courseId}/quizzes`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseQuizzes(tenantId, courseId),
        });
      }
    },
  });
}

export function useQuizzesQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId ? queryKeys.courseQuizzes(tenantId, courseId) : ['quizzes', 'inactive'],
    queryFn: () => apiFetch<Quiz[]>(`/tenants/${tenantId}/courses/${courseId}/quizzes`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useQuizQuery(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && quizId
        ? queryKeys.quiz(tenantId, courseId, quizId)
        : ['quiz', 'inactive'],
    queryFn: () =>
      apiFetch<Quiz>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${encodeURIComponent(quizId ?? '')}`,
      ),
    enabled: Boolean(tenantId && courseId && quizId),
  });
}

export function useQuizQuestionsQuery(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && quizId
        ? queryKeys.quizQuestions(tenantId, courseId, quizId)
        : ['quiz-questions', 'inactive'],
    queryFn: () =>
      apiFetch<QuizQuestion[]>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/questions`,
      ),
    enabled: Boolean(tenantId && courseId && quizId),
  });
}

export type CreateQuizQuestionInput = {
  position: number;
  questionType: QuizQuestionType;
  prompt: string;
  points: number;
  choices: QuizQuestionChoice[];
  answerKey?: QuizQuestionAnswerKey | null;
};

export function useExportQuizQtiMutation(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
) {
  return useMutation({
    mutationFn: async () => {
      if (!tenantId || !courseId || !quizId) {
        throw new Error('No active quiz — cannot export QTI.');
      }
      const bundle = await apiFetch<QtiQuizItemExport>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${encodeURIComponent(quizId)}/qti-items`,
      );
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `quiz-${quizId}-qti.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      return bundle;
    },
  });
}

export function useImportQuizQtiMutation(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: QtiQuizItemImportRequest) => {
      if (!tenantId || !courseId || !quizId) {
        return Promise.reject(new Error('No active quiz — cannot import QTI.'));
      }
      return apiFetch<QtiQuizItemImportResult>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${encodeURIComponent(quizId)}/qti-items/import`,
        { method: 'POST', body: input },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId && quizId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.quizQuestions(tenantId, courseId, quizId),
        });
      }
    },
  });
}

export function useCreateQuizQuestionMutation(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuizQuestionInput) => {
      if (!tenantId || !courseId || !quizId) {
        return Promise.reject(new Error('No active tenant or quiz — cannot create question.'));
      }
      return apiFetch<QuizQuestion>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/questions`,
        {
          method: 'POST',
          body: input,
        },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId && quizId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.quizQuestions(tenantId, courseId, quizId),
        });
      }
    },
  });
}

export function useQuizSettingsQuery(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && quizId
        ? queryKeys.quizSettings(tenantId, courseId, quizId)
        : ['quiz-settings', 'inactive'],
    queryFn: () =>
      apiFetch<QuizEffectiveSettings>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/effective-settings`,
      ),
    enabled: Boolean(tenantId && courseId && quizId),
  });
}

export function useQuizAttemptsQuery(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && quizId
        ? queryKeys.quizAttempts(tenantId, courseId, quizId)
        : ['quiz-attempts', 'inactive'],
    queryFn: () =>
      apiFetch<QuizAttempt[]>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts`,
      ),
    enabled: Boolean(tenantId && courseId && quizId),
  });
}

export function useQuizAttemptResponsesQuery(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
  attemptId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && quizId && attemptId
        ? queryKeys.quizAttemptResponses(tenantId, courseId, quizId, attemptId)
        : ['quiz-attempt-responses', 'inactive'],
    queryFn: () =>
      apiFetch<QuizAttemptResponse[]>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts/${attemptId}/responses`,
      ),
    enabled: Boolean(tenantId && courseId && quizId && attemptId),
  });
}

export function useStartQuizAttempt(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { accessPassword?: string | null }) =>
      apiFetch<QuizAttempt>(`/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts`, {
        method: 'POST',
        body,
      }),
    onSuccess: () => {
      if (tenantId && courseId && quizId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.quizAttempts(tenantId, courseId, quizId),
        });
      }
    },
  });
}

export function useSaveQuizAnswer(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
  attemptId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { questionId: string; answer: QuizAttemptResponseAnswer }) =>
      apiFetch<QuizAttemptResponse>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts/${attemptId}/responses/${input.questionId}`,
        { method: 'PUT', body: { answer: input.answer } },
      ),
    onSuccess: () => {
      if (tenantId && courseId && quizId && attemptId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.quizAttemptResponses(tenantId, courseId, quizId, attemptId),
        });
      }
    },
  });
}

export function useSubmitQuizAttempt(
  tenantId: string | null,
  courseId: string | null,
  quizId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) =>
      apiFetch<QuizAttempt>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/attempts/${attemptId}/submit`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      if (tenantId && courseId && quizId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.quizAttempts(tenantId, courseId, quizId),
        });
      }
    },
  });
}
