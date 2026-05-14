'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { KpiCard } from '@/components/patterns/kpi-card.tsx';
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
import { ApiHttpError } from '@/lib/api/errors.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useCourseAnalyticsQuery } from '@/lib/api/queries/courses.ts';
import { useMyCourseMembershipsQuery } from '@/lib/api/queries/me.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatRelative } from '@/lib/format.ts';
import type { CourseAnnouncement, CourseSyllabus } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  BookOpen,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  FileText,
  GraduationCap,
  MessagesSquare,
} from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

const COURSE_STAFF_ROLES = new Set(['instructor', 'teaching_assistant', 'course_admin']);

type Params = { courseId: string };

export default function CourseHomePage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);

  const myCourseMemberships = useMyCourseMembershipsQuery();
  const isStaff =
    myCourseMemberships.data?.some(
      (m) => m.courseId === courseId && COURSE_STAFF_ROLES.has(m.role),
    ) ?? false;
  const analytics = useCourseAnalyticsQuery(tenantId, courseId, isStaff);

  const syllabus = useQuery<CourseSyllabus | null>({
    queryKey: ['courses', tenantId ?? '', courseId, 'syllabus'],
    queryFn: async () => {
      try {
        return await apiFetch<CourseSyllabus>(`/tenants/${tenantId}/courses/${courseId}/syllabus`);
      } catch (e) {
        if (e instanceof ApiHttpError && e.status === 404) return null;
        throw e;
      }
    },
    enabled: Boolean(tenantId),
  });

  const announcements = useQuery({
    queryKey: tenantId
      ? queryKeys.courseAnnouncements(tenantId, courseId)
      : ['course-announcements', 'inactive'],
    queryFn: () =>
      apiFetch<CourseAnnouncement[]>(`/tenants/${tenantId}/courses/${courseId}/announcements`),
    enabled: Boolean(tenantId),
  });

  return (
    <div className="flex flex-col gap-6">
      {isStaff ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Course analytics">
          <KpiCard
            label="Enrolled students"
            icon={GraduationCap}
            value={analytics.data?.enrolledStudents}
            loading={analytics.isLoading}
          />
          <KpiCard
            label="Assignments"
            icon={ClipboardList}
            value={analytics.data?.publishedAssignments}
            loading={analytics.isLoading}
          />
          <KpiCard
            label="Quizzes"
            icon={CheckSquare}
            value={analytics.data?.publishedQuizzes}
            loading={analytics.isLoading}
          />
          <KpiCard
            label="Discussions"
            icon={MessagesSquare}
            value={analytics.data?.publishedDiscussionTopics}
            loading={analytics.isLoading}
          />
          <KpiCard
            label="Submissions"
            icon={FileText}
            value={analytics.data?.totalSubmissions}
            loading={analytics.isLoading}
          />
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Syllabus</CardTitle>
            <CardDescription>Course overview and policies.</CardDescription>
          </CardHeader>
          <CardContent>
            {syllabus.isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ) : syllabus.error ? (
              <ErrorState error={syllabus.error} onRetry={() => syllabus.refetch()} />
            ) : !syllabus.data || !syllabus.data.body ? (
              <EmptyState
                icon={BookOpen}
                title="No syllabus yet"
                description="The instructor has not published a syllabus for this course."
              />
            ) : (
              <article className="prose prose-sm max-w-none whitespace-pre-wrap text-(--color-text-default)">
                {syllabus.data.body}
              </article>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Recent course updates.</CardDescription>
            </CardHeader>
            <CardContent>
              {announcements.isLoading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : announcements.error ? (
                <ErrorState error={announcements.error} onRetry={() => announcements.refetch()} />
              ) : (
                (() => {
                  const published =
                    announcements.data?.filter((a) => a.status === 'published') ?? [];
                  if (published.length === 0) {
                    return (
                      <EmptyState
                        icon={Bell}
                        title="No announcements"
                        description="When instructors post, they'll show up here."
                      />
                    );
                  }
                  return (
                    <ul className="flex flex-col gap-2">
                      {published.slice(0, 5).map((a) => (
                        <li
                          key={a.id}
                          className="rounded-[var(--radius-sm)] border border-(--color-border-subtle) p-3"
                        >
                          <p className="text-sm font-medium text-(--color-text-default)">
                            {a.title}
                          </p>
                          <p className="mt-0.5 text-xs text-(--color-text-muted)">
                            {a.postedAt ? formatRelative(a.postedAt) : 'Draft'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  );
                })()
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Jump to</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button intent="ghost" size="sm" className="justify-start" asChild>
                <Link href={`/courses/${courseId}/modules`}>
                  <BookOpen className="size-4" aria-hidden /> Modules
                </Link>
              </Button>
              <Button intent="ghost" size="sm" className="justify-start" asChild>
                <Link href={`/courses/${courseId}/assignments`}>
                  <CalendarClock className="size-4" aria-hidden /> Assignments
                </Link>
              </Button>
              <Button intent="ghost" size="sm" className="justify-start" asChild>
                <Link href={`/courses/${courseId}/discussions`}>
                  <MessagesSquare className="size-4" aria-hidden /> Discussions
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
