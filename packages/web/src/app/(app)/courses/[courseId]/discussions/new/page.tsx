'use client';

import { ComingSoon } from '@/components/patterns/coming-soon.tsx';
import { Button } from '@/components/ui/button.tsx';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string };

export default function NewDiscussionTopicPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  return (
    <ComingSoon
      title="Discussion authoring is in progress"
      action={
        <Button asChild intent="secondary">
          <Link href={`/courses/${courseId}/discussions`}>Back to discussions</Link>
        </Button>
      }
    />
  );
}
