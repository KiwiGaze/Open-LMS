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
import {
  useDeletedCoursesQuery,
  useRestoreDeletedCourseMutation,
} from '@/lib/api/queries/courses.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import { ArchiveRestore, Trash2 } from 'lucide-react';

export default function DeletedCoursesPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();
  const deleted = useDeletedCoursesQuery(tenantId);
  const restore = useRestoreDeletedCourseMutation(tenantId);

  const handleRestore = (courseId: string, title: string) => {
    restore.mutate(courseId, {
      onSuccess: () => {
        publish({ tone: 'success', title: `Restored ${title}` });
      },
      onError: (error) => {
        publish({
          tone: 'danger',
          title: 'Could not restore',
          description: error instanceof Error ? error.message : undefined,
        });
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="Deleted courses"
        description="Soft-deleted courses for this tenant. Restoring brings a course back to draft status."
      />

      {deleted.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : deleted.error ? (
        <ErrorState error={deleted.error} onRetry={() => deleted.refetch()} />
      ) : (deleted.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Trash2}
          title="No deleted courses"
          description="Courses you remove from the catalog will appear here for recovery."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {deleted.data?.map((course) => (
            <li key={course.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base">
                        {course.code} · {course.title}
                      </CardTitle>
                      <CardDescription>
                        {course.deletedAt
                          ? `Deleted ${formatDateTime(course.deletedAt)}`
                          : 'Deleted'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="outline">{course.status}</Badge>
                      <Button
                        intent="secondary"
                        size="sm"
                        onClick={() => handleRestore(course.id, course.title)}
                        disabled={restore.isPending}
                      >
                        <ArchiveRestore className="size-3.5" aria-hidden /> Restore
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-(--color-text-muted)">
                  {course.academicTerm ? <span>{course.academicTerm}</span> : <span>—</span>}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
