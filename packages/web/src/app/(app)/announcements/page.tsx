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
import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useCoursesQuery } from '@/lib/api/queries/courses.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatRelative } from '@/lib/format.ts';
import type { Course, CourseAnnouncement } from '@openlms/contracts';
import { useQueries } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

export default function TenantAnnouncementsPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const courses = useCoursesQuery(tenantId);

  const announcements = useQueries({
    queries: (courses.data ?? []).map((course: Course) => ({
      queryKey: queryKeys.courseAnnouncements(tenantId ?? '', course.id),
      queryFn: () =>
        apiFetch<CourseAnnouncement[]>(`/tenants/${tenantId}/courses/${course.id}/announcements`),
      enabled: Boolean(tenantId),
    })),
  });

  const all = useMemo(() => {
    return announcements
      .flatMap((res, idx) => {
        const course = courses.data?.[idx];
        if (!course || !res.data) return [];
        return res.data.filter((a) => a.status === 'published').map((a) => ({ a, course }));
      })
      .sort((a, b) => {
        const ad = a.a.postedAt ? new Date(a.a.postedAt).getTime() : 0;
        const bd = b.a.postedAt ? new Date(b.a.postedAt).getTime() : 0;
        return bd - ad;
      });
  }, [courses.data, announcements]);

  const isLoading = courses.isLoading || announcements.some((q) => q.isLoading);
  const firstError = courses.error ?? announcements.find((q) => q.error)?.error;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Announcements" description="Published updates across all your courses." />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`ann-feed-${i}`} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : firstError ? (
        <ErrorState
          error={firstError}
          onRetry={() => {
            if (courses.error) void courses.refetch();
            for (const q of announcements) {
              if (q.error) void q.refetch();
            }
          }}
        />
      ) : all.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No announcements"
          description="When your instructors post updates, they'll show up here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {all.map(({ a, course }) => (
            <li key={a.id}>
              <Link href={`/courses/${course.id}/announcements`} className="group">
                <Card className="transition-shadow group-hover:shadow-(--shadow-sm)">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base group-hover:text-(--color-text-link)">
                        {a.title}
                      </CardTitle>
                      <Badge tone="brand">{course.code}</Badge>
                    </div>
                    <CardDescription>
                      {a.postedAt ? formatRelative(a.postedAt) : 'Draft'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-(--color-text-default) line-clamp-3">
                    {a.body}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
