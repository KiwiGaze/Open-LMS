'use client';

import { ComingSoon } from '@/components/patterns/coming-soon.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Button } from '@/components/ui/button.tsx';
import Link from 'next/link';

export default function NewCoursePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New course" description="Create a new course in your institution." />
      <ComingSoon
        title="Course authoring is in progress"
        description="The backend already supports creating courses. The full authoring UI ships in the next iteration."
        action={
          <Button asChild intent="secondary">
            <Link href="/courses">Back to courses</Link>
          </Button>
        }
      />
    </div>
  );
}
