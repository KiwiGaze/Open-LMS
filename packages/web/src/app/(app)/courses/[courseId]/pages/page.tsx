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
import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Plus } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string };

type Page = {
  id: string;
  title: string;
  slug: string;
  visibility: 'draft' | 'published' | 'scheduled' | 'archived';
  updatedAt: string;
};

export default function CoursePagesPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);

  const pages = useQuery({
    queryKey: tenantId ? queryKeys.coursePages(tenantId, courseId) : ['pages', 'inactive'],
    queryFn: () => apiFetch<Page[]>(`/tenants/${tenantId}/courses/${courseId}/pages`),
    enabled: Boolean(tenantId),
  });

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
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pages.data?.map((page) => (
            <Card key={page.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{page.title}</CardTitle>
                  <Badge tone={page.visibility === 'published' ? 'success' : 'neutral'}>
                    {page.visibility}
                  </Badge>
                </div>
                <CardDescription>/{page.slug}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-(--color-text-subtle)" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
