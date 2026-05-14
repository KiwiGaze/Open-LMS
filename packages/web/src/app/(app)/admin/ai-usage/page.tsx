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
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatNumber } from '@/lib/format.ts';
import type { AiUsageByAction, AiUsageSummary } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
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
