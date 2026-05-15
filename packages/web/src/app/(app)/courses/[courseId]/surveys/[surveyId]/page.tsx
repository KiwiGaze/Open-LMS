'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useSurveyQuestionsQuery, useSurveysQuery } from '@/lib/api/queries/surveys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string; surveyId: string };

export default function SurveyDetail({ params }: { params: Promise<Params> }) {
  const { courseId, surveyId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const surveys = useSurveysQuery(tenantId, courseId);
  const questions = useSurveyQuestionsQuery(tenantId, courseId, surveyId);

  if (surveys.isLoading || questions.isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }
  if (surveys.error) {
    return <ErrorState error={surveys.error} onRetry={() => surveys.refetch()} />;
  }
  if (questions.error) {
    return <ErrorState error={questions.error} onRetry={() => questions.refetch()} />;
  }

  const survey = surveys.data?.find((entry) => entry.id === surveyId);
  if (!survey) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Survey not found"
        description="This survey may have been removed or is not visible to you."
      />
    );
  }

  const items = questions.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Button asChild intent="secondary" size="sm" className="w-fit">
        <Link href={`/courses/${courseId}/surveys`}>
          <ArrowLeft className="size-3.5" aria-hidden /> Back to surveys
        </Link>
      </Button>
      <PageHeader
        eyebrow="Survey"
        title={survey.title}
        description={survey.description ?? undefined}
        actions={
          <Badge
            tone={
              survey.status === 'published'
                ? 'success'
                : survey.status === 'draft'
                  ? 'warning'
                  : 'outline'
            }
          >
            {survey.status}
          </Badge>
        }
      />
      <Card>
        <CardContent className="grid gap-2 p-6 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">Opens</p>
            <p>{survey.opensAt ? formatDateTime(survey.opensAt) : '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">Closes</p>
            <p>{survey.closesAt ? formatDateTime(survey.closesAt) : '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
              Anonymous responses
            </p>
            <p>{survey.allowsAnonymousResponses ? 'Allowed' : 'Not allowed'}</p>
          </div>
        </CardContent>
      </Card>
      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No questions yet"
          description="This survey does not have any questions."
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((question, idx) => (
            <li key={question.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {idx + 1}. {question.prompt}{' '}
                    {question.required ? (
                      <span className="text-(--color-danger-700)">*</span>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-(--color-text-muted)">
                  Type: {question.questionType.replaceAll('_', ' ')}
                  {question.choices.length > 0 ? (
                    <ul className="mt-2 flex flex-col gap-1">
                      {question.choices.map((choice) => (
                        <li key={choice.id}>· {choice.text}</li>
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
