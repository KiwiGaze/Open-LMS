'use client';

import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useCreateQuizQuestionMutation } from '@/lib/api/queries/quizzes.ts';
import { Hash } from 'lucide-react';
import { useState } from 'react';

export function AddNumericQuestionDialog({
  tenantId,
  courseId,
  quizId,
  nextPosition,
}: {
  tenantId: string | null;
  courseId: string;
  quizId: string;
  nextPosition: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button intent="secondary" size="sm">
          <Hash className="size-3.5" aria-hidden /> Add numeric
        </Button>
      </DialogTrigger>
      {open ? (
        <FormContents
          tenantId={tenantId}
          courseId={courseId}
          quizId={quizId}
          nextPosition={nextPosition}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </Dialog>
  );
}

function FormContents({
  tenantId,
  courseId,
  quizId,
  nextPosition,
  onClose,
}: {
  tenantId: string | null;
  courseId: string;
  quizId: string;
  nextPosition: number;
  onClose: () => void;
}) {
  const create = useCreateQuizQuestionMutation(tenantId, courseId, quizId);
  const { publish } = useToast();
  const [prompt, setPrompt] = useState('');
  const [points, setPoints] = useState('1');
  const [answer, setAnswer] = useState('');
  const [tolerance, setTolerance] = useState('0');
  const [errors, setErrors] = useState<{
    prompt?: string;
    points?: string;
    answer?: string;
    tolerance?: string;
  }>({});

  const submit = async () => {
    const next: typeof errors = {};
    if (prompt.trim() === '') next.prompt = 'Prompt is required.';
    const parsedPoints = Number(points);
    if (!Number.isInteger(parsedPoints) || parsedPoints < 0) {
      next.points = 'Points must be a non-negative integer.';
    }
    const trimmedAnswer = answer.trim();
    let parsedAnswer = Number.NaN;
    if (trimmedAnswer === '') {
      next.answer = 'Answer is required.';
    } else {
      parsedAnswer = Number(trimmedAnswer);
      if (!Number.isFinite(parsedAnswer)) {
        next.answer = 'Answer must be a finite number.';
      }
    }
    const parsedTolerance = Number(tolerance);
    if (!Number.isFinite(parsedTolerance) || parsedTolerance < 0) {
      next.tolerance = 'Tolerance must be a non-negative number.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await create.mutateAsync({
        position: nextPosition,
        questionType: 'numeric',
        prompt: prompt.trim(),
        points: parsedPoints,
        choices: [],
        answerKey: {
          kind: 'numeric',
          value: parsedAnswer,
          tolerance: parsedTolerance,
        },
      });
      publish({ tone: 'success', title: 'Question added' });
      onClose();
    } catch (error) {
      publish({
        tone: 'danger',
        title: 'Create failed',
        description: error instanceof ApiHttpError ? error.message : 'Could not create question.',
      });
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New numeric question</DialogTitle>
        <DialogDescription>
          Provide the prompt, the expected numeric answer, and the tolerance window for accepting
          near-miss responses (e.g. 0.05 to accept values within 0.05 of the answer).
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="num-prompt">Prompt</Label>
          <Textarea
            id="num-prompt"
            rows={3}
            value={prompt}
            aria-invalid={Boolean(errors.prompt)}
            aria-describedby={errors.prompt ? 'num-prompt-error' : undefined}
            onChange={(e) => {
              setPrompt(e.target.value);
              setErrors((prev) => ({ ...prev, prompt: undefined }));
            }}
          />
          {errors.prompt ? (
            <p id="num-prompt-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.prompt}
            </p>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="num-points">Points</Label>
            <Input
              id="num-points"
              type="number"
              min={0}
              step={1}
              value={points}
              aria-invalid={Boolean(errors.points)}
              aria-describedby={errors.points ? 'num-points-error' : undefined}
              onChange={(e) => {
                setPoints(e.target.value);
                setErrors((prev) => ({ ...prev, points: undefined }));
              }}
            />
            {errors.points ? (
              <p id="num-points-error" className="mt-1 text-xs text-(--color-danger-700)">
                {errors.points}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="num-answer">Answer</Label>
            <Input
              id="num-answer"
              type="number"
              step="any"
              value={answer}
              aria-invalid={Boolean(errors.answer)}
              aria-describedby={errors.answer ? 'num-answer-error' : undefined}
              onChange={(e) => {
                setAnswer(e.target.value);
                setErrors((prev) => ({ ...prev, answer: undefined }));
              }}
            />
            {errors.answer ? (
              <p id="num-answer-error" className="mt-1 text-xs text-(--color-danger-700)">
                {errors.answer}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="num-tolerance">Tolerance</Label>
            <Input
              id="num-tolerance"
              type="number"
              min={0}
              step="any"
              value={tolerance}
              aria-invalid={Boolean(errors.tolerance)}
              aria-describedby={errors.tolerance ? 'num-tolerance-error' : undefined}
              onChange={(e) => {
                setTolerance(e.target.value);
                setErrors((prev) => ({ ...prev, tolerance: undefined }));
              }}
            />
            {errors.tolerance ? (
              <p id="num-tolerance-error" className="mt-1 text-xs text-(--color-danger-700)">
                {errors.tolerance}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button intent="secondary" size="sm" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button intent="primary" size="sm" onClick={submit} disabled={create.isPending}>
            {create.isPending ? 'Adding…' : 'Add question'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
