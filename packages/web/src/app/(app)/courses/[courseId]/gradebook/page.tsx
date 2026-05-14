'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useCourseMembershipsQuery } from '@/lib/api/queries/gradebook.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { use } from 'react';
import { InstructorGradebookGrid } from './instructor-grid.tsx';
import { StudentGradebookView } from './student-view.tsx';

type Params = { courseId: string };

const STAFF_ROLES = new Set(['instructor', 'teaching_assistant', 'course_admin']);

export default function GradebookPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const user = useSessionStore((s) => s.user);

  const memberships = useCourseMembershipsQuery(tenantId, courseId);

  if (memberships.isLoading) {
    return <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />;
  }
  if (memberships.error) {
    return <ErrorState error={memberships.error} onRetry={() => memberships.refetch()} />;
  }

  const myMembership = memberships.data?.find((m) => m.userId === user?.id);
  const isStaff = myMembership ? STAFF_ROLES.has(myMembership.role) : false;

  if (isStaff) {
    return (
      <InstructorGradebookGrid
        tenantId={tenantId}
        courseId={courseId}
        memberships={memberships.data ?? []}
      />
    );
  }

  return <StudentGradebookView tenantId={tenantId} courseId={courseId} />;
}
