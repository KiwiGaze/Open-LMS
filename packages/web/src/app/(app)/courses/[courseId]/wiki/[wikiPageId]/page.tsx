'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useWikiPageQuery } from '@/lib/api/queries/wiki.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string; wikiPageId: string };

export default function WikiPageDetail({ params }: { params: Promise<Params> }) {
  const { courseId, wikiPageId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const page = useWikiPageQuery(tenantId, courseId, wikiPageId);

  if (page.isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }
  if (page.error) {
    return <ErrorState error={page.error} onRetry={() => page.refetch()} />;
  }
  if (!page.data) return null;

  const wikiPage = page.data;

  return (
    <div className="flex flex-col gap-6">
      <Button asChild intent="secondary" size="sm" className="w-fit">
        <Link href={`/courses/${courseId}/wiki`}>
          <ArrowLeft className="size-3.5" aria-hidden /> Back to wiki
        </Link>
      </Button>
      <PageHeader
        eyebrow="Wiki page"
        title={wikiPage.title}
        description={`Slug: ${wikiPage.slug}`}
        actions={
          <Badge
            tone={
              wikiPage.status === 'published'
                ? 'success'
                : wikiPage.status === 'draft'
                  ? 'warning'
                  : 'outline'
            }
          >
            {wikiPage.status}
          </Badge>
        }
      />
      <Card>
        <CardContent className="p-6">
          <article className="prose prose-sm max-w-none whitespace-pre-wrap text-(--color-text-default)">
            <BookOpen className="float-right size-5 text-(--color-text-muted)" aria-hidden />
            {wikiPage.content}
          </article>
        </CardContent>
      </Card>
      <p className="text-xs text-(--color-text-muted)">
        Last edited {formatDateTime(wikiPage.updatedAt)}
      </p>
    </div>
  );
}
