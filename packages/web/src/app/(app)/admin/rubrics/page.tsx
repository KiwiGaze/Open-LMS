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
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { useDeleteRubricMutation, useRubricsQuery } from '@/lib/api/queries/rubrics.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDate } from '@/lib/format.ts';
import { ListChecks, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminRubricsPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();
  const rubrics = useRubricsQuery(tenantId);
  const deleteRubric = useDeleteRubricMutation(tenantId);

  const handleDelete = (rubricId: string, title: string) => {
    if (!window.confirm(`Delete rubric "${title}"? Assignments referencing it lose the link.`))
      return;
    deleteRubric.mutate(rubricId, {
      onSuccess: () => publish({ tone: 'success', title: `Deleted ${title}` }),
      onError: (error) =>
        publish({
          tone: 'danger',
          title: 'Delete failed',
          description: error instanceof Error ? error.message : undefined,
        }),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="Rubrics"
        description="Tenant-wide rubric library used by assignments and graded discussions."
        actions={
          <Button asChild>
            <Link href="/admin/rubrics/new">
              <Plus className="size-4" aria-hidden /> New rubric
            </Link>
          </Button>
        }
      />

      {rubrics.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : rubrics.error ? (
        <ErrorState error={rubrics.error} onRetry={() => rubrics.refetch()} />
      ) : (rubrics.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No rubrics yet"
          description="Create one to score assignments and graded discussions consistently."
          action={
            <Button asChild>
              <Link href="/admin/rubrics/new">
                <Plus className="size-4" aria-hidden /> New rubric
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rubrics.data?.map((rubric) => (
            <li key={rubric.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base">{rubric.title}</CardTitle>
                      <CardDescription>
                        <code className="font-mono text-xs">{rubric.id.slice(-12)}</code> · Updated{' '}
                        {formatDate(rubric.updatedAt)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">{rubric.criteria.length} criteria</Badge>
                      <Button
                        intent="ghost"
                        size="icon-sm"
                        aria-label={`Delete rubric ${rubric.title}`}
                        onClick={() => handleDelete(rubric.id, rubric.title)}
                        disabled={deleteRubric.isPending}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-(--color-text-muted)">
                  Total points:{' '}
                  {rubric.criteria.reduce((sum, c) => sum + (c.levels[0]?.points ?? 0), 0)}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
