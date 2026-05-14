'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
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
import { apiFetch } from '@/lib/api/client.ts';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime, formatNumber } from '@/lib/format.ts';
import type { ProviderConfigSummary } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';

export default function AdminProvidersPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const provider = useQuery({
    queryKey: tenantId ? queryKeys.providerConfig(tenantId) : ['provider', 'inactive'],
    queryFn: async () => {
      try {
        return await apiFetch<ProviderConfigSummary>(`/tenants/${tenantId}/provider-config`);
      } catch (error) {
        if (error instanceof ApiHttpError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: Boolean(tenantId),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="AI providers"
        description="Configure your tenant's AI provider, models, and quota."
      />

      {provider.isLoading ? (
        <Skeleton className="h-72 w-full rounded-[var(--radius-lg)]" />
      ) : provider.error ? (
        <ErrorState error={provider.error} onRetry={() => provider.refetch()} />
      ) : !provider.data ? (
        <EmptyState
          icon={Sparkles}
          title="No provider configured"
          description="Add an AI provider configuration to enable feedback, prechecks, and summaries."
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="capitalize">
                  {provider.data.providerType.replace(/_/g, ' ')}
                </CardTitle>
                <CardDescription>
                  Last validated:{' '}
                  {provider.data.validatedAt ? formatDateTime(provider.data.validatedAt) : 'never'}
                </CardDescription>
              </div>
              <Badge
                tone={
                  provider.data.validationStatus === 'valid'
                    ? 'success'
                    : provider.data.validationStatus === 'invalid'
                      ? 'danger'
                      : 'warning'
                }
              >
                {provider.data.validationStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ['Precheck', provider.data.modelPreferences.precheckModel],
                ['Feedback draft', provider.data.modelPreferences.feedbackDraftModel],
                ['Trend card', provider.data.modelPreferences.trendCardModel],
                ['Rubric clarity', provider.data.modelPreferences.rubricClarityModel],
                ['Page explanation', provider.data.modelPreferences.pageExplanationModel],
                ['Embedding', provider.data.modelPreferences.embeddingModel],
                ['Rerank', provider.data.modelPreferences.rerankModel],
              ] as const
            )
              .filter(([, model]) => Boolean(model))
              .map(([label, model]) => (
                <div key={label}>
                  <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-(--color-text-default)">{model}</p>
                </div>
              ))}
            <div>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                Soft quota
              </p>
              <p className="mt-1 text-sm font-medium text-(--color-text-default)">
                {provider.data.quota.softWarnTokensPerPeriod
                  ? `${formatNumber(provider.data.quota.softWarnTokensPerPeriod)} tokens / ${provider.data.quota.period}`
                  : 'No soft cap'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                Hard quota
              </p>
              <p className="mt-1 text-sm font-medium text-(--color-text-default)">
                {provider.data.quota.hardCapTokensPerPeriod
                  ? `${formatNumber(provider.data.quota.hardCapTokensPerPeriod)} tokens / ${provider.data.quota.period}`
                  : 'No hard cap'}
              </p>
            </div>
            {provider.data.validationError ? (
              <div className="sm:col-span-2 rounded-[var(--radius-md)] border border-(--color-danger-200) bg-(--color-danger-50) p-3 text-sm text-(--color-danger-700)">
                {provider.data.validationError}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
