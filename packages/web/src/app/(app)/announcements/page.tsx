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
import { useTenantAnnouncementsQuery } from '@/lib/api/queries/announcements.ts';
import { useCoursesQuery } from '@/lib/api/queries/courses.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatRelative } from '@/lib/format.ts';
import type { Course } from '@openlms/contracts';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

export default function TenantAnnouncementsPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const announcements = useTenantAnnouncementsQuery(tenantId);
  const courses = useCoursesQuery(tenantId);

  const coursesById = useMemo(() => {
    const map = new Map<string, Course>();
    for (const c of courses.data ?? []) map.set(c.id, c);
    return map;
  }, [courses.data]);

  const sorted = useMemo(() => {
    return (announcements.data ?? []).slice().sort((a, b) => {
      const ad = a.postedAt ? new Date(a.postedAt).getTime() : 0;
      const bd = b.postedAt ? new Date(b.postedAt).getTime() : 0;
      return bd - ad;
    });
  }, [announcements.data]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Announcements" description="Published updates across all your courses." />

      {announcements.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`ann-feed-${i}`} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : announcements.error ? (
        <ErrorState error={announcements.error} onRetry={() => announcements.refetch()} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No announcements"
          description="When your instructors post updates, they'll show up here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((a) => {
            const course = coursesById.get(a.courseId);
            return (
              <li key={a.id}>
                <Link href={`/courses/${a.courseId}/announcements`} className="group">
                  <Card className="transition-shadow group-hover:shadow-(--shadow-sm)">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base group-hover:text-(--color-text-link)">
                          {a.title}
                        </CardTitle>
                        {course ? <Badge tone="brand">{course.code}</Badge> : null}
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
