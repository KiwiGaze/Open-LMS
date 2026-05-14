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
import { useCatalogQuery, useCoursesQuery } from '@/lib/api/queries/courses.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDate } from '@/lib/format.ts';
import type { CatalogCourse } from '@openlms/contracts';
import { Library, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EnrollDialog } from './enroll-dialog.tsx';

const ALL = '__all__';

export default function CatalogPage() {
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const catalog = useCatalogQuery(tenantId);
  const enrolled = useCoursesQuery(tenantId);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>(ALL);
  const [term, setTerm] = useState<string>(ALL);
  const [enrolling, setEnrolling] = useState<CatalogCourse | null>(null);

  const enrolledIds = useMemo(
    () => new Set((enrolled.data ?? []).map((c) => c.id)),
    [enrolled.data],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const c of catalog.data ?? []) {
      if (c.catalogCategory) set.add(c.catalogCategory);
    }
    return Array.from(set).sort();
  }, [catalog.data]);

  const terms = useMemo(() => {
    const set = new Set<string>();
    for (const c of catalog.data ?? []) {
      if (c.academicTerm) set.add(c.academicTerm);
    }
    return Array.from(set).sort();
  }, [catalog.data]);

  const visible = useMemo(() => {
    const list = catalog.data ?? [];
    const needle = search.trim().toLowerCase();
    return list.filter((c) => {
      if (category !== ALL && c.catalogCategory !== category) return false;
      if (term !== ALL && c.academicTerm !== term) return false;
      if (!needle) return true;
      return c.title.toLowerCase().includes(needle) || c.code.toLowerCase().includes(needle);
    });
  }, [catalog.data, search, category, term]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Catalog"
        title="Course catalog"
        description="Browse available courses and enroll with the instructor's code."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-muted)"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {categories.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="catalog-category"
              className="text-xs uppercase tracking-wider text-(--color-text-muted)"
            >
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="catalog-category" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {terms.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="catalog-term"
              className="text-xs uppercase tracking-wider text-(--color-text-muted)"
            >
              Term
            </label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger id="catalog-term" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {terms.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {catalog.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`cat-skel-${i}`} className="h-44 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : catalog.error ? (
        <ErrorState error={catalog.error} onRetry={() => catalog.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Library}
          title={(catalog.data?.length ?? 0) === 0 ? 'No courses in the catalog yet' : 'No matches'}
          description={
            (catalog.data?.length ?? 0) === 0
              ? 'Once your instructors publish courses, they will appear here.'
              : 'Adjust your filters or search to see more courses.'
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((course) => {
            const isEnrolled = enrolledIds.has(course.id);
            return (
              <Card key={course.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-(--color-text-muted)">
                      {course.code}
                    </span>
                    {isEnrolled ? <Badge tone="success">Enrolled</Badge> : null}
                  </div>
                  <CardTitle className="text-base">{course.title}</CardTitle>
                  {course.catalogCategory || course.academicTerm ? (
                    <CardDescription>
                      {[course.catalogCategory, course.academicTerm].filter(Boolean).join(' · ')}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {course.startsAt || course.endsAt ? (
                    <p className="text-xs text-(--color-text-muted)">
                      {course.startsAt ? formatDate(course.startsAt) : 'Open enrollment'}
                      {course.endsAt ? ` — ${formatDate(course.endsAt)}` : null}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-end">
                    {isEnrolled ? (
                      <Button intent="secondary" size="sm" disabled>
                        Enrolled
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setEnrolling(course)}
                        disabled={!enrolled.isSuccess}
                      >
                        Enroll
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EnrollDialog
        tenantId={tenantId}
        course={enrolling}
        open={enrolling !== null}
        onOpenChange={(open) => {
          if (!open) setEnrolling(null);
        }}
      />
    </div>
  );
}
