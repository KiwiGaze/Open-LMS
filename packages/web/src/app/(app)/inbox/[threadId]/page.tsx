'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useMeQuery } from '@/lib/api/queries/me.ts';
import {
  useConversationMessagesQuery,
  useCreateConversationMessageMutation,
  useInboxThreadsQuery,
} from '@/lib/api/queries/messaging.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime, initialsOf } from '@/lib/format.ts';
import { ArrowLeft, Inbox, Lock, Send } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { use, useState } from 'react';

type Params = { threadId: string };

export default function InboxThreadPage({ params }: { params: Promise<Params> }) {
  const { threadId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const searchParams = useSearchParams();
  const queryCourseId = searchParams.get('courseId');
  const { publish } = useToast();
  const me = useMeQuery();

  // Resolve courseId. Prefer URL param; otherwise look up in the inbox cache.
  const inbox = useInboxThreadsQuery(tenantId);
  const thread = inbox.data?.find((t) => t.id === threadId);
  const resolvedCourseId = queryCourseId ?? thread?.courseId ?? null;
  const inboxSettled = inbox.isSuccess || inbox.isError;

  const messages = useConversationMessagesQuery(tenantId, resolvedCourseId, threadId);
  const sendMessage = useCreateConversationMessageMutation(tenantId, resolvedCourseId, threadId);
  const [replyBody, setReplyBody] = useState('');

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = replyBody.trim();
    if (!body) return;
    try {
      await sendMessage.mutateAsync(body);
      setReplyBody('');
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not send. Try again.';
      publish({ tone: 'danger', title: 'Send failed', description: message });
    }
  };

  // Cold land without a courseId hint and no cache hit. Show a recoverable
  // empty state rather than an infinite skeleton.
  if (!queryCourseId && inboxSettled && !thread) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow="Inbox"
          title="Conversation not found"
          actions={
            <Button asChild intent="ghost">
              <Link href="/inbox">
                <ArrowLeft className="size-4" aria-hidden /> Back to inbox
              </Link>
            </Button>
          }
        />
        <EmptyState
          icon={Inbox}
          title="Conversation not found"
          description="Open this conversation from your inbox to view its messages."
        />
      </div>
    );
  }

  // Tenant-wide thread (courseId null) — messages endpoint requires a courseId,
  // so we can't read or reply via the current API.
  if (thread && thread.courseId === null && queryCourseId === null) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          eyebrow="Inbox"
          title={thread.subject ?? 'Conversation'}
          actions={
            <Button asChild intent="ghost">
              <Link href="/inbox">
                <ArrowLeft className="size-4" aria-hidden /> Back to inbox
              </Link>
            </Button>
          }
        />
        <EmptyState
          icon={Lock}
          title="Tenant-wide messages aren't readable yet"
          description="This conversation isn't scoped to a course. Reading and replying are not supported in this version."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Inbox"
        title={thread?.subject ?? 'Conversation'}
        description={
          thread
            ? `${thread.participantIds.length} participant${thread.participantIds.length === 1 ? '' : 's'}`
            : undefined
        }
        actions={
          <Button asChild intent="ghost">
            <Link href="/inbox">
              <ArrowLeft className="size-4" aria-hidden /> Back to inbox
            </Link>
          </Button>
        }
      />

      {!resolvedCourseId ? (
        <Skeleton className="h-32 w-full" />
      ) : messages.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`msg-skel-${i}`} className="h-16 w-full rounded-[var(--radius-md)]" />
          ))}
        </div>
      ) : messages.error ? (
        <ErrorState error={messages.error} onRetry={() => messages.refetch()} />
      ) : (messages.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No messages"
          description="This conversation has no messages yet."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.data?.map((message) => {
            const isMine = me.data?.id === message.senderId;
            return (
              <li
                key={message.id}
                className={`flex gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar size="sm">
                  <AvatarFallback>{initialsOf(message.senderId.slice(-2))}</AvatarFallback>
                </Avatar>
                <div
                  className={`flex max-w-[80%] flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 text-xs text-(--color-text-muted)">
                    <span className="font-mono">{message.senderId.slice(-12)}</span>
                    {isMine ? <Badge tone="neutral">You</Badge> : null}
                    <span>{formatDateTime(message.sentAt)}</span>
                  </div>
                  <div
                    className={`rounded-[var(--radius-md)] px-3 py-2 text-sm whitespace-pre-wrap ${
                      isMine
                        ? 'bg-(--color-brand) text-(--color-text-onbrand)'
                        : 'bg-(--color-surface-elevated) text-(--color-text-default) border border-(--color-border-subtle)'
                    }`}
                  >
                    {message.body}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {resolvedCourseId ? (
        <form onSubmit={handleSend} className="mt-2 flex flex-col gap-2">
          <Textarea
            rows={3}
            maxLength={4000}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write a reply…"
            disabled={sendMessage.isPending}
          />
          <div className="flex items-center justify-end">
            <Button
              type="submit"
              disabled={!replyBody.trim() || sendMessage.isPending}
              loading={sendMessage.isPending}
            >
              <Send className="size-4" aria-hidden /> Send
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
