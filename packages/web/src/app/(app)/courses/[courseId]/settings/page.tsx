'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useCourseQuery } from '@/lib/api/queries/courses.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDate } from '@/lib/format.ts';
import { use } from 'react';

type Params = { courseId: string };

export default function CourseSettingsPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const course = useCourseQuery(tenantId, courseId);

  if (course.isLoading) return <Skeleton className="h-64 w-full" />;
  if (course.error) return <ErrorState error={course.error} onRetry={() => course.refetch()} />;
  if (!course.data) return null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
          <CardDescription>Course identity and lifecycle.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Code" value={course.data.code} />
            <Field label="Title" value={course.data.title} />
            <Field
              label="Status"
              value={
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
              }
            />
            <Field label="Term" value={course.data.academicTerm ?? '—'} />
            <Field label="Category" value={course.data.catalogCategory ?? '—'} />
            <Field label="Blueprint" value={course.data.isBlueprint ? 'Yes' : 'No'} />
            <Field label="Starts" value={formatDate(course.data.startsAt)} />
            <Field label="Ends" value={formatDate(course.data.endsAt)} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-(--color-text-muted)">{label}</dt>
      <dd className="mt-1 text-(--color-text-default)">{value}</dd>
    </div>
  );
}
