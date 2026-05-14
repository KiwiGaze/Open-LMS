'use client';

import { ComingSoon } from '@/components/patterns/coming-soon.tsx';
import { Button } from '@/components/ui/button.tsx';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string };

export default function NewQuizPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  return (
    <ComingSoon
      title="Quiz authoring is in progress"
      action={
        <Button asChild intent="secondary">
          <Link href={`/courses/${courseId}/quizzes`}>Back to quizzes</Link>
        </Button>
      }
    />
  );
}
