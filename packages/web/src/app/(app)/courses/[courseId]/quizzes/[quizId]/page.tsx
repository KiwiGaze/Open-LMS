'use client';

import { AddMultipleChoiceQuestionDialog } from '@/app/(app)/courses/[courseId]/quizzes/[quizId]/add-multiple-choice-question-dialog.tsx';
import { AddNumericQuestionDialog } from '@/app/(app)/courses/[courseId]/quizzes/[quizId]/add-numeric-question-dialog.tsx';
import { AddTrueFalseQuestionDialog } from '@/app/(app)/courses/[courseId]/quizzes/[quizId]/add-true-false-question-dialog.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { useQuizQuestionsQuery } from '@/lib/api/queries/quizzes.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { Quiz, QuizEffectiveSettings } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, ListChecks, Timer } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string; quizId: string };

export default function QuizDetailPage({ params }: { params: Promise<Params> }) {
  const { courseId, quizId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);

  const quiz = useQuery({
    queryKey: ['quiz', tenantId ?? '', courseId, quizId],
    queryFn: () => apiFetch<Quiz>(`/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}`),
    enabled: Boolean(tenantId),
  });
  const questions = useQuizQuestionsQuery(tenantId, courseId, quizId);
  const settings = useQuery({
    queryKey: ['quiz-settings', tenantId ?? '', courseId, quizId],
    queryFn: () =>
      apiFetch<QuizEffectiveSettings>(
        `/tenants/${tenantId}/courses/${courseId}/quizzes/${quizId}/effective-settings`,
      ),
    enabled: Boolean(tenantId),
  });

  if (quiz.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (quiz.error) {
    return <ErrorState error={quiz.error} onRetry={() => quiz.refetch()} />;
  }
  if (!quiz.data) return null;

  const q = quiz.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Quiz"
        title={q.title}
        description={q.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={q.status === 'published' ? 'success' : 'neutral'}>{q.status}</Badge>
            {q.proctoringRequired ? <Badge tone="warning">Proctored</Badge> : null}
            <Button asChild>
              <Link href={`/courses/${courseId}/quizzes/${quizId}/take`}>Start attempt</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <span className="rounded-[var(--radius-md)] bg-(--color-brand-subtle) p-2 text-(--color-brand-700)">
              <Timer className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                Time limit
              </p>
              <p className="mt-0.5 text-sm font-medium text-(--color-text-default)">
                {settings.data?.timeLimitMinutes
                  ? `${settings.data.timeLimitMinutes} minutes`
                  : 'No limit'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <span className="rounded-[var(--radius-md)] bg-(--color-brand-subtle) p-2 text-(--color-brand-700)">
              <ListChecks className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">Attempts</p>
              <p className="mt-0.5 text-sm font-medium text-(--color-text-default)">
                {settings.data?.maxAttempts ?? q.maxAttempts}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <span className="rounded-[var(--radius-md)] bg-(--color-brand-subtle) p-2 text-(--color-brand-700)">
              <CalendarClock className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">Window</p>
              <p className="mt-0.5 truncate text-sm font-medium text-(--color-text-default)">
                {settings.data?.opensAt && settings.data?.closesAt
                  ? `${formatDateTime(settings.data.opensAt)} – ${formatDateTime(settings.data.closesAt)}`
                  : settings.data?.opensAt
                    ? `Opens ${formatDateTime(settings.data.opensAt)}`
                    : settings.data?.closesAt
                      ? `Closes ${formatDateTime(settings.data.closesAt)}`
                      : 'Always available'}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Questions</CardTitle>
            <CardDescription>
              {questions.data?.length === 1
                ? '1 question'
                : `${questions.data?.length ?? 0} questions`}{' '}
              in this quiz.
            </CardDescription>
          </div>
          {questions.data ? (
            <div className="flex flex-wrap items-center gap-2">
              <AddMultipleChoiceQuestionDialog
                tenantId={tenantId}
                courseId={courseId}
                quizId={quizId}
                nextPosition={questions.data.length}
              />
              <AddTrueFalseQuestionDialog
                tenantId={tenantId}
                courseId={courseId}
                quizId={quizId}
                nextPosition={questions.data.length}
              />
              <AddNumericQuestionDialog
                tenantId={tenantId}
                courseId={courseId}
                quizId={quizId}
                nextPosition={questions.data.length}
              />
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          {questions.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : questions.error ? (
            <ErrorState error={questions.error} onRetry={() => questions.refetch()} />
          ) : (questions.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-(--color-text-muted)">
              No questions yet. Add one to get started.
            </p>
          ) : (
            <ol className="flex flex-col divide-y divide-(--color-border-subtle)">
              {questions.data?.map((question, index) => (
                <li key={question.id} className="flex items-start gap-3 py-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-(--color-surface-muted) text-xs font-medium text-(--color-text-default)">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge tone="outline">{question.questionType.replace(/_/g, ' ')}</Badge>
                      <Badge tone="brand">{question.points} pts</Badge>
                    </div>
                    <p className="mt-1 text-sm text-(--color-text-default)">{question.prompt}</p>
                    {question.choices.length > 0 ? (
                      <ul className="mt-2 flex flex-col gap-1 pl-2 text-xs text-(--color-text-muted)">
                        {question.choices.map((choice) => (
                          <li key={choice.id}>• {choice.text}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Before you start</CardTitle>
          <CardDescription>What to expect on this attempt.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-(--color-text-default)">
            <li>Submit each question; your work is auto-saved.</li>
            {(() => {
              const effectiveTimeLimit = settings.data?.timeLimitMinutes ?? q.timeLimitMinutes;
              return effectiveTimeLimit ? (
                <li>You have {effectiveTimeLimit} minutes once you start.</li>
              ) : null;
            })()}
            {q.shuffleQuestions ? <li>Questions are randomized.</li> : null}
            {q.accessPasswordRequired ? (
              <li>You'll be asked for an access code when starting.</li>
            ) : null}
            {q.proctoringRequired ? (
              <li>This attempt is proctored. Follow your instructor's setup.</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
