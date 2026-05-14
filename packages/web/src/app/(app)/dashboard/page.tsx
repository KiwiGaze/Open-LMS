'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { KpiCard } from '@/components/patterns/kpi-card.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
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
import { useCalendarItemsQuery } from '@/lib/api/queries/calendar.ts';
import { useCoursesQuery } from '@/lib/api/queries/courses.ts';
import { useMeQuery } from '@/lib/api/queries/me.ts';
import { useNotificationsQuery } from '@/lib/api/queries/notifications.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { cn } from '@/lib/cn';
import { formatDateTime, formatRelative } from '@/lib/format.ts';
import { BookOpen, CalendarClock, ClipboardList, GraduationCap, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const me = useMeQuery();
  const courses = useCoursesQuery(tenantId);
  const next30 = new Date();
  next30.setDate(next30.getDate() + 30);
  const calendar = useCalendarItemsQuery(tenantId, { from: new Date(), to: next30 });
  const notifications = useNotificationsQuery(tenantId);

  const activeCourses = courses.data?.filter((c) => c.status === 'active') ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Dashboard"
        title={
          me.data
            ? `Welcome back, ${me.data.displayName?.split(' ')[0] ?? 'there'}`
            : 'Welcome back'
        }
        description="Pick up where you left off, or jump into something new."
        actions={
          <Button asChild intent="secondary" size="sm">
            <Link href="/courses">
              <BookOpen className="size-4" aria-hidden />
              Browse courses
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active courses"
          icon={BookOpen}
          value={courses.isLoading ? undefined : activeCourses.length}
          loading={courses.isLoading}
        />
        <KpiCard
          label="Items due (30 days)"
          icon={CalendarClock}
          value={calendar.isLoading ? undefined : (calendar.data?.length ?? 0)}
          loading={calendar.isLoading}
        />
        <KpiCard
          label="Unread notifications"
          icon={ClipboardList}
          value={
            notifications.isLoading
              ? undefined
              : (notifications.data?.filter((n) => !n.readAt).length ?? 0)
          }
          loading={notifications.isLoading}
        />
        <KpiCard
          label="Total enrollments"
          icon={GraduationCap}
          value={courses.isLoading ? undefined : (courses.data?.length ?? 0)}
          loading={courses.isLoading}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
            <div className="flex flex-col gap-0.5">
              <CardTitle>Your courses</CardTitle>
              <CardDescription>Continue learning right where you left off.</CardDescription>
            </div>
            <Button asChild intent="link" size="sm" className="text-sm">
              <Link href="/courses">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {courses.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton
                    key={`course-skel-${idx}`}
                    className="h-24 w-full rounded-[var(--radius-md)]"
                  />
                ))}
              </div>
            ) : courses.error ? (
              <ErrorState error={courses.error} onRetry={() => courses.refetch()} />
            ) : (courses.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="You're not in any courses yet"
                description="Browse the catalog and join your first course."
                action={
                  <Button asChild>
                    <Link href="/courses">Browse catalog</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {courses.data?.slice(0, 6).map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className={cn(
                      'group rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-elevated)',
                      'p-4 transition-shadow hover:shadow-(--shadow-sm)',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-(--color-text-muted)">
                        {course.code}
                      </span>
                      <Badge
                        tone={
                          course.status === 'active'
                            ? 'success'
                            : course.status === 'draft'
                              ? 'neutral'
                              : 'outline'
                        }
                      >
                        {course.status}
                      </Badge>
                    </div>
                    <h3 className="mt-2 font-medium text-(--color-text-default) line-clamp-2 group-hover:text-(--color-text-link)">
                      {course.title}
                    </h3>
                    {course.academicTerm ? (
                      <p className="mt-1 text-xs text-(--color-text-subtle)">
                        {course.academicTerm}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>Next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {calendar.isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={`cal-skel-${idx}`} className="h-12 w-full" />
                ))}
              </div>
            ) : calendar.error ? (
              <ErrorState error={calendar.error} onRetry={() => calendar.refetch()} />
            ) : (calendar.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nothing due soon"
                description="Your calendar is clear for the next month."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {calendar.data?.slice(0, 6).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-(--color-border-subtle) p-3"
                  >
                    <div className="grid size-9 place-items-center rounded-[var(--radius-sm)] bg-(--color-brand-subtle) text-(--color-brand-700)">
                      <CalendarClock className="size-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-(--color-text-default)">
                        {item.title}
                      </p>
                      <p className="text-xs text-(--color-text-muted)">
                        {item.startsAt
                          ? `${formatDateTime(item.startsAt)} · ${formatRelative(item.startsAt)}`
                          : 'No date'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {activeCourses.length === 0 && !courses.isLoading ? (
        <Card className="border-dashed bg-(--color-brand-subtle)/40">
          <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-(--color-text-default)">Start your first course</p>
              <p className="text-sm text-(--color-text-muted)">
                Set up the foundations: name, term, schedule, and roster.
              </p>
            </div>
            <Button asChild>
              <Link href="/courses">
                <PlusCircle className="size-4" aria-hidden />
                New course
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
