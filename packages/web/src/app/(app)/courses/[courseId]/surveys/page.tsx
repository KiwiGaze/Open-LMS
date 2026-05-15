'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useSurveysQuery } from '@/lib/api/queries/surveys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string };

export default function CourseSurveysPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const surveys = useSurveysQuery(tenantId, courseId);

  if (surveys.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (surveys.error) {
    return <ErrorState error={surveys.error} onRetry={() => surveys.refetch()} />;
  }

  const items = surveys.data ?? [];
  const published = items.filter((survey) => survey.status === 'published');
  const drafts = items.filter((survey) => survey.status === 'draft');
  const archived = items.filter((survey) => survey.status === 'archived');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Surveys"
        title="Course surveys"
        description="Collect structured feedback from learners. Published surveys are visible to enrolled students; drafts and archived surveys are staff-only."
      />
      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No surveys yet"
          description="Surveys created for this course will appear here."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {[
            { label: 'Published', surveys: published, tone: 'success' as const },
            { label: 'Drafts', surveys: drafts, tone: 'warning' as const },
            { label: 'Archived', surveys: archived, tone: 'outline' as const },
          ]
            .filter((section) => section.surveys.length > 0)
            .map((section) => (
              <section key={section.label}>
                <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-(--color-text-muted)">
                  {section.label}
                </h2>
                <ul className="flex flex-col gap-2">
                  {section.surveys.map((survey) => (
                    <li key={survey.id}>
                      <Card>
                        <Link href={`/courses/${courseId}/surveys/${survey.id}`}>
                          <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                  <ClipboardList
                                    className="size-4 text-(--color-text-muted)"
                                    aria-hidden
                                  />
                                  {survey.title}
                                </CardTitle>
                                <CardDescription>
                                  {survey.description ?? 'No description'} · Updated{' '}
                                  {formatDateTime(survey.updatedAt)}
                                </CardDescription>
                              </div>
                              <Badge tone={section.tone}>{survey.status}</Badge>
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
