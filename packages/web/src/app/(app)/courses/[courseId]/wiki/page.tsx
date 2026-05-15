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
import { useWikiPagesQuery } from '@/lib/api/queries/wiki.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string };

export default function CourseWikiPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const pages = useWikiPagesQuery(tenantId, courseId);

  if (pages.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (pages.error) {
    return <ErrorState error={pages.error} onRetry={() => pages.refetch()} />;
  }

  const items = pages.data ?? [];
  const published = items.filter((page) => page.status === 'published');
  const drafts = items.filter((page) => page.status === 'draft');
  const archived = items.filter((page) => page.status === 'archived');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Wiki"
        title="Course wiki"
        description="Collaboratively authored pages. Published pages are visible to all course members; drafts and archived pages are staff-only."
      />
      {items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No wiki pages yet"
          description="Pages created in the wiki will appear here."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {[
            { label: 'Published', pages: published, tone: 'success' as const },
            { label: 'Drafts', pages: drafts, tone: 'warning' as const },
            { label: 'Archived', pages: archived, tone: 'outline' as const },
          ]
            .filter((section) => section.pages.length > 0)
            .map((section) => (
              <section key={section.label}>
                <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-(--color-text-muted)">
                  {section.label}
                </h2>
                <ul className="flex flex-col gap-2">
                  {section.pages.map((page) => (
                    <li key={page.id}>
                      <Card>
                        <Link href={`/courses/${courseId}/wiki/${page.id}`}>
                          <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                  <BookOpen
                                    className="size-4 text-(--color-text-muted)"
                                    aria-hidden
                                  />
                                  {page.title}
                                </CardTitle>
                                <CardDescription>
                                  <code className="text-xs">{page.slug}</code> · Last edited{' '}
                                  {formatDateTime(page.updatedAt)}
                                </CardDescription>
                              </div>
                              <Badge tone={section.tone}>{page.status}</Badge>
                            </div>
                          </CardHeader>
                        </Link>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
