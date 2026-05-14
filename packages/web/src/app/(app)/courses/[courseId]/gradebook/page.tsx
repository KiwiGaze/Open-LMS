'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
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
import { formatDate, formatNumber, formatPercent } from '@/lib/format.ts';
import type { GradebookEntry } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Download } from 'lucide-react';
import { use } from 'react';

type Params = { courseId: string };

export default function GradebookPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);

  const entries = useQuery({
    queryKey: tenantId ? queryKeys.gradebook(tenantId, courseId) : ['gradebook', 'inactive'],
    queryFn: () => apiFetch<GradebookEntry[]>(`/tenants/${tenantId}/courses/${courseId}/gradebook`),
    enabled: Boolean(tenantId),
  });

  const groupedByCategory = (entries.data ?? []).reduce<Record<string, GradebookEntry[]>>(
    (acc, entry) => {
      const key = entry.gradebookCategoryName ?? '__uncategorized';
      const list = acc[key] ?? [];
      list.push(entry);
      acc[key] = list;
      return acc;
    },
    {},
  );

  const totals = (entries.data ?? []).reduce(
    (acc, entry) => {
      acc.earned += entry.score;
      acc.possible += entry.maxScore;
      return acc;
    },
    { earned: 0, possible: 0 },
  );
  const totalPercent = totals.possible === 0 ? 0 : totals.earned / totals.possible;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-(--color-text-default)">
            Gradebook
          </h2>
          <p className="text-sm text-(--color-text-muted)">
            All graded work in this course, organised by category.
          </p>
        </div>
        <Button intent="secondary" size="sm" asChild>
          <a href={`/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/export`} download>
            <Download className="size-4" aria-hidden /> Export CSV
          </a>
        </Button>
      </div>

      {entries.isLoading ? (
        <Skeleton className="h-72 w-full rounded-[var(--radius-lg)]" />
      ) : entries.error ? (
        <ErrorState error={entries.error} onRetry={() => entries.refetch()} />
      ) : (entries.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No grades yet"
          description="Once submissions are graded, they will appear here."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Course average</CardTitle>
              <CardDescription>Across all graded items.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-3">
                <p className="font-display text-3xl font-semibold tabular-nums text-(--color-text-default)">
                  {formatPercent(totalPercent)}
                </p>
                <p className="text-sm text-(--color-text-muted)">
                  {formatNumber(totals.earned, 1)} / {formatNumber(totals.possible, 1)} pts
                </p>
              </div>
            </CardContent>
          </Card>
          {Object.entries(groupedByCategory).map(([categoryName, list]) => (
            <Card key={categoryName}>
              <CardHeader>
                <CardTitle>
                  {categoryName === '__uncategorized' ? 'Uncategorized' : categoryName}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead style={{ width: 120 }}>Due</TableHead>
                      <TableHead style={{ width: 130 }}>Status</TableHead>
                      <TableHead style={{ width: 80, textAlign: 'right' }}>Score</TableHead>
                      <TableHead style={{ width: 80, textAlign: 'right' }}>Max</TableHead>
                      <TableHead style={{ width: 80, textAlign: 'right' }}>%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <span className="font-medium text-(--color-text-default)">
                            {entry.assignmentTitle}
                          </span>
                          {entry.assignmentExtraCredit ? (
                            <Badge tone="brand" className="ml-2">
                              Extra credit
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-(--color-text-muted)">
                          {entry.assignmentDueAt ? formatDate(entry.assignmentDueAt) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            tone={
                              entry.gradeStatus === 'published'
                                ? 'success'
                                : entry.gradeStatus === 'appealed'
                                  ? 'warning'
                                  : entry.gradeStatus === 'locked'
                                    ? 'outline'
                                    : 'neutral'
                            }
                          >
                            {entry.gradeStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(entry.score, 1)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(entry.maxScore, 1)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPercent(entry.score / entry.maxScore)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
