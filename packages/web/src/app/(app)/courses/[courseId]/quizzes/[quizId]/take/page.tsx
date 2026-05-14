'use client';

import { ComingSoon } from '@/components/patterns/coming-soon.tsx';
import { Button } from '@/components/ui/button.tsx';
import Link from 'next/link';
import { use } from 'react';

type Params = { courseId: string; quizId: string };

export default function TakeQuizPage({ params }: { params: Promise<Params> }) {
  const { courseId, quizId } = use(params);
  return (
    <ComingSoon
      title="Quiz attempt runtime is in progress"
      description="The question navigator, timer, autosave, and submission flow ship in the next iteration. The backend exposes attempts, answers, and grading already."
      action={
        <Button asChild intent="secondary">
          <Link href={`/courses/${courseId}/quizzes/${quizId}`}>Back to quiz details</Link>
        </Button>
      }
    />
  );
}
