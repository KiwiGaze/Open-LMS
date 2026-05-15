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
import { ArrowLeftRight, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const ID_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

type Pair = { left: string; right: string };

const initialPairs = (): Pair[] => [
  { left: '', right: '' },
  { left: '', right: '' },
];

export function AddMatchingQuestionDialog({
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
          <ArrowLeftRight className="size-3.5" aria-hidden /> Add matching
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
  const [pairs, setPairs] = useState<Pair[]>(initialPairs());
  const [errors, setErrors] = useState<{
    prompt?: string;
    points?: string;
    pairs?: string;
  }>({});

  const updatePair = (index: number, side: 'left' | 'right', value: string) => {
    setPairs((prev) => prev.map((pair, i) => (i === index ? { ...pair, [side]: value } : pair)));
    setErrors((p) => ({ ...p, pairs: undefined }));
  };

  const addPair = () => {
    setPairs((prev) =>
      prev.length >= ID_LETTERS.length ? prev : [...prev, { left: '', right: '' }],
    );
  };

  const removePair = (index: number) => {
    setPairs((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  };

  const submit = async () => {
    const next: typeof errors = {};
    if (prompt.trim() === '') next.prompt = 'Prompt is required.';
    const normalizedPoints = points.trim();
    const parsedPoints = Number(normalizedPoints);
    if (normalizedPoints === '' || !Number.isInteger(parsedPoints) || parsedPoints < 0) {
      next.points = 'Points must be a non-negative integer.';
    }

    const trimmedPairs = pairs.map((pair) => ({
      left: pair.left.trim(),
      right: pair.right.trim(),
    }));
    if (trimmedPairs.some((pair) => pair.left === '' || pair.right === '')) {
      next.pairs = 'Every pair needs both a left and a right value.';
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const choices = trimmedPairs.flatMap((pair, index) => {
      const leftId = `l${ID_LETTERS[index]}`;
      const rightId = `r${ID_LETTERS[index]}`;
      return [
        { id: leftId, text: pair.left },
        { id: rightId, text: pair.right },
      ];
    });

    const apiPairs = trimmedPairs.map((_, index) => ({
      leftId: `l${ID_LETTERS[index]}`,
      rightId: `r${ID_LETTERS[index]}`,
    }));

    try {
      await create.mutateAsync({
        position: nextPosition,
        questionType: 'matching',
        prompt: prompt.trim(),
        points: parsedPoints,
        choices,
        answerKey: {
          kind: 'pairs',
          pairs: apiPairs,
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
        <DialogTitle>New matching question</DialogTitle>
        <DialogDescription>
          Each row is a correct pair. Learners will see the left column shuffled with the right
          column and need to reconnect them.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="match-prompt">Prompt</Label>
          <Textarea
            id="match-prompt"
            rows={3}
            value={prompt}
            aria-invalid={Boolean(errors.prompt)}
            aria-describedby={errors.prompt ? 'match-prompt-error' : undefined}
            onChange={(e) => {
              setPrompt(e.target.value);
              setErrors((prev) => ({ ...prev, prompt: undefined }));
            }}
          />
          {errors.prompt ? (
            <p id="match-prompt-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.prompt}
            </p>
          ) : null}
        </div>
        <div className="sm:max-w-32">
          <Label htmlFor="match-points">Points</Label>
          <Input
            id="match-points"
            type="number"
            min={0}
            step={1}
            value={points}
            aria-invalid={Boolean(errors.points)}
            aria-describedby={errors.points ? 'match-points-error' : undefined}
            onChange={(e) => {
              setPoints(e.target.value);
              setErrors((prev) => ({ ...prev, points: undefined }));
            }}
          />
          {errors.points ? (
            <p id="match-points-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.points}
            </p>
          ) : null}
        </div>
        <div>
          <Label>Pairs</Label>
          {errors.pairs ? (
            <p id="match-pairs-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.pairs}
            </p>
          ) : null}
          <ul className="mt-2 flex flex-col gap-2">
            {pairs.map((pair, index) => (
              <li key={`pair-${index}`} className="flex items-center gap-2">
                <Input
                  value={pair.left}
                  placeholder={`Left ${index + 1}`}
                  aria-invalid={Boolean(errors.pairs)}
                  aria-describedby={errors.pairs ? 'match-pairs-error' : undefined}
                  onChange={(e) => updatePair(index, 'left', e.target.value)}
                />
                <ArrowLeftRight
                  className="size-3.5 shrink-0 text-(--color-text-muted)"
                  aria-hidden
                />
                <Input
                  value={pair.right}
                  placeholder={`Right ${index + 1}`}
                  aria-invalid={Boolean(errors.pairs)}
                  aria-describedby={errors.pairs ? 'match-pairs-error' : undefined}
                  onChange={(e) => updatePair(index, 'right', e.target.value)}
                />
                <Button
                  intent="secondary"
                  size="sm"
                  onClick={() => removePair(index)}
                  disabled={pairs.length <= 2}
                  aria-label={`Remove pair ${index + 1}`}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            intent="secondary"
            size="sm"
            onClick={addPair}
            disabled={pairs.length >= ID_LETTERS.length}
            className="mt-2"
          >
            <Plus className="size-3.5" aria-hidden /> Add pair
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
