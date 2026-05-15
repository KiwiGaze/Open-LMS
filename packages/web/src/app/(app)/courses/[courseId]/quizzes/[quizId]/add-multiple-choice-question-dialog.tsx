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
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

type Choice = { id: string; text: string };

const initialChoices = (): Choice[] => [
  { id: 'a', text: '' },
  { id: 'b', text: '' },
];

export function AddMultipleChoiceQuestionDialog({
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
        <Button intent="primary" size="sm">
          <Plus className="size-3.5" aria-hidden /> Add multiple-choice question
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
  const [choices, setChoices] = useState<Choice[]>(initialChoices());
  const [correctChoiceId, setCorrectChoiceId] = useState<string | null>('a');
  const [errors, setErrors] = useState<{
    prompt?: string;
    points?: string;
    choices?: string;
    answer?: string;
  }>({});

  const updateChoice = (id: string, text: string) => {
    setChoices((prev) => prev.map((choice) => (choice.id === id ? { ...choice, text } : choice)));
    setErrors((prev) => ({ ...prev, choices: undefined }));
  };

  const addChoice = () => {
    if (choices.length >= 6) return;
    const nextLetter = String.fromCharCode('a'.charCodeAt(0) + choices.length);
    setChoices((prev) => [...prev, { id: nextLetter, text: '' }]);
  };

  const removeChoice = (id: string) => {
    if (choices.length <= 2) return;
    setChoices((prev) => prev.filter((choice) => choice.id !== id));
    if (correctChoiceId === id) {
      setCorrectChoiceId(null);
    }
  };

  const submit = async () => {
    const next: typeof errors = {};
    if (prompt.trim() === '') next.prompt = 'Prompt is required.';
    const parsedPoints = Number(points);
    if (!Number.isInteger(parsedPoints) || parsedPoints < 0) {
      next.points = 'Points must be a non-negative integer.';
    }
    const trimmedChoices = choices.map((c) => ({ id: c.id, text: c.text.trim() }));
    if (trimmedChoices.some((c) => c.text === '')) {
      next.choices = 'All choices must be non-empty.';
    }
    if (!correctChoiceId || !trimmedChoices.some((c) => c.id === correctChoiceId)) {
      next.answer = 'Select the correct choice.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await create.mutateAsync({
        position: nextPosition,
        questionType: 'multiple_choice',
        prompt: prompt.trim(),
        points: parsedPoints,
        choices: trimmedChoices,
        answerKey: {
          kind: 'choice',
          correctChoiceIds: [correctChoiceId as string],
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
        <DialogTitle>New multiple-choice question</DialogTitle>
        <DialogDescription>
          Provide the prompt, 2-6 choices, and mark the correct one. The answer key is staff-only
          and used for auto-grading.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="mc-prompt">Prompt</Label>
          <Textarea
            id="mc-prompt"
            rows={3}
            value={prompt}
            aria-invalid={Boolean(errors.prompt)}
            aria-describedby={errors.prompt ? 'mc-prompt-error' : undefined}
            onChange={(e) => {
              setPrompt(e.target.value);
              setErrors((prev) => ({ ...prev, prompt: undefined }));
            }}
          />
          {errors.prompt ? (
            <p id="mc-prompt-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.prompt}
            </p>
          ) : null}
        </div>
        <div className="sm:max-w-32">
          <Label htmlFor="mc-points">Points</Label>
          <Input
            id="mc-points"
            type="number"
            min={0}
            step={1}
            value={points}
            aria-invalid={Boolean(errors.points)}
            aria-describedby={errors.points ? 'mc-points-error' : undefined}
            onChange={(e) => {
              setPoints(e.target.value);
              setErrors((prev) => ({ ...prev, points: undefined }));
            }}
          />
          {errors.points ? (
            <p id="mc-points-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.points}
            </p>
          ) : null}
        </div>
        <div>
          <Label>Choices</Label>
          {errors.choices ? (
            <p className="mt-1 text-xs text-(--color-danger-700)">{errors.choices}</p>
          ) : null}
          {errors.answer ? (
            <p className="mt-1 text-xs text-(--color-danger-700)">{errors.answer}</p>
          ) : null}
          <ul className="mt-2 flex flex-col gap-2">
            {choices.map((choice) => (
              <li key={choice.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mc-correct"
                  checked={correctChoiceId === choice.id}
                  onChange={() => {
                    setCorrectChoiceId(choice.id);
                    setErrors((prev) => ({ ...prev, answer: undefined }));
                  }}
                  aria-label={`Mark choice ${choice.id} as correct`}
                />
                <Input
                  value={choice.text}
                  placeholder={`Choice ${choice.id.toUpperCase()}`}
                  onChange={(e) => updateChoice(choice.id, e.target.value)}
                />
                <Button
                  intent="secondary"
                  size="sm"
                  onClick={() => removeChoice(choice.id)}
                  disabled={choices.length <= 2}
                  aria-label={`Remove choice ${choice.id}`}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            intent="secondary"
            size="sm"
            onClick={addChoice}
            disabled={choices.length >= 6}
            className="mt-2"
          >
            <Plus className="size-3.5" aria-hidden /> Add choice
          </Button>
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
