'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx';
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
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import {
  useSubscribeDiscussionTopic,
  useUnsubscribeDiscussionTopic,
} from '@/lib/api/queries/discussions.ts';
import { useCourseMembershipsQuery } from '@/lib/api/queries/gradebook.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatRelative, initialsOf } from '@/lib/format.ts';
import type { DiscussionPost, DiscussionTopic } from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, MessagesSquare, Pencil, Send } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { use } from 'react';
import { InstructorGradingPanel } from './instructor-grading-panel.tsx';

const STAFF_ROLES = new Set(['instructor', 'teaching_assistant', 'course_admin']);

type Params = { courseId: string; topicId: string };

export default function DiscussionTopicPage({ params }: { params: Promise<Params> }) {
  const { courseId, topicId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const user = useSessionStore((s) => s.user);
  const queryClient = useQueryClient();
  const { publish } = useToast();
  const [body, setBody] = useState('');

  const memberships = useCourseMembershipsQuery(tenantId, courseId);
  const myMembership = memberships.data?.find((m) => m.userId === user?.id);
  const isStaff = myMembership ? STAFF_ROLES.has(myMembership.role) : false;
  const subscribe = useSubscribeDiscussionTopic(tenantId, courseId, topicId);
  const unsubscribe = useUnsubscribeDiscussionTopic(tenantId, courseId, topicId);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);

  const onSubscribe = () => {
    subscribe.mutate(undefined, {
      onSuccess: () => {
        setSubscribed(true);
        publish({ tone: 'success', title: "You'll be notified of replies" });
      },
      onError: (error: unknown) => {
        const message =
          error instanceof ApiHttpError ? error.message : 'Could not update subscription.';
        publish({ tone: 'danger', title: 'Subscription failed', description: message });
      },
    });
  };

  const onUnsubscribe = () => {
    unsubscribe.mutate(undefined, {
      onSuccess: () => {
        setSubscribed(false);
        publish({ tone: 'success', title: 'Notifications turned off' });
      },
      onError: (error: unknown) => {
        const message =
          error instanceof ApiHttpError ? error.message : 'Could not update subscription.';
        publish({ tone: 'danger', title: 'Subscription failed', description: message });
      },
    });
  };

  const topic = useQuery({
    queryKey: tenantId
      ? queryKeys.discussionTopic(tenantId, courseId, topicId)
      : ['discussion-topic', 'inactive'],
    queryFn: () =>
      apiFetch<DiscussionTopic>(
        `/tenants/${tenantId}/courses/${courseId}/discussion-topics/${topicId}`,
      ),
    enabled: Boolean(tenantId),
  });

  const posts = useQuery({
    queryKey: tenantId
      ? queryKeys.discussionPosts(tenantId, courseId, topicId)
      : ['discussion-posts', 'inactive'],
    queryFn: () =>
      apiFetch<DiscussionPost[]>(
        `/tenants/${tenantId}/courses/${courseId}/discussion-topics/${topicId}/posts`,
      ),
    enabled: Boolean(tenantId),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch<DiscussionPost>(
        `/tenants/${tenantId}/courses/${courseId}/discussion-topics/${topicId}/posts`,
        { method: 'POST', body: { body } },
      ),
    onSuccess: () => {
      setBody('');
      publish({ tone: 'success', title: 'Post published' });
      queryClient.invalidateQueries({
        queryKey: queryKeys.discussionPosts(tenantId ?? '', courseId, topicId),
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not publish your post.';
      publish({ tone: 'danger', title: 'Post failed', description: message });
    },
  });

  if (topic.isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }
  if (topic.error) {
    return <ErrorState error={topic.error} onRetry={() => topic.refetch()} />;
  }
  if (!topic.data) return null;

  const t = topic.data;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>{t.title}</CardTitle>
              {t.prompt ? <CardDescription className="mt-2">{t.prompt}</CardDescription> : null}
            </div>
            <div className="flex items-center gap-2">
              {t.gradingEnabled ? (
                <Badge tone="brand">Graded · {t.pointsPossible} pts</Badge>
              ) : null}
              {t.requirePostBeforeSeeingOthers ? (
                <Badge tone="warning">Post before viewing replies</Badge>
              ) : null}
              {isStaff ? (
                <Button asChild intent="secondary" size="sm">
                  <Link href={`/courses/${courseId}/discussions/${topicId}/edit`}>
                    <Pencil className="size-3.5" aria-hidden /> Edit topic
                  </Link>
                </Button>
              ) : null}
              {subscribed === true ? (
                <Button
                  intent="secondary"
                  size="sm"
                  onClick={onUnsubscribe}
                  disabled={unsubscribe.isPending}
                  loading={unsubscribe.isPending}
                >
                  <BellOff className="size-3.5" aria-hidden /> Stop notifications
                </Button>
              ) : (
                <Button
                  intent="secondary"
                  size="sm"
                  onClick={onSubscribe}
                  disabled={subscribe.isPending}
                  loading={subscribe.isPending}
                >
                  <Bell className="size-3.5" aria-hidden /> Notify me of replies
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add a reply</CardTitle>
          <CardDescription>Be respectful and substantive.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your response..."
            rows={5}
          />
          <div className="mt-3 flex justify-end">
            <Button
              onClick={() => create.mutate()}
              disabled={!body.trim() || create.isPending}
              loading={create.isPending}
            >
              <Send className="size-4" aria-hidden /> Post reply
            </Button>
          </div>
        </CardContent>
      </Card>

      {posts.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`post-skel-${i}`} className="h-24 w-full" />
          ))}
        </div>
      ) : posts.error ? (
        <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
      ) : (posts.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No replies yet"
          description="Be the first to share your thoughts."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.data
            ?.filter((p) => p.status === 'published')
            .map((p) => (
              <li key={p.id}>
                <Card>
                  <CardContent className="flex gap-3 p-4">
                    <Avatar size="sm">
                      <AvatarFallback>{initialsOf(p.authorId.slice(-2))}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-(--color-text-default)">
                          Participant
                        </p>
                        <span className="text-xs text-(--color-text-subtle)">
                          {formatRelative(p.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-(--color-text-default)">
                        {p.body}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
        </ul>
      )}

      {isStaff && t.gradingEnabled && t.pointsPossible !== null ? (
        <InstructorGradingPanel
          tenantId={tenantId}
          courseId={courseId}
          topicId={topicId}
          pointsPossible={t.pointsPossible}
          posts={posts.data ?? []}
        />
      ) : null}
    </div>
  );
}
