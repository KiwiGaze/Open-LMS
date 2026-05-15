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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useCreateQuizQuestionMutation } from '@/lib/api/queries/quizzes.ts';
import { CheckCircle2, Plus } from 'lucide-react';
import { useState } from 'react';

export function AddTrueFalseQuestionDialog({
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
          <CheckCircle2 className="size-3.5" aria-hidden /> Add true/false
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
  const [correct, setCorrect] = useState<'true' | 'false'>('true');
  const [errors, setErrors] = useState<{ prompt?: string; points?: string }>({});

  const submit = async () => {
    const next: typeof errors = {};
    if (prompt.trim() === '') next.prompt = 'Prompt is required.';
    const parsedPoints = Number(points);
    if (!Number.isInteger(parsedPoints) || parsedPoints < 0) {
      next.points = 'Points must be a non-negative integer.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await create.mutateAsync({
        position: nextPosition,
        questionType: 'true_false',
        prompt: prompt.trim(),
        points: parsedPoints,
        choices: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
        answerKey: {
          kind: 'choice',
          correctChoiceIds: [correct],
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
        <DialogTitle>New true/false question</DialogTitle>
        <DialogDescription>
          Provide the prompt and mark whether the correct answer is True or False.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="tf-prompt">Prompt</Label>
          <Textarea
            id="tf-prompt"
            rows={3}
            value={prompt}
            aria-invalid={Boolean(errors.prompt)}
            aria-describedby={errors.prompt ? 'tf-prompt-error' : undefined}
            onChange={(e) => {
              setPrompt(e.target.value);
              setErrors((prev) => ({ ...prev, prompt: undefined }));
            }}
          />
          {errors.prompt ? (
            <p id="tf-prompt-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.prompt}
            </p>
          ) : null}
        </div>
        <div className="sm:max-w-32">
          <Label htmlFor="tf-points">Points</Label>
          <Input
            id="tf-points"
            type="number"
            min={0}
            step={1}
            value={points}
            aria-invalid={Boolean(errors.points)}
            aria-describedby={errors.points ? 'tf-points-error' : undefined}
            onChange={(e) => {
              setPoints(e.target.value);
              setErrors((prev) => ({ ...prev, points: undefined }));
            }}
          />
          {errors.points ? (
            <p id="tf-points-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.points}
            </p>
          ) : null}
        </div>
        <div>
          <Label>Correct answer</Label>
          <RadioGroup
            value={correct}
            onValueChange={(value) => setCorrect(value as 'true' | 'false')}
            className="mt-2"
          >
            <ul className="flex flex-col gap-2">
              <li className="flex items-center gap-2">
                <RadioGroupItem value="true" aria-label="Mark True as correct" />
                <span className="text-sm text-(--color-text-default)">True</span>
              </li>
              <li className="flex items-center gap-2">
                <RadioGroupItem value="false" aria-label="Mark False as correct" />
                <span className="text-sm text-(--color-text-default)">False</span>
              </li>
            </ul>
          </RadioGroup>
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
