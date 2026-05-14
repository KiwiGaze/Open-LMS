'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  pickCurrentConsent,
  useMyConsentsQuery,
  useRecordMyConsentMutation,
} from '@/lib/api/queries/consents.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { ConsentActionType } from '@openlms/contracts';
import { ShieldCheck } from 'lucide-react';

type ConsentRow = {
  actionType: ConsentActionType;
  title: string;
  description: string;
};

const CONSENT_ROWS: ConsentRow[] = [
  {
    actionType: 'ai_analysis',
    title: 'AI analysis of my work',
    description:
      'Lets staff request AI feedback drafts, prechecks, and explanations on your assignments and pages.',
  },
  {
    actionType: 'automated_profiling',
    title: 'Automated profiling',
    description: 'Allows AI to summarize patterns across your submissions for staff trend cards.',
  },
  {
    actionType: 'third_party_provider',
    title: 'Third-party AI provider',
    description:
      'Allows your content to be sent to the AI provider configured by your institution for processing.',
  },
  {
    actionType: 'cohort_signal_contribution',
    title: 'Cohort signals',
    description:
      'Allows anonymized signals from your submissions to be aggregated into class-level trend reports.',
  },
  {
    actionType: 'live_draft_analysis',
    title: 'Live draft analysis',
    description:
      'Allows AI to scan your draft in real time (as you type) for proactive suggestions.',
  },
];

export default function AccountConsentsPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const consents = useMyConsentsQuery(tenantId);
  const record = useRecordMyConsentMutation(tenantId);
  const { publish } = useToast();

  if (!tenantId) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-(--color-text-muted)">
          Select a tenant from the navigation to manage your consents.
        </CardContent>
      </Card>
    );
  }
  if (consents.isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }
  if (consents.error) {
    return <ErrorState error={consents.error} onRetry={() => consents.refetch()} />;
  }

  const handleToggle = async (actionType: ConsentActionType, next: boolean) => {
    try {
      await record.mutateAsync({
        actionType,
        scope: 'tenant',
        scopeId: tenantId,
        state: next ? 'granted' : 'revoked',
      });
      publish({
        tone: 'success',
        title: next ? 'Consent granted' : 'Consent revoked',
        durationMs: 1500,
      });
    } catch (error) {
      publish({
        tone: 'danger',
        title: 'Could not save consent',
        description: error instanceof ApiHttpError ? error.message : 'Try again in a moment.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Account"
        title="AI consents"
        description="Control which AI features can run against your work. You can change these at any time."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-(--color-text-muted)" aria-hidden /> Per-action
            controls
          </CardTitle>
          <CardDescription>
            Toggles apply to the entire tenant. The most recent toggle wins; previous decisions are
            kept as an audit history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y divide-(--color-border-subtle)">
            {CONSENT_ROWS.map((row) => {
              const current = pickCurrentConsent(consents.data, row.actionType, 'tenant', tenantId);
              const isGranted = current?.state === 'granted';
              const lastChanged = current?.updatedAt ?? null;
              return (
                <li key={row.actionType} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-(--color-text-default)">{row.title}</p>
                    <p className="mt-0.5 text-xs text-(--color-text-muted)">{row.description}</p>
                    {current ? (
                      <p className="mt-1 text-xs text-(--color-text-muted)">
                        <Badge tone={isGranted ? 'success' : 'neutral'} className="mr-2">
                          {current.state}
                        </Badge>
                        Last changed {lastChanged ? formatDateTime(lastChanged) : '—'}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-(--color-text-muted)">
                        <Badge tone="warning" className="mr-2">
                          not recorded
                        </Badge>
                        Toggle to record your decision.
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={isGranted}
                    onCheckedChange={(next) => handleToggle(row.actionType, next)}
                    disabled={record.isPending}
                    aria-label={row.title}
                  />
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
