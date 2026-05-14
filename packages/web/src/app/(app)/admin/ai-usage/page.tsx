'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { KpiCard } from '@/components/patterns/kpi-card.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useProviderConfigQuery } from '@/lib/api/queries/provider-configs.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatNumber } from '@/lib/format.ts';
import type { AiUsageByAction, AiUsageByActor, AiUsageSummary } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

type Range = '7' | '30' | '90';

export default function AiUsagePage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const [range, setRange] = useState<Range>('30');

  const { from, to } = useMemo(() => {
    const t = new Date();
    const f = new Date();
    f.setDate(f.getDate() - Number(range));
    return { from: f, to: t };
  }, [range]);

  const summary = useQuery({
    queryKey: tenantId ? [...queryKeys.aiUsageSummary(tenantId), range] : ['usage', 'inactive'],
    queryFn: () =>
      apiFetch<AiUsageSummary>(`/tenants/${tenantId}/ai/usage-summary`, {
        query: { from: from.toISOString(), to: to.toISOString() },
      }),
    enabled: Boolean(tenantId),
  });

  const byAction = useQuery({
    queryKey: tenantId
      ? [...queryKeys.aiUsageByAction(tenantId), range]
      : ['usage-actions', 'inactive'],
    queryFn: () =>
      apiFetch<AiUsageByAction[]>(`/tenants/${tenantId}/ai/usage-by-action`, {
        query: { from: from.toISOString(), to: to.toISOString() },
      }),
    enabled: Boolean(tenantId),
  });

  const byActor = useQuery({
    queryKey: tenantId
      ? [...queryKeys.aiUsageByActor(tenantId), range]
      : ['usage-actors', 'inactive'],
    queryFn: () =>
      apiFetch<AiUsageByActor[]>(`/tenants/${tenantId}/ai/usage-by-actor`, {
        query: { from: from.toISOString(), to: to.toISOString() },
      }),
    enabled: Boolean(tenantId),
  });

  const providerConfig = useProviderConfigQuery(tenantId);
  const quotaPeriod = providerConfig.data?.quota.period ?? null;
  const quotaWindow = useMemo(() => {
    if (!quotaPeriod) return null;
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    if (quotaPeriod === 'week') {
      const day = start.getDay();
      const diff = (day + 6) % 7;
      start.setDate(start.getDate() - diff);
    } else if (quotaPeriod === 'month') {
      start.setDate(1);
    }
    return { from: start, to: now };
  }, [quotaPeriod]);

  const quotaUsage = useQuery({
    queryKey:
      tenantId && quotaWindow
        ? [...queryKeys.aiUsageSummary(tenantId), 'quota', quotaPeriod]
        : ['usage-quota', 'inactive'],
    queryFn: () => {
      if (!tenantId || !quotaWindow) {
        return Promise.reject(new Error('Cannot fetch quota usage without an active tenant.'));
      }
      return apiFetch<AiUsageSummary>(`/tenants/${tenantId}/ai/usage-summary`, {
        query: {
          from: quotaWindow.from.toISOString(),
          to: quotaWindow.to.toISOString(),
        },
      });
    },
    enabled: Boolean(tenantId && quotaWindow),
  });

  const quotaTokens =
    (quotaUsage.data?.totalInputTokens ?? 0) + (quotaUsage.data?.totalOutputTokens ?? 0);
  const hardCap = providerConfig.data?.quota.hardCapTokensPerPeriod ?? null;
  const softWarn = providerConfig.data?.quota.softWarnTokensPerPeriod ?? null;
  const hardCapPct = hardCap ? Math.min(1, quotaTokens / hardCap) : null;
  const softWarnExceeded = softWarn !== null && quotaTokens >= softWarn;
  const hardCapExceeded = hardCap !== null && quotaTokens >= hardCap;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="AI usage"
        description="Tokens, generations, and costs by action."
        actions={
          <Select value={range} onValueChange={(v) => setRange(v as Range)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {summary.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : summary.error ? (
        <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
      ) : summary.data ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Calls" value={formatNumber(summary.data.totalCalls)} icon={Sparkles} />
          <KpiCard
            label="Input tokens"
            value={formatNumber(summary.data.totalInputTokens)}
            icon={Sparkles}
          />
          <KpiCard
            label="Output tokens"
            value={formatNumber(summary.data.totalOutputTokens)}
            icon={Sparkles}
          />
          <KpiCard
            label="Estimated cost"
            value={`$${(summary.data.estimatedCostCents / 100).toFixed(2)}`}
            icon={Sparkles}
            hint={
              summary.data.fallbackCount > 0 ? `${summary.data.fallbackCount} fallbacks` : undefined
            }
          />
        </section>
      ) : null}

      {quotaUsage.data && hardCap !== null ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle>Token quota</CardTitle>
            <span className="text-xs text-(--color-text-muted)">
              per {providerConfig.data?.quota.period ?? 'period'}
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {hardCapExceeded || softWarnExceeded ? (
              <div
                role="note"
                className="flex items-start gap-3 rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-danger-50) p-3 text-sm text-(--color-danger-700)"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div>
                  <p className="font-medium">
                    {hardCapExceeded
                      ? 'Hard cap reached — AI calls will be blocked.'
                      : 'Soft-warn threshold reached.'}
                  </p>
                  <p className="mt-0.5 text-(--color-text-muted)">
                    Current period usage is {formatNumber(quotaTokens)} of {formatNumber(hardCap)}{' '}
                    tokens.
                  </p>
                </div>
              </div>
            ) : null}
            <div>
              <div className="flex items-center justify-between text-xs text-(--color-text-muted)">
                <span>
                  {formatNumber(quotaTokens)} / {formatNumber(hardCap)} tokens
                </span>
                <span className="tabular-nums">
                  {hardCapPct !== null ? `${(hardCapPct * 100).toFixed(0)}%` : ''}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-(--color-surface-muted)">
                <div
                  className={
                    hardCapExceeded
                      ? 'h-full bg-(--color-danger-700)'
                      : softWarnExceeded
                        ? 'h-full bg-(--color-danger-200)'
                        : 'h-full bg-(--color-brand)'
                  }
                  style={{ width: `${(hardCapPct ?? 0) * 100}%` }}
                />
              </div>
              {softWarn !== null ? (
                <p className="mt-1 text-xs text-(--color-text-muted)">
                  Soft warn at {formatNumber(softWarn)} tokens
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : providerConfig.error instanceof ApiHttpError && providerConfig.error.status === 404 ? (
        <Card>
          <CardContent className="py-4 text-sm text-(--color-text-muted)">
            Configure a provider in Admin → AI providers to see quota usage and warnings.
          </CardContent>
        </Card>
      ) : providerConfig.error ? (
        <ErrorState error={providerConfig.error} onRetry={() => providerConfig.refetch()} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>By actor</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {byActor.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : byActor.error ? (
            <ErrorState error={byActor.error} onRetry={() => byActor.refetch()} />
          ) : (byActor.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No usage yet"
              description="Per-user consumption will appear here when AI actions run."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead style={{ width: 110, textAlign: 'right' }}>Calls</TableHead>
                  <TableHead style={{ width: 130, textAlign: 'right' }}>Input tokens</TableHead>
                  <TableHead style={{ width: 130, textAlign: 'right' }}>Output tokens</TableHead>
                  <TableHead style={{ width: 110, textAlign: 'right' }}>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byActor.data?.map((row, index) => (
                  <TableRow key={row.actorUserId ?? `anonymous-${index}`}>
                    <TableCell>
                      {row.actorName || row.actorEmail ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-(--color-text-default)">
                            {row.actorName ?? row.actorEmail}
                          </span>
                          {row.actorName && row.actorEmail ? (
                            <span className="text-xs text-(--color-text-muted)">
                              {row.actorEmail}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-sm text-(--color-text-muted)">
                          Anonymous / system
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.callCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.totalInputTokens)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.totalOutputTokens)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${(row.estimatedCostCents / 100).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By action</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {byAction.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : byAction.error ? (
            <ErrorState error={byAction.error} onRetry={() => byAction.refetch()} />
          ) : (byAction.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No usage yet"
              description="When AI actions run, totals will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead style={{ width: 110, textAlign: 'right' }}>Calls</TableHead>
                  <TableHead style={{ width: 130, textAlign: 'right' }}>Input tokens</TableHead>
                  <TableHead style={{ width: 130, textAlign: 'right' }}>Output tokens</TableHead>
                  <TableHead style={{ width: 110, textAlign: 'right' }}>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byAction.data?.map((row) => (
                  <TableRow key={row.actionIdentifier}>
                    <TableCell>
                      <Badge tone="brand">{row.actionIdentifier.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.callCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.totalInputTokens)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.totalOutputTokens)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${(row.estimatedCostCents / 100).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
