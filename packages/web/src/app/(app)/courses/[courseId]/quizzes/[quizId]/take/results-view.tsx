'use client';

import { KpiCard } from '@/components/patterns/kpi-card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { formatDateTime } from '@/lib/format.ts';
import type { Quiz, QuizAttempt, QuizAttemptResponse, QuizQuestion } from '@openlms/contracts';
import { CalendarClock, CheckCircle2, ClipboardCheck, Hourglass } from 'lucide-react';
import Link from 'next/link';

export type ResultsViewProps = {
  courseId: string;
  quiz: Quiz;
  attempt: QuizAttempt;
  questions: QuizQuestion[];
  responses: QuizAttemptResponse[];
};

function statusTone(status: QuizAttempt['status']): 'success' | 'warning' | 'neutral' | 'danger' {
  if (status === 'graded') return 'success';
  if (status === 'submitted') return 'warning';
  if (status === 'abandoned') return 'danger';
  return 'neutral';
}

function statusLabel(status: QuizAttempt['status']): string {
  if (status === 'graded') return 'Graded';
  if (status === 'submitted') return 'Pending review';
  if (status === 'abandoned') return 'Abandoned';
  return 'In progress';
}

function describeAnswer(response: QuizAttemptResponse | undefined): string {
  if (!response) return 'Not answered';
  const answer = response.answer;
  switch (answer.kind) {
    case 'choice':
      return `${answer.selectedChoiceIds.length} choice${
        answer.selectedChoiceIds.length === 1 ? '' : 's'
      } selected`;
    case 'text':
      return answer.text.length > 80 ? `${answer.text.slice(0, 78)}…` : answer.text;
    case 'numeric':
      return String(answer.value);
    case 'pairs':
      return `${answer.pairs.length} pair${answer.pairs.length === 1 ? '' : 's'} matched`;
  }
}

export function ResultsView({ courseId, quiz, attempt, questions, responses }: ResultsViewProps) {
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const responsesByQuestionId = new Map(responses.map((r) => [r.questionId, r]));
  const answeredCount = responses.length;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={ClipboardCheck}
          label="Score"
          value={attempt.score !== null ? `${attempt.score}/${totalPoints}` : 'Pending'}
          hint={
            attempt.score !== null
              ? `${Math.round((attempt.score / Math.max(1, totalPoints)) * 100)}% of total`
              : 'Manual grading in progress'
          }
        />
        <KpiCard
          icon={CheckCircle2}
          label="Answered"
          value={`${answeredCount}/${questions.length}`}
          hint={answeredCount === questions.length ? 'All questions answered' : 'Some left blank'}
        />
        <KpiCard
          icon={CalendarClock}
          label="Submitted"
          value={attempt.submittedAt ? formatDateTime(attempt.submittedAt) : '—'}
          hint={`Attempt ${attempt.attemptNumber} of ${quiz.maxAttempts}`}
        />
      </section>

      <Card>
        <CardContent className="flex flex-col gap-2 p-6">
          <div className="flex items-center gap-2">
            <Badge tone={statusTone(attempt.status)}>{statusLabel(attempt.status)}</Badge>
            {attempt.status === 'submitted' ? (
              <span className="flex items-center gap-1 text-xs text-(--color-text-muted)">
                <Hourglass className="size-3" aria-hidden /> Some answers require manual review
              </span>
            ) : null}
          </div>
          <h2 className="text-lg font-medium text-(--color-text-default)">{quiz.title}</h2>
          {quiz.description ? (
            <p className="whitespace-pre-wrap text-sm text-(--color-text-muted)">
              {quiz.description}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-(--color-text-default)">Your answers</h3>
        <ul className="flex flex-col divide-y divide-(--color-border-subtle) rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-base)">
          {questions.map((question, index) => {
            const response = responsesByQuestionId.get(question.id);
            return (
              <li key={question.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-(--color-text-default)">
                    {index + 1}. {question.prompt}
                  </p>
                  <span className="shrink-0 text-xs tabular-nums text-(--color-text-muted)">
                    {question.points} pt{question.points === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-xs text-(--color-text-muted)">{describeAnswer(response)}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex justify-end">
        <Button asChild intent="secondary">
          <Link href={`/courses/${courseId}/quizzes/${quiz.id}`}>Back to quiz</Link>
        </Button>
      </div>
    </div>
  );
}
