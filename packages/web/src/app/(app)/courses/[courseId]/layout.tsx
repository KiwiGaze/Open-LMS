'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { CourseTabs } from '@/components/shell/course-tabs.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useCourseQuery } from '@/lib/api/queries/courses.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { use } from 'react';

type Params = { courseId: string };

export default function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const course = useCourseQuery(tenantId, courseId);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        {course.isLoading ? (
          <>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-40" />
          </>
        ) : course.error ? (
          <ErrorState error={course.error} onRetry={() => course.refetch()} />
        ) : course.data ? (
          <>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-(--color-text-muted)">
                {course.data.code}
              </p>
              <Badge
                tone={
                  course.data.status === 'active'
                    ? 'success'
                    : course.data.status === 'archived'
                      ? 'outline'
                      : 'neutral'
                }
              >
                {course.data.status}
              </Badge>
              {course.data.isBlueprint ? <Badge tone="brand">Blueprint</Badge> : null}
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-(--color-text-default)">
              {course.data.title}
            </h1>
            <p className="text-sm text-(--color-text-muted)">
              {[course.data.academicTerm, course.data.catalogCategory].filter(Boolean).join(' · ')}
            </p>
          </>
        ) : null}
      </header>
      <CourseTabs courseId={courseId} />
      <div>{children}</div>
    </div>
  );
}
