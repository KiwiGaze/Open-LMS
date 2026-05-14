'use client';

import { ComingSoon } from '@/components/patterns/coming-soon.tsx';
import { Button } from '@/components/ui/button.tsx';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string };

export default function NewAssignmentPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  return (
    <ComingSoon
      title="Assignment authoring is in progress"
      description="The backend supports creating assignments with rubrics, schedules, overrides, and AI settings. The full authoring UI ships in the next iteration."
      action={
        <Button asChild intent="secondary">
          <Link href={`/courses/${courseId}/assignments`}>Back to assignments</Link>
        </Button>
      }
    />
  );
}
