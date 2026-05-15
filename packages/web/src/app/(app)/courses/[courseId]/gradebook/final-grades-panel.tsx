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
import { useToast } from '@/components/ui/toast.tsx';
import {
  useCourseFinalGradesQuery,
  useExportCourseFinalGradesCsvMutation,
} from '@/lib/api/queries/gradebook.ts';
import { formatNumber, formatPercent } from '@/lib/format.ts';
import { Award, Download } from 'lucide-react';

export function FinalGradesPanel({
  tenantId,
  courseId,
}: {
  tenantId: string | null;
  courseId: string;
}) {
  const { publish } = useToast();
  const finals = useCourseFinalGradesQuery(tenantId, courseId);
  const exportCsv = useExportCourseFinalGradesCsvMutation(tenantId, courseId);

  const handleExport = () => {
    const date = new Date().toISOString().slice(0, 10);
    exportCsv.mutate(`course-${courseId}-final-grades-${date}.csv`, {
      onError: (error) =>
        publish({
          tone: 'danger',
          title: 'Export failed',
          description: error instanceof Error ? error.message : undefined,
        }),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Final grades</CardTitle>
            <CardDescription>
              Computed using category weights, drop-lowest rules, and the active grading scheme.
            </CardDescription>
          </div>
          <Button
            intent="secondary"
            size="sm"
            onClick={handleExport}
            disabled={exportCsv.isPending || finals.data?.length === 0}
            loading={exportCsv.isPending}
          >
            <Download className="size-4" aria-hidden /> Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {finals.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : finals.error ? (
          <ErrorState error={finals.error} onRetry={() => finals.refetch()} />
        ) : (finals.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Award}
            title="No final grades yet"
            description="Final grades will appear once students have published grades for the course."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-(--color-border-subtle)">
            {(finals.data ?? [])
              .slice()
              .sort((a, b) => b.percent - a.percent)
              .map((row) => (
                <li key={row.studentId} className="flex items-center justify-between gap-3 py-2">
                  <code className="font-mono text-xs text-(--color-text-default)">
                    {row.studentId.slice(-12)}
                  </code>
                  <div className="flex items-center gap-3 text-sm tabular-nums">
                    <span className="text-(--color-text-muted)">
                      {formatNumber(row.score, 1)} / {formatNumber(row.maxScore, 1)}
                    </span>
                    <span className="font-medium text-(--color-text-default)">
                      {formatPercent(row.percent / 100)}
                    </span>
                    {row.letterGrade ? <Badge tone="brand">{row.letterGrade}</Badge> : null}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
