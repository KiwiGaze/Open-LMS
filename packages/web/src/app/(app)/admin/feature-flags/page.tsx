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
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useDeleteFeatureFlagMutation,
  useTenantFeatureFlagsQuery,
  useUpsertFeatureFlagMutation,
} from '@/lib/api/queries/feature-flags.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { TenantFeatureFlag } from '@openlms/contracts';
import { Flag, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function AdminFeatureFlagsPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const flags = useTenantFeatureFlagsQuery(tenantId);
  const upsert = useUpsertFeatureFlagMutation(tenantId);
  const remove = useDeleteFeatureFlagMutation(tenantId);
  const { publish } = useToast();
  const [createOpen, setCreateOpen] = useState(false);

  if (flags.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (flags.error) {
    return <ErrorState error={flags.error} onRetry={() => flags.refetch()} />;
  }

  const items = flags.data ?? [];

  const handleToggle = async (flag: TenantFeatureFlag, next: boolean) => {
    try {
      await upsert.mutateAsync({ key: flag.key, enabled: next, description: flag.description });
      publish({
        tone: 'success',
        title: next ? 'Flag enabled' : 'Flag disabled',
        durationMs: 1500,
      });
    } catch (error) {
      publish({
        tone: 'danger',
        title: 'Save failed',
        description: error instanceof ApiHttpError ? error.message : 'Could not update flag.',
      });
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await remove.mutateAsync(key);
      publish({ tone: 'success', title: 'Flag removed' });
    } catch (error) {
      publish({
        tone: 'danger',
        title: 'Delete failed',
        description: error instanceof ApiHttpError ? error.message : 'Could not delete flag.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="Feature flags"
        description="Toggle tenant-scoped feature flags. Each flag carries an optional description and an audit timestamp."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button intent="primary" size="sm">
                <Plus className="size-3.5" aria-hidden /> Add flag
              </Button>
            </DialogTrigger>
            <CreateFlagDialogContent
              onClose={() => setCreateOpen(false)}
              onCreate={async (key, description, enabled) => {
                try {
                  await upsert.mutateAsync({ key, description, enabled });
                  publish({ tone: 'success', title: 'Flag created' });
                  setCreateOpen(false);
                  return true;
                } catch (error) {
                  publish({
                    tone: 'danger',
                    title: 'Create failed',
                    description:
                      error instanceof ApiHttpError ? error.message : 'Could not create flag.',
                  });
                  return false;
                }
              }}
              busy={upsert.isPending}
            />
          </Dialog>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No feature flags"
          description="Add a flag to start ramping a feature for this tenant."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((flag) => (
            <li key={flag.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Flag className="size-4 text-(--color-text-muted)" aria-hidden />
                        <code className="text-sm">{flag.key}</code>
                        <Badge tone={flag.enabled ? 'success' : 'neutral'}>
                          {flag.enabled ? 'enabled' : 'disabled'}
                        </Badge>
                      </CardTitle>
                      {flag.description ? (
                        <CardDescription>{flag.description}</CardDescription>
                      ) : null}
                      <p className="mt-1 text-xs text-(--color-text-muted)">
                        Last changed {formatDateTime(flag.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={(next) => handleToggle(flag, next)}
                        disabled={upsert.isPending}
                        aria-label={flag.enabled ? `Disable ${flag.key}` : `Enable ${flag.key}`}
                      />
                      <Button
                        intent="danger"
                        size="sm"
                        onClick={() => handleDelete(flag.key)}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
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

function CreateFlagDialogContent({
  onClose,
  onCreate,
  busy,
}: {
  onClose: () => void;
  onCreate: (key: string, description: string | null, enabled: boolean) => Promise<boolean>;
  busy: boolean;
}) {
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [errors, setErrors] = useState<{ key?: string }>({});

  const submit = async () => {
    const trimmed = key.trim();
    if (!/^[a-z][a-z0-9_.:-]{1,79}$/.test(trimmed)) {
      setErrors({
        key: 'Use 2-80 lowercase letters, numbers, underscores, dots, colons, or hyphens.',
      });
      return;
    }
    const ok = await onCreate(
      trimmed,
      description.trim() === '' ? null : description.trim(),
      enabled,
    );
    if (ok) {
      setKey('');
      setDescription('');
      setEnabled(false);
      setErrors({});
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New feature flag</DialogTitle>
        <DialogDescription>
          Keys are lowercase identifiers (e.g. <code>ai.precheck.beta</code>). They are scoped to
          this tenant.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        <div>
          <Label htmlFor="flag-key">Key</Label>
          <Input
            id="flag-key"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setErrors((prev) => ({ ...prev, key: undefined }));
            }}
            placeholder="ai.precheck.beta"
          />
          {errors.key ? (
            <p className="mt-1 text-xs text-(--color-danger-700)">{errors.key}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="flag-description">Description (optional)</Label>
          <Textarea
            id="flag-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this flag control?"
          />
        </div>
        <label
          htmlFor="flag-enabled"
          className="flex items-center gap-2 text-sm text-(--color-text-default)"
        >
          <Switch id="flag-enabled" checked={enabled} onCheckedChange={setEnabled} />
          Enabled
        </label>
        <div className="flex items-center justify-end gap-2">
          <Button intent="secondary" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button intent="primary" size="sm" onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : 'Create'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
