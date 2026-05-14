'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useCoursePageQuery } from '@/lib/api/queries/pages.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string; pageId: string };

export default function CoursePageDetailPage({ params }: { params: Promise<Params> }) {
  const { courseId, pageId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const page = useCoursePageQuery(tenantId, courseId, pageId);

  if (page.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (page.error) {
    return <ErrorState error={page.error} onRetry={() => page.refetch()} />;
  }
  if (!page.data) return null;

  const p = page.data;
  const visibilityTone =
    p.visibility === 'published' ? 'success' : p.visibility === 'archived' ? 'outline' : 'neutral';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Page"
        title={p.title}
        description={`Last updated ${formatDateTime(p.updatedAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={visibilityTone}>{p.visibility}</Badge>
            <Button asChild intent="secondary" size="sm">
              <Link href={`/courses/${courseId}/pages`}>
                <ArrowLeft className="size-3.5" aria-hidden /> Back
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/courses/${courseId}/pages/${pageId}/edit`}>
                <Pencil className="size-3.5" aria-hidden /> Edit
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-6">
          <article className="prose prose-sm max-w-none whitespace-pre-wrap text-(--color-text-default)">
            {p.body}
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
