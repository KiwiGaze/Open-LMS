'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  type CreateLegalHoldInput,
  type LegalHoldStatusFilter,
  useCreateLegalHoldMutation,
  useReleaseLegalHoldMutation,
  useUserLegalHoldsQuery,
} from '@/lib/api/queries/legal-holds.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { UserLegalHold } from '@openlms/contracts';
import { Plus, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export default function AdminLegalHoldsPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const [status, setStatus] = useState<LegalHoldStatusFilter>('active');
  const [createOpen, setCreateOpen] = useState(false);
  const holds = useUserLegalHoldsQuery(tenantId, status);
  const create = useCreateLegalHoldMutation(tenantId);
  const release = useReleaseLegalHoldMutation(tenantId);
  const { publish } = useToast();

  const items = holds.data ?? [];

  const handleRelease = async (hold: UserLegalHold) => {
    try {
      await release.mutateAsync(hold.id);
      publish({ tone: 'success', title: 'Legal hold released' });
    } catch (error) {
      publish({
        tone: 'danger',
        title: 'Release failed',
        description:
          error instanceof ApiHttpError ? error.message : 'Could not release legal hold.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="Legal holds"
        description="Place a hold to prevent data purge for a user (FERPA, GDPR, or litigation response). Released holds remain visible for audit."
        actions={
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={(v) => setStatus(v as LegalHoldStatusFilter)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button intent="primary" size="sm">
                  <Plus className="size-3.5" aria-hidden /> Place hold
                </Button>
              </DialogTrigger>
              {createOpen ? (
                <CreateLegalHoldDialog
                  busy={create.isPending}
                  onCancel={() => setCreateOpen(false)}
                  onCreate={async (input) => {
                    try {
                      await create.mutateAsync(input);
                      publish({ tone: 'success', title: 'Legal hold placed' });
                      setCreateOpen(false);
                      return true;
                    } catch (error) {
                      publish({
                        tone: 'danger',
                        title: 'Create failed',
                        description:
                          error instanceof ApiHttpError
                            ? error.message
                            : 'Could not place legal hold.',
                      });
                      return false;
                    }
                  }}
                />
              ) : null}
            </Dialog>
          </div>
        }
      />

      {holds.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : holds.error ? (
        <ErrorState error={holds.error} onRetry={() => holds.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No legal holds"
          description={
            status === 'active'
              ? 'No active legal holds. Place one to prevent data purge for a user.'
              : 'No holds match this filter.'
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((hold) => (
            <li key={hold.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldAlert className="size-4 text-(--color-text-muted)" aria-hidden />
                        <code className="text-sm">{hold.userId}</code>
                        <Badge tone={hold.releasedAt ? 'neutral' : 'warning'}>
                          {hold.releasedAt ? 'released' : 'active'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{hold.reason}</CardDescription>
                      <p className="mt-1 text-xs text-(--color-text-muted)">
                        Placed {formatDateTime(hold.createdAt)}
                        {hold.releasedAt ? (
                          <> · Released {formatDateTime(hold.releasedAt)}</>
                        ) : null}
                      </p>
                    </div>
                    {!hold.releasedAt ? (
                      <Button
                        intent="secondary"
                        size="sm"
                        onClick={() => handleRelease(hold)}
                        disabled={release.isPending}
                      >
                        Release
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CreateLegalHoldDialog({
  busy,
  onCancel,
  onCreate,
}: {
  busy: boolean;
  onCancel: () => void;
  onCreate: (input: CreateLegalHoldInput) => Promise<boolean>;
}) {
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ userId?: string; reason?: string }>({});

  const submit = async () => {
    const next: typeof errors = {};
    const trimmedUserId = userId.trim();
    if (!ULID_REGEX.test(trimmedUserId)) {
      next.userId = 'Must be a valid ULID (26 chars, Crockford base32).';
    }
    if (reason.trim() === '') {
      next.reason = 'Reason is required.';
    } else if (reason.trim().length > 1000) {
      next.reason = 'Reason must be 1000 characters or fewer.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const ok = await onCreate({ userId: trimmedUserId, reason: reason.trim() });
    if (ok) {
      setUserId('');
      setReason('');
      setErrors({});
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Place legal hold</DialogTitle>
        <DialogDescription>
          The user&apos;s records will be excluded from retention-policy purges until the hold is
          released.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        <div>
          <Label htmlFor="hold-userId">User ID</Label>
          <Input
            id="hold-userId"
            value={userId}
            placeholder="01J9QW7B6N5W2YH3D3A1V0KEF2"
            aria-invalid={Boolean(errors.userId)}
            aria-describedby={errors.userId ? 'hold-userId-error' : undefined}
            onChange={(e) => {
              setUserId(e.target.value);
              setErrors((prev) => ({ ...prev, userId: undefined }));
            }}
          />
          {errors.userId ? (
            <p id="hold-userId-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.userId}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="hold-reason">Reason</Label>
          <Textarea
            id="hold-reason"
            rows={3}
            value={reason}
            placeholder="Active grade appeal retention"
            aria-invalid={Boolean(errors.reason)}
            aria-describedby={errors.reason ? 'hold-reason-error' : undefined}
            onChange={(e) => {
              setReason(e.target.value);
              setErrors((prev) => ({ ...prev, reason: undefined }));
            }}
          />
          {errors.reason ? (
            <p id="hold-reason-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.reason}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button intent="secondary" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button intent="primary" size="sm" onClick={submit} disabled={busy}>
            {busy ? 'Placing…' : 'Place hold'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
