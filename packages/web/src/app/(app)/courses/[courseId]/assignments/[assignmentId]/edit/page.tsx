'use client';

import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useAssignmentsQuery } from '@/lib/api/queries/assignments.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import Link from 'next/link';
import { use } from 'react';
import { AssignmentForm } from '../../assignment-form.tsx';

type Params = { courseId: string; assignmentId: string };

export default function EditAssignmentPage({ params }: { params: Promise<Params> }) {
  const { courseId, assignmentId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const assignments = useAssignmentsQuery(tenantId, courseId);
  const assignment = assignments.data?.find((a) => a.id === assignmentId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Assignment"
        title={assignment ? `Edit · ${assignment.title}` : 'Edit assignment'}
        description="Changes apply immediately. Drafts remain hidden from learners until you publish."
        actions={
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}/assignments/${assignmentId}`}>Back</Link>
          </Button>
        }
      />

      {assignments.isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : assignments.error ? (
        <ErrorState error={assignments.error} onRetry={() => assignments.refetch()} />
      ) : !assignment ? (
        <ErrorState
          title="Assignment not found"
          error={new Error('It may have been removed or moved to another course.')}
        />
      ) : (
        <AssignmentForm mode="edit" courseId={courseId} assignment={assignment} />
      )}
    </div>
  );
}
