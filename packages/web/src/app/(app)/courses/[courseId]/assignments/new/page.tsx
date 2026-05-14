'use client';

import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Button } from '@/components/ui/button.tsx';
import Link from 'next/link';
import { use } from 'react';
import { AssignmentForm } from '../assignment-form.tsx';

type Params = { courseId: string };

export default function NewAssignmentPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Assignment"
        title="New assignment"
        description="Author the prompt, schedule, rubric, and AI assist settings learners will see."
        actions={
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}/assignments`}>Back to assignments</Link>
          </Button>
        }
      />
      <AssignmentForm mode="create" courseId={courseId} />
    </div>
  );
}
