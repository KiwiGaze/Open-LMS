'use client';

import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useCoursesQuery } from '@/lib/api/queries/courses.ts';
import { useMyTenantMembershipsQuery } from '@/lib/api/queries/me.ts';
import {
  useCreateConversationThreadMutation,
  useMessageableUsersQuery,
  useTenantMessageableUsersQuery,
} from '@/lib/api/queries/messaging.ts';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const TENANT_WIDE_KEY = '__tenant_wide__';
const TENANT_STAFF_ROLES = new Set([
  'instructor',
  'teaching_assistant',
  'course_admin',
  'institution_admin',
]);

type ScopeValue = string | typeof TENANT_WIDE_KEY | null;

export function NewMessageDialog({
  tenantId,
  open,
  onOpenChange,
}: {
  tenantId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { publish } = useToast();
  const courses = useCoursesQuery(tenantId);
  const myMemberships = useMyTenantMembershipsQuery();
  const [scope, setScope] = useState<ScopeValue>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientIds, setRecipientIds] = useState<string[]>([]);

  const isTenantWide = scope === TENANT_WIDE_KEY;
  const courseId = isTenantWide || scope === null ? null : scope;
  const isStaff =
    !!tenantId &&
    (myMemberships.data?.some((m) => m.tenantId === tenantId && TENANT_STAFF_ROLES.has(m.role)) ??
      false);

  const courseCandidatesQuery = useMessageableUsersQuery(tenantId, courseId);
  const tenantCandidatesQuery = useTenantMessageableUsersQuery(tenantId, isTenantWide);
  const create = useCreateConversationThreadMutation(tenantId);

  const candidatesQuery = isTenantWide ? tenantCandidatesQuery : courseCandidatesQuery;
  const candidates = candidatesQuery.data ?? [];

  const reset = () => {
    setScope(null);
    setSubject('');
    setBody('');
    setRecipientIds([]);
  };

  const toggleRecipient = (userId: string) => {
    setRecipientIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenantId || scope === null) return;
    if (recipientIds.length === 0) {
      publish({
        tone: 'danger',
        title: 'Pick at least one recipient',
        description: 'Select one or more members to message.',
      });
      return;
    }

    try {
      const thread = await create.mutateAsync({
        subject: subject.trim(),
        body: body.trim(),
        participantIds: recipientIds,
        courseId,
      });
      publish({ tone: 'success', title: 'Message sent' });
      reset();
      onOpenChange(false);
      router.push(courseId ? `/inbox/${thread.id}?courseId=${courseId}` : `/inbox/${thread.id}`);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not send. Try again.';
      publish({ tone: 'danger', title: 'Send failed', description: message });
    }
  };

  const canSubmit =
    Boolean(tenantId) &&
    scope !== null &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    recipientIds.length > 0 &&
    !create.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent width="lg">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>
            Pick a course to message its members, or send a tenant-wide message visible to every
            recipient.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scope">Scope</Label>
            <Select
              value={scope ?? ''}
              onValueChange={(v) => {
                setScope(v as ScopeValue);
                setRecipientIds([]);
              }}
            >
              <SelectTrigger id="scope" disabled={courses.isLoading}>
                <SelectValue placeholder={courses.isLoading ? 'Loading…' : 'Pick a course'} />
              </SelectTrigger>
              <SelectContent>
                {isStaff ? (
                  <SelectItem value={TENANT_WIDE_KEY}>No course (tenant-wide)</SelectItem>
                ) : null}
                {courses.data?.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} · {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              type="text"
              maxLength={180}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Quick question about..."
              required
            />
          </div>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-medium text-(--color-text-default)">Recipients</legend>
            {scope === null ? (
              <p className="text-sm text-(--color-text-muted)">Pick a scope to see members.</p>
            ) : candidatesQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : candidates.length === 0 ? (
              <p className="text-sm text-(--color-text-muted)">
                {isTenantWide
                  ? 'No other tenant members to message yet.'
                  : 'No one to message in this course yet.'}
              </p>
            ) : (
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-[var(--radius-md)] border border-(--color-border-subtle) p-2">
                {candidates.map((member) => {
                  const checkboxId = `recipient-${member.userId}`;
                  return (
                    <label
                      key={member.userId}
                      htmlFor={checkboxId}
                      className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-(--color-surface-muted)"
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={recipientIds.includes(member.userId)}
                        onCheckedChange={() => toggleRecipient(member.userId)}
                      />
                      <span className="flex-1 truncate text-sm text-(--color-text-default)">
                        {member.displayName}
                      </span>
                      <Badge tone="neutral">{member.role.replace(/_/g, ' ')}</Badge>
                    </label>
                  );
                })}
              </div>
            )}
            {recipientIds.length > 0 ? (
              <p className="text-xs text-(--color-text-subtle)">
                {recipientIds.length} recipient{recipientIds.length === 1 ? '' : 's'} selected
              </p>
            ) : null}
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              rows={6}
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
              required
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={create.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit} loading={create.isPending}>
              <Send className="size-4" aria-hidden /> Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
