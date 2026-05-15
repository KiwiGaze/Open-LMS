'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { FormField } from '@/components/patterns/form-field.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useGradeAppealsQuery, useUpdateGradeAppealMutation } from '@/lib/api/queries/gradebook.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { GradeAppeal, GradeAppealStatus } from '@openlms/contracts';
import { Gavel } from 'lucide-react';
import { useState } from 'react';

const STATUS_TONE: Record<
  GradeAppealStatus,
  'brand' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  open: 'warning',
  under_review: 'brand',
  resolved: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

type ResolveAction = { status: 'resolved' | 'rejected'; title: string };

export function AppealsPanel({
  tenantId,
  courseId,
}: {
  tenantId: string | null;
  courseId: string;
}) {
  const appeals = useGradeAppealsQuery(tenantId, courseId);
  const [activeAppeal, setActiveAppeal] = useState<GradeAppeal | null>(null);
  const [action, setAction] = useState<ResolveAction | null>(null);

  const openAppeals = (appeals.data ?? []).filter(
    (a) => a.status === 'open' || a.status === 'under_review',
  );
  const recentResolved = (appeals.data ?? [])
    .filter((a) => a.status === 'resolved' || a.status === 'rejected')
    .sort((a, b) => (b.resolvedAt?.getTime() ?? 0) - (a.resolvedAt?.getTime() ?? 0))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade appeals</CardTitle>
        <CardDescription>
          Resolve student disputes. Accepting an appeal flags the grade for revision.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appeals.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : appeals.error ? (
          <ErrorState error={appeals.error} onRetry={() => appeals.refetch()} />
        ) : openAppeals.length === 0 && recentResolved.length === 0 ? (
          <EmptyState
            icon={Gavel}
            title="No appeals"
            description="When students dispute a grade, the request will appear here."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {openAppeals.length === 0 ? null : (
              <ul className="flex flex-col divide-y divide-(--color-border-subtle)">
                {openAppeals.map((appeal) => (
                  <li
                    key={appeal.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs text-(--color-text-default)">
                          {appeal.studentId.slice(-12)}
                        </code>
                        <Badge tone={STATUS_TONE[appeal.status]}>{appeal.status}</Badge>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-(--color-text-default)">
                        {appeal.reason}
                      </p>
                      <p className="mt-1 text-xs text-(--color-text-muted)">
                        Filed {formatDateTime(appeal.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        intent="primary"
                        size="sm"
                        onClick={() => {
                          setActiveAppeal(appeal);
                          setAction({ status: 'resolved', title: 'Accept appeal' });
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        intent="secondary"
                        size="sm"
                        onClick={() => {
                          setActiveAppeal(appeal);
                          setAction({ status: 'rejected', title: 'Reject appeal' });
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {recentResolved.length === 0 ? null : (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-(--color-text-muted)">
                  Recently resolved
                </p>
                <ul className="flex flex-col divide-y divide-(--color-border-subtle)">
                  {recentResolved.map((appeal) => (
                    <li key={appeal.id} className="py-2">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs text-(--color-text-default)">
                          {appeal.studentId.slice(-12)}
                        </code>
                        <Badge tone={STATUS_TONE[appeal.status]}>{appeal.status}</Badge>
                        <span className="text-xs text-(--color-text-muted)">
                          {appeal.resolvedAt ? formatDateTime(appeal.resolvedAt) : ''}
                        </span>
                      </div>
                      {appeal.resolution ? (
                        <p className="mt-1 whitespace-pre-wrap text-xs text-(--color-text-muted)">
                          {appeal.resolution}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {activeAppeal && action ? (
        <ResolveDialog
          tenantId={tenantId}
          courseId={courseId}
          appeal={activeAppeal}
          action={action}
          onClose={() => {
            setActiveAppeal(null);
            setAction(null);
          }}
        />
      ) : null}
    </Card>
  );
}

function ResolveDialog({
  tenantId,
  courseId,
  appeal,
  action,
  onClose,
}: {
  tenantId: string | null;
  courseId: string;
  appeal: GradeAppeal;
  action: ResolveAction;
  onClose: () => void;
}) {
  const { publish } = useToast();
  const update = useUpdateGradeAppealMutation(tenantId, courseId);
  const [resolution, setResolution] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = resolution.trim();
    if (trimmed.length === 0) return;
    try {
      await update.mutateAsync({
        gradeAppealId: appeal.id,
        status: action.status,
        resolution: trimmed,
      });
      publish({
        tone: 'success',
        title: action.status === 'resolved' ? 'Appeal accepted' : 'Appeal rejected',
      });
      onClose();
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not update appeal.';
      publish({ tone: 'danger', title: 'Update failed', description: message });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action.title}</DialogTitle>
          <DialogDescription>
            {action.status === 'resolved'
              ? 'Acknowledge the dispute and explain how the grade will be revisited.'
              : 'Explain why this appeal is being declined.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Reason / resolution notes" id="appeal-resolution" required>
            <Textarea
              id="appeal-resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Visible to the student."
              autoFocus
            />
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={update.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!resolution.trim() || update.isPending}
              loading={update.isPending}
            >
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
