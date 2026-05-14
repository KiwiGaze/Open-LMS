'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
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
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { Quiz } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Plus, Timer } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string };

export default function QuizzesPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);

  const quizzes = useQuery({
    queryKey: tenantId ? queryKeys.courseQuizzes(tenantId, courseId) : ['quizzes', 'inactive'],
    queryFn: () => apiFetch<Quiz[]>(`/tenants/${tenantId}/courses/${courseId}/quizzes`),
    enabled: Boolean(tenantId),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-(--color-text-muted)">
          Open quizzes you can take, and previous attempts.
        </p>
        <Button asChild>
          <Link href={`/courses/${courseId}/quizzes/new`}>
            <Plus className="size-4" aria-hidden /> New quiz
          </Link>
        </Button>
      </div>

      {quizzes.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`q-skel-${i}`} className="h-32 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : quizzes.error ? (
        <ErrorState error={quizzes.error} onRetry={() => quizzes.refetch()} />
      ) : (quizzes.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No quizzes yet"
          description="Create one to assess understanding or unlock module progression."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {quizzes.data?.map((quiz) => (
            <Link key={quiz.id} href={`/courses/${courseId}/quizzes/${quiz.id}`} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-(--shadow-sm)">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base group-hover:text-(--color-text-link)">
                      {quiz.title}
                    </CardTitle>
                    <Badge tone={quiz.status === 'published' ? 'success' : 'neutral'}>
                      {quiz.status}
                    </Badge>
                  </div>
                  {quiz.description ? (
                    <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0 text-xs text-(--color-text-muted)">
                  {quiz.timeLimitMinutes ? (
                    <span className="inline-flex items-center gap-1">
                      <Timer className="size-3" aria-hidden /> {quiz.timeLimitMinutes} min
                    </span>
                  ) : null}
                  {quiz.maxAttempts > 1 ? <span>{quiz.maxAttempts} attempts</span> : null}
                  {quiz.opensAt ? <span>Opens {formatDateTime(quiz.opensAt)}</span> : null}
                  {quiz.closesAt ? <span>Closes {formatDateTime(quiz.closesAt)}</span> : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
