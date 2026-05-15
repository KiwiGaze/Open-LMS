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
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useRetentionPoliciesQuery,
  useUpsertRetentionPolicyMutation,
} from '@/lib/api/queries/retention-policies.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime, formatNumber } from '@/lib/format.ts';
import type { RetentionPolicy, RetentionPolicyTargetType } from '@openlms/contracts';
import { Archive } from 'lucide-react';
import { useState } from 'react';

const KNOWN_TARGETS: Array<{
  type: RetentionPolicyTargetType;
  title: string;
  description: string;
}> = [
  {
    type: 'deleted_user',
    title: 'Deleted user records',
    description:
      'Days to retain anonymized user records after account deletion before final purge. Required by FERPA and GDPR retention policies.',
  },
];

export default function AdminRetentionPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const policies = useRetentionPoliciesQuery(tenantId);
  const upsert = useUpsertRetentionPolicyMutation(tenantId);

  if (policies.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (policies.error) {
    return <ErrorState error={policies.error} onRetry={() => policies.refetch()} />;
  }

  const byTarget = new Map<RetentionPolicyTargetType, RetentionPolicy>();
  for (const policy of policies.data ?? []) {
    byTarget.set(policy.targetType, policy);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="Retention policies"
        description="How long this tenant retains records of each type after they are deleted. Set the value to 0 to purge immediately."
      />
      <ul className="flex flex-col gap-3">
        {KNOWN_TARGETS.map((target) => (
          <li key={target.type}>
            <RetentionPolicyCard
              target={target}
              policy={byTarget.get(target.type) ?? null}
              busy={upsert.isPending}
              onSave={(retainDays) => upsert.mutateAsync({ targetType: target.type, retainDays })}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RetentionPolicyCard({
  target,
  policy,
  busy,
  onSave,
}: {
  target: { type: RetentionPolicyTargetType; title: string; description: string };
  policy: RetentionPolicy | null;
  busy: boolean;
  onSave: (retainDays: number) => Promise<RetentionPolicy>;
}) {
  const [value, setValue] = useState<string>(policy ? String(policy.retainDays) : '365');
  const [error, setError] = useState<string | null>(null);
  const { publish } = useToast();

  const submit = async () => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 3650) {
      setError('Must be an integer between 0 and 3650.');
      return;
    }
    setError(null);
    try {
      await onSave(parsed);
      publish({ tone: 'success', title: 'Retention policy saved' });
    } catch (e) {
      publish({
        tone: 'danger',
        title: 'Save failed',
        description: e instanceof ApiHttpError ? e.message : 'Could not save retention policy.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Archive className="size-4 text-(--color-text-muted)" aria-hidden />
              {target.title}
              {policy ? (
                <Badge tone="brand">{formatNumber(policy.retainDays)} days</Badge>
              ) : (
                <Badge tone="warning">not set</Badge>
              )}
            </CardTitle>
            <CardDescription>{target.description}</CardDescription>
            {policy ? (
              <p className="mt-1 text-xs text-(--color-text-muted)">
                Last changed {formatDateTime(policy.updatedAt)}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <div className="sm:max-w-40">
            <Label htmlFor={`retain-${target.type}`}>Retention days</Label>
            <Input
              id={`retain-${target.type}`}
              type="number"
              min={0}
              max={3650}
              step={1}
              value={value}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `retain-${target.type}-error` : undefined}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
            />
            {error ? (
              <p
                id={`retain-${target.type}-error`}
                className="mt-1 text-xs text-(--color-danger-700)"
              >
                {error}
              </p>
            ) : null}
          </div>
          <Button intent="primary" size="sm" onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
