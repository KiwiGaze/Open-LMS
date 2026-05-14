'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
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
import { Input } from '@/components/ui/input.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useCoursesQuery } from '@/lib/api/queries/courses.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { cn } from '@/lib/cn';
import { BookOpen, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function CoursesPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const courses = useCoursesQuery(tenantId);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'draft' | 'archived'>('all');

  const filtered = useMemo(() => {
    const all = courses.data ?? [];
    return all.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (search.trim() === '') return true;
      const hay = `${c.title} ${c.code} ${c.academicTerm ?? ''}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });
  }, [courses.data, search, status]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Courses"
        description="All courses you teach in or are enrolled in."
        actions={
          <Button asChild>
            <Link href="/courses/new">New course</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-muted)"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="pl-9"
            type="search"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-(--color-text-muted)" aria-hidden />
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {courses.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={`courses-skel-${i}`}
              className="h-44 w-full rounded-[var(--radius-lg)]"
            />
          ))}
        </div>
      ) : courses.error ? (
        <ErrorState error={courses.error} onRetry={() => courses.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={courses.data?.length === 0 ? 'No courses yet' : 'No matches'}
          description={
            courses.data?.length === 0
              ? 'Create your first course to get started.'
              : 'Try adjusting your search or filters.'
          }
          action={
            courses.data?.length === 0 ? (
              <Button asChild>
                <Link href="/courses/new">New course</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} className="group">
              <Card
                className={cn(
                  'h-full overflow-hidden transition-shadow hover:shadow-(--shadow-sm)',
                  'group-focus-visible:[box-shadow:var(--shadow-focus)]',
                )}
              >
                <div className="h-20 bg-gradient-to-br from-(--color-brand-200) to-(--color-brand-500)" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-(--color-text-muted)">
                      {course.code}
                    </span>
                    <Badge
                      tone={
                        course.status === 'active'
                          ? 'success'
                          : course.status === 'archived'
                            ? 'outline'
                            : 'neutral'
                      }
                    >
                      {course.status}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2 group-hover:text-(--color-text-link)">
                    {course.title}
                  </CardTitle>
                  {course.academicTerm ? (
                    <CardDescription>{course.academicTerm}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="text-xs text-(--color-text-muted)">
                  {course.catalogCategory ? <span>{course.catalogCategory}</span> : <span>—</span>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
