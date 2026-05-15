'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useQuizAttemptResponsesQuery,
  useQuizAttemptsQuery,
  useQuizQuery,
  useQuizQuestionsQuery,
  useQuizSettingsQuery,
  useStartQuizAttempt,
} from '@/lib/api/queries/quizzes.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import Link from 'next/link';
import { use, useEffect, useRef } from 'react';
import { QuizRunner } from './quiz-runner.tsx';
import { ResultsView } from './results-view.tsx';

type Params = { courseId: string; quizId: string };

export default function QuizTakePage({ params }: { params: Promise<Params> }) {
  const { courseId, quizId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();

  const quizQuery = useQuizQuery(tenantId, courseId, quizId);
  const questions = useQuizQuestionsQuery(tenantId, courseId, quizId);
  const attempts = useQuizAttemptsQuery(tenantId, courseId, quizId);
  const settings = useQuizSettingsQuery(tenantId, courseId, quizId);

  const quiz = quizQuery.data;

  const inProgress = attempts.data?.find((a) => a.status === 'in_progress') ?? null;
  const submittedAttempts =
    attempts.data?.filter((a) => a.status === 'submitted' || a.status === 'graded') ?? [];
  const latestSubmitted =
    submittedAttempts.length > 0
      ? ([...submittedAttempts].sort((a, b) => b.attemptNumber - a.attemptNumber)[0] ?? null)
      : null;
  const focusAttemptId = inProgress?.id ?? latestSubmitted?.id ?? null;

  const responses = useQuizAttemptResponsesQuery(tenantId, courseId, quizId, focusAttemptId);

  const startMutation = useStartQuizAttempt(tenantId, courseId, quizId);
  const startedRef = useRef(false);

  const isLoading =
    quizQuery.isLoading || questions.isLoading || attempts.isLoading || settings.isLoading;
  const loadError =
    quizQuery.error || questions.error || attempts.error || settings.error || responses.error;

  const attemptCount = attempts.data?.length ?? 0;
  const maxAttempts = quiz?.maxAttempts ?? 0;
  const canStart = Boolean(quiz) && !inProgress && !latestSubmitted && attemptCount < maxAttempts;
  const canStartAgain =
    Boolean(quiz) && !inProgress && latestSubmitted !== null && attemptCount < maxAttempts;

  // biome-ignore lint/correctness/useExhaustiveDependencies: one-shot auto-start gated by startedRef; only the trigger booleans + counts should retrigger
  useEffect(() => {
    if (
      tenantId &&
      quiz &&
      attempts.isSuccess &&
      !inProgress &&
      !latestSubmitted &&
      attemptCount < maxAttempts &&
      !startedRef.current &&
      !startMutation.isPending
    ) {
      startedRef.current = true;
      startMutation.mutate(
        { accessPassword: null },
        {
          onError: (error) => {
            startedRef.current = false;
            const message =
              error instanceof ApiHttpError
                ? error.message
                : 'We could not start your attempt. Try again.';
            publish({ tone: 'danger', title: 'Could not start attempt', description: message });
          },
        },
      );
    }
  }, [tenantId, quiz, attempts.isSuccess, inProgress, latestSubmitted, attemptCount, maxAttempts]);

  const triggerNewAttempt = () => {
    startedRef.current = true;
    startMutation.mutate(
      { accessPassword: null },
      {
        onError: (error) => {
          startedRef.current = false;
          const message =
            error instanceof ApiHttpError ? error.message : 'We could not start another attempt.';
          publish({ tone: 'danger', title: 'Could not start attempt', description: message });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Quiz attempt"
        title={quiz?.title ?? 'Quiz'}
        description={
          inProgress
            ? 'Your answers autosave as you work. Submit when you are done.'
            : latestSubmitted
              ? 'Review your submitted attempt below.'
              : 'Starting your attempt…'
        }
        actions={
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}/quizzes/${quizId}`}>Back to quiz</Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <Skeleton className="h-64 w-full" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-40 w-full" />
            <SkeletonText lines={4} />
          </div>
        </div>
      ) : loadError ? (
        <ErrorState
          error={loadError}
          onRetry={() => {
            quizQuery.refetch();
            questions.refetch();
            attempts.refetch();
            settings.refetch();
            responses.refetch();
          }}
        />
      ) : !quiz ? (
        <ErrorState
          title="Quiz not found"
          error={new Error('It may have been removed or moved to another course.')}
        />
      ) : inProgress ? (
        responses.isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <QuizRunner
            tenantId={tenantId ?? ''}
            courseId={courseId}
            quizId={quizId}
            quiz={quiz}
            attempt={inProgress}
            questions={questions.data ?? []}
            initialResponses={responses.data ?? []}
            settings={settings.data ?? null}
          />
        )
      ) : latestSubmitted ? (
        <>
          <ResultsView
            courseId={courseId}
            quiz={quiz}
            attempt={latestSubmitted}
            questions={questions.data ?? []}
            responses={responses.data ?? []}
          />
          {canStartAgain ? (
            <Card>
              <CardHeader>
                <CardTitle>Try again?</CardTitle>
                <CardDescription>
                  You've used {attemptCount} of {maxAttempts} attempts. Final grade uses the{' '}
                  {quiz.gradingMethod} score across attempts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button loading={startMutation.isPending} onClick={triggerNewAttempt}>
                  Start a new attempt
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : canStart ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-6">
            <SkeletonText lines={2} />
            <p className="text-xs text-(--color-text-muted)">Starting your first attempt…</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No attempts remaining</CardTitle>
            <CardDescription>You've used all {maxAttempts} attempts for this quiz.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
