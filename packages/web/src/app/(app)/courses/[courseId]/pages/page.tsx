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
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useCoursePagesQuery, useDeleteCoursePageMutation } from '@/lib/api/queries/pages.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatRelative } from '@/lib/format.ts';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string };

export default function CoursePagesPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const pages = useCoursePagesQuery(tenantId, courseId);
  const deletePage = useDeleteCoursePageMutation(tenantId, courseId);
  const { publish } = useToast();

  const handleDelete = async (pageId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deletePage.mutateAsync(pageId);
      publish({ tone: 'success', title: 'Page deleted', description: title });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not delete. Try again.';
      publish({ tone: 'danger', title: 'Delete failed', description: message });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-(--color-text-muted)">
          Reference pages, readings, and instructor notes.
        </p>
        <Button asChild>
          <Link href={`/courses/${courseId}/pages/new`}>
            <Plus className="size-4" aria-hidden /> New page
          </Link>
        </Button>
      </div>

      {pages.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`p-skel-${i}`} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : pages.error ? (
        <ErrorState error={pages.error} onRetry={() => pages.refetch()} />
      ) : (pages.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No pages yet"
          description="Pages let you publish readings, FAQs, and reference content."
          action={
            <Button asChild>
              <Link href={`/courses/${courseId}/pages/new`}>
                <Plus className="size-4" aria-hidden /> New page
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pages.data?.map((page) => (
            <Card key={page.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/courses/${courseId}/pages/${page.id}`}
                    className="hover:text-(--color-text-link)"
                  >
                    <CardTitle className="text-base">{page.title}</CardTitle>
                  </Link>
                  <Badge
                    tone={
                      page.visibility === 'published'
                        ? 'success'
                        : page.visibility === 'archived'
                          ? 'outline'
                          : 'neutral'
                    }
                  >
                    {page.visibility}
                  </Badge>
                </div>
                <CardDescription>Updated {formatRelative(page.updatedAt)}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-end gap-1 pt-0">
                <Button asChild intent="ghost" size="icon-sm" aria-label={`Edit ${page.title}`}>
                  <Link href={`/courses/${courseId}/pages/${page.id}/edit`}>
                    <Pencil className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button
                  intent="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${page.title}`}
                  onClick={() => handleDelete(page.id, page.title)}
                  disabled={deletePage.isPending}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
