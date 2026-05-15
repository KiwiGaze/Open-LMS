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
import { useToast } from '@/components/ui/toast.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useDeleteDiscussionTopic } from '@/lib/api/queries/discussions.ts';
import { useMyCourseMembershipsQuery } from '@/lib/api/queries/me.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import type { DiscussionTopic } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { MessagesSquare, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

const STAFF_ROLES = new Set(['instructor', 'teaching_assistant', 'course_admin']);

type Params = { courseId: string };

export default function DiscussionsPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();
  const myCourseMemberships = useMyCourseMembershipsQuery();
  const isStaff =
    myCourseMemberships.data?.some((m) => m.courseId === courseId && STAFF_ROLES.has(m.role)) ??
    false;

  const topics = useQuery({
    queryKey: tenantId
      ? queryKeys.courseDiscussions(tenantId, courseId)
      : ['discussions', 'inactive'],
    queryFn: () =>
      apiFetch<DiscussionTopic[]>(`/tenants/${tenantId}/courses/${courseId}/discussion-topics`),
    enabled: Boolean(tenantId),
  });

  const deleteTopic = useDeleteDiscussionTopic(tenantId, courseId);

  const handleDelete = (event: React.MouseEvent, topicId: string, title: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm(`Delete topic "${title}"? Posts will be removed too.`)) return;
    deleteTopic.mutate(topicId, {
      onSuccess: () => publish({ tone: 'success', title: 'Topic deleted' }),
      onError: (error) =>
        publish({
          tone: 'danger',
          title: 'Delete failed',
          description: error instanceof Error ? error.message : undefined,
        }),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-(--color-text-muted)">
          Course-wide and module-scoped discussion threads.
        </p>
        <Button asChild>
          <Link href={`/courses/${courseId}/discussions/new`}>
            <Plus className="size-4" aria-hidden /> New topic
          </Link>
        </Button>
      </div>

      {topics.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`d-skel-${i}`} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : topics.error ? (
        <ErrorState error={topics.error} onRetry={() => topics.refetch()} />
      ) : (topics.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No discussion topics yet"
          description="Start a discussion to give students something to think about together."
          action={
            <Button asChild>
              <Link href={`/courses/${courseId}/discussions/new`}>New topic</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {topics.data?.map((topic) => (
            <div key={topic.id} className="relative">
              <Link href={`/courses/${courseId}/discussions/${topic.id}`} className="group">
                <Card className="transition-shadow group-hover:shadow-(--shadow-sm)">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base group-hover:text-(--color-text-link)">
                        {topic.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 pr-16">
                        <Badge tone={topic.visibility === 'published' ? 'success' : 'neutral'}>
                          {topic.visibility}
                        </Badge>
                        {topic.gradingEnabled ? (
                          <Badge tone="brand">{topic.pointsPossible ?? '—'} pts</Badge>
                        ) : null}
                        {topic.requirePostBeforeSeeingOthers ? (
                          <Badge tone="warning">Post first</Badge>
                        ) : null}
                      </div>
                    </div>
                    {topic.prompt ? (
                      <CardDescription className="line-clamp-2">{topic.prompt}</CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-(--color-text-subtle)">
                    Position {topic.position + 1}
                  </CardContent>
                </Card>
              </Link>
              {isStaff ? (
                <div className="absolute right-3 top-3 flex items-center gap-1">
                  <Button
                    asChild
                    intent="ghost"
                    size="icon-sm"
                    aria-label={`Edit topic ${topic.title}`}
                  >
                    <Link href={`/courses/${courseId}/discussions/${topic.id}/edit`}>
                      <Pencil className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    intent="ghost"
                    size="icon-sm"
                    aria-label={`Delete topic ${topic.title}`}
                    onClick={(e) => handleDelete(e, topic.id, topic.title)}
                    disabled={deleteTopic.isPending}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
