'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { FormField } from '@/components/patterns/form-field.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useMyCourseMembershipsQuery } from '@/lib/api/queries/me.ts';
import {
  useCreateQuestionBankQuestionMutation,
  useQuestionBankQuery,
  useQuestionBankQuestionsQuery,
} from '@/lib/api/queries/question-banks.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import type { QuizQuestionChoice, QuizQuestionType } from '@openlms/contracts';
import { HelpCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';

const STAFF_ROLES = new Set(['instructor', 'teaching_assistant', 'course_admin']);

const QUESTION_TYPE_LABEL: Record<QuizQuestionType, string> = {
  multiple_choice: 'Multiple choice',
  true_false: 'True / False',
  short_answer: 'Short answer',
  numeric: 'Numeric',
  essay: 'Essay',
  matching: 'Matching',
};

type Params = { courseId: string; bankId: string };

export default function QuestionBankDetailPage({ params }: { params: Promise<Params> }) {
  const { courseId, bankId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);

  const myCourseMemberships = useMyCourseMembershipsQuery();
  const isStaff =
    myCourseMemberships.data?.some((m) => m.courseId === courseId && STAFF_ROLES.has(m.role)) ??
    false;

  const bank = useQuestionBankQuery(tenantId, courseId, bankId);
  const questions = useQuestionBankQuestionsQuery(tenantId, courseId, bankId);

  const [addOpen, setAddOpen] = useState(false);

  if (myCourseMemberships.isLoading) {
    return <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />;
  }
  if (!isStaff) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-(--color-border-subtle) bg-(--color-surface-elevated) p-6 text-sm text-(--color-text-muted)">
        Course staff access is required to manage question banks.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Question bank"
        title={bank.data?.title ?? '…'}
        description={bank.data?.description ?? 'Reusable question pool.'}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild intent="ghost">
              <Link href={`/courses/${courseId}/question-banks`}>Back to banks</Link>
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" aria-hidden /> Add question
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            Questions in this bank. Add new ones; full editing arrives in a follow-up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questions.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : questions.error ? (
            <ErrorState error={questions.error} onRetry={() => questions.refetch()} />
          ) : (questions.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No questions yet"
              description="Add your first question to start building this bank."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-(--color-border-subtle)">
              {(questions.data ?? [])
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((q) => (
                  <li key={q.id} className="flex flex-col gap-1 py-3">
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">{QUESTION_TYPE_LABEL[q.questionType]}</Badge>
                      <span className="text-xs text-(--color-text-muted)">{q.points} pts</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-(--color-text-default)">
                      {q.prompt}
                    </p>
                    {q.choices.length > 0 ? (
                      <ul className="mt-1 ml-4 flex list-disc flex-col gap-0.5 text-xs text-(--color-text-muted)">
                        {q.choices.map((c) => (
                          <li key={c.id}>{c.text}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AddQuestionDialog
        tenantId={tenantId}
        courseId={courseId}
        bankId={bankId}
        nextPosition={questions.data?.length ?? 0}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </div>
  );
}

function AddQuestionDialog({
  tenantId,
  courseId,
  bankId,
  nextPosition,
  open,
  onOpenChange,
}: {
  tenantId: string | null;
  courseId: string;
  bankId: string;
  nextPosition: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { publish } = useToast();
  const create = useCreateQuestionBankQuestionMutation(tenantId, courseId, bankId);

  const [questionType, setQuestionType] = useState<QuizQuestionType>('multiple_choice');
  const [prompt, setPrompt] = useState('');
  const [points, setPoints] = useState('1');
  const [choices, setChoices] = useState<QuizQuestionChoice[]>([
    { id: 'a', text: '' },
    { id: 'b', text: '' },
  ]);

  const reset = () => {
    setQuestionType('multiple_choice');
    setPrompt('');
    setPoints('1');
    setChoices([
      { id: 'a', text: '' },
      { id: 'b', text: '' },
    ]);
  };

  const needsChoices = questionType === 'multiple_choice' || questionType === 'true_false';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;
    const pts = Number(points);
    if (!Number.isInteger(pts) || pts < 0) return;

    let finalChoices: QuizQuestionChoice[] = [];
    if (questionType === 'multiple_choice') {
      finalChoices = choices
        .map((c) => ({ ...c, text: c.text.trim() }))
        .filter((c) => c.text.length > 0);
      if (finalChoices.length < 2) return;
    } else if (questionType === 'true_false') {
      finalChoices = [
        { id: 'true', text: 'True' },
        { id: 'false', text: 'False' },
      ];
    }

    try {
      await create.mutateAsync({
        position: nextPosition,
        questionType,
        prompt: trimmedPrompt,
        points: pts,
        choices: finalChoices,
      });
      publish({ tone: 'success', title: 'Question added' });
      reset();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not add question.';
      publish({ tone: 'danger', title: 'Add failed', description: message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add question</DialogTitle>
          <DialogDescription>
            Multiple-choice and true/false are supported here; richer types arrive in a follow-up.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Question type" id="qbq-type" required>
            <Select
              value={questionType}
              onValueChange={(v) => setQuestionType(v as QuizQuestionType)}
            >
              <SelectTrigger id="qbq-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                <SelectItem value="true_false">True / False</SelectItem>
                <SelectItem value="short_answer">Short answer</SelectItem>
                <SelectItem value="numeric">Numeric</SelectItem>
                <SelectItem value="essay">Essay</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Prompt" id="qbq-prompt" required>
            <Textarea
              id="qbq-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Question text shown to learners."
            />
          </FormField>
          <FormField label="Points" id="qbq-points" required>
            <Input
              id="qbq-points"
              type="number"
              min={0}
              step={1}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-32"
            />
          </FormField>
          {needsChoices && questionType === 'multiple_choice' ? (
            <FormField label="Choices" id="qbq-choices" required>
              <div className="flex flex-col gap-2">
                {choices.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Input
                      value={c.text}
                      onChange={(e) => {
                        const next = choices.slice();
                        next[i] = { ...c, text: e.target.value };
                        setChoices(next);
                      }}
                      placeholder={`Choice ${i + 1}`}
                    />
                    <Button
                      type="button"
                      intent="ghost"
                      size="sm"
                      onClick={() => setChoices(choices.filter((_, j) => j !== i))}
                      disabled={choices.length <= 2}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  intent="secondary"
                  size="sm"
                  onClick={() => {
                    const nextId = String.fromCharCode('a'.charCodeAt(0) + choices.length);
                    setChoices([...choices, { id: nextId, text: '' }]);
                  }}
                  disabled={choices.length >= 8}
                >
                  Add choice
                </Button>
              </div>
            </FormField>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={create.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!prompt.trim() || create.isPending}
              loading={create.isPending}
            >
              Add question
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
