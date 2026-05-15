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
import { FileText } from 'lucide-react';
import { useState } from 'react';

export function AddEssayQuestionDialog({
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
          <FileText className="size-3.5" aria-hidden /> Add essay
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
  const [errors, setErrors] = useState<{ prompt?: string; points?: string }>({});

  const submit = async () => {
    const next: typeof errors = {};
    if (prompt.trim() === '') next.prompt = 'Prompt is required.';
    const normalizedPoints = points.trim();
    const parsedPoints = Number(normalizedPoints);
    if (normalizedPoints === '' || !Number.isInteger(parsedPoints) || parsedPoints < 0) {
      next.points = 'Points must be a non-negative integer.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await create.mutateAsync({
        position: nextPosition,
        questionType: 'essay',
        prompt: prompt.trim(),
        points: parsedPoints,
        choices: [],
        answerKey: null,
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
        <DialogTitle>New essay question</DialogTitle>
        <DialogDescription>
          Essays are graded manually — no answer key is required. Use the points field to set the
          maximum score the grader can award.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="essay-prompt">Prompt</Label>
          <Textarea
            id="essay-prompt"
            rows={4}
            value={prompt}
            aria-invalid={Boolean(errors.prompt)}
            aria-describedby={errors.prompt ? 'essay-prompt-error' : undefined}
            onChange={(e) => {
              setPrompt(e.target.value);
              setErrors((prev) => ({ ...prev, prompt: undefined }));
            }}
          />
          {errors.prompt ? (
            <p id="essay-prompt-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.prompt}
            </p>
          ) : null}
        </div>
        <div className="sm:max-w-32">
          <Label htmlFor="essay-points">Points</Label>
          <Input
            id="essay-points"
            type="number"
            min={0}
            step={1}
            value={points}
            aria-invalid={Boolean(errors.points)}
            aria-describedby={errors.points ? 'essay-points-error' : undefined}
            onChange={(e) => {
              setPoints(e.target.value);
              setErrors((prev) => ({ ...prev, points: undefined }));
            }}
          />
          {errors.points ? (
            <p id="essay-points-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.points}
            </p>
          ) : null}
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
