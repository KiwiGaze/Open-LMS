'use client';

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
        <CardHeader>
          <CardTitle>Before you start</CardTitle>
          <CardDescription>What to expect on this attempt.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-(--color-text-default)">
            <li>Submit each question; your work is auto-saved.</li>
            {q.timeLimitMinutes ? (
              <li>You have {q.timeLimitMinutes} minutes once you start.</li>
            ) : null}
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
