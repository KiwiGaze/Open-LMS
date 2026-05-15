'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type { Survey, SurveyQuestion } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';

export function useSurveysQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId ? queryKeys.surveys(tenantId, courseId) : ['surveys', 'inactive'],
    queryFn: () => apiFetch<Survey[]>(`/tenants/${tenantId}/courses/${courseId}/surveys`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useSurveyQuestionsQuery(
  tenantId: string | null,
  courseId: string | null,
  surveyId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && surveyId
        ? queryKeys.surveyQuestions(tenantId, courseId, surveyId)
        : ['survey-questions', 'inactive'],
    queryFn: () =>
      apiFetch<SurveyQuestion[]>(
        `/tenants/${tenantId}/courses/${courseId}/surveys/${encodeURIComponent(surveyId ?? '')}/questions`,
      ),
    enabled: Boolean(tenantId && courseId && surveyId),
  });
}
