'use client';

import { Button } from '@/components/ui/button.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
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
import { Plus, TextCursor, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function AddShortAnswerQuestionDialog({
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
          <TextCursor className="size-3.5" aria-hidden /> Add short answer
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
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>(['']);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [errors, setErrors] = useState<{
    prompt?: string;
    points?: string;
    answers?: string;
  }>({});

  const updateAnswer = (index: number, value: string) => {
    setAcceptedAnswers((prev) => prev.map((entry, i) => (i === index ? value : entry)));
    setErrors((prev) => ({ ...prev, answers: undefined }));
  };

  const addAnswer = () => {
    setAcceptedAnswers((prev) => (prev.length >= 50 ? prev : [...prev, '']));
  };

  const removeAnswer = (index: number) => {
    setAcceptedAnswers((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const submit = async () => {
    const next: typeof errors = {};
    if (prompt.trim() === '') next.prompt = 'Prompt is required.';
    const normalizedPoints = points.trim();
    const parsedPoints = Number(normalizedPoints);
    if (normalizedPoints === '' || !Number.isInteger(parsedPoints) || parsedPoints < 0) {
      next.points = 'Points must be a non-negative integer.';
    }
    const trimmedAnswers = acceptedAnswers
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    if (trimmedAnswers.length === 0) {
      next.answers = 'At least one accepted answer is required.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await create.mutateAsync({
        position: nextPosition,
        questionType: 'short_answer',
        prompt: prompt.trim(),
        points: parsedPoints,
        choices: [],
        answerKey: {
          kind: 'text',
          acceptedAnswers: trimmedAnswers,
          caseSensitive,
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
        <DialogTitle>New short-answer question</DialogTitle>
        <DialogDescription>
          List the accepted answers (any one matches). Toggle case sensitivity if capitalization
          matters.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="sa-prompt">Prompt</Label>
          <Textarea
            id="sa-prompt"
            rows={3}
            value={prompt}
            aria-invalid={Boolean(errors.prompt)}
            aria-describedby={errors.prompt ? 'sa-prompt-error' : undefined}
            onChange={(e) => {
              setPrompt(e.target.value);
              setErrors((prev) => ({ ...prev, prompt: undefined }));
            }}
          />
          {errors.prompt ? (
            <p id="sa-prompt-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.prompt}
            </p>
          ) : null}
        </div>
        <div className="sm:max-w-32">
          <Label htmlFor="sa-points">Points</Label>
          <Input
            id="sa-points"
            type="number"
            min={0}
            step={1}
            value={points}
            aria-invalid={Boolean(errors.points)}
            aria-describedby={errors.points ? 'sa-points-error' : undefined}
            onChange={(e) => {
              setPoints(e.target.value);
              setErrors((prev) => ({ ...prev, points: undefined }));
            }}
          />
          {errors.points ? (
            <p id="sa-points-error" className="mt-1 text-xs text-(--color-danger-700)">
              {errors.points}
            </p>
          ) : null}
        </div>
        <div>
          <Label>Accepted answers</Label>
          {errors.answers ? (
            <p className="mt-1 text-xs text-(--color-danger-700)">{errors.answers}</p>
          ) : null}
          <ul className="mt-2 flex flex-col gap-2">
            {acceptedAnswers.map((answer, index) => (
              <li key={`answer-${index}`} className="flex items-center gap-2">
                <Input
                  value={answer}
                  placeholder={`Accepted answer ${index + 1}`}
                  onChange={(e) => updateAnswer(index, e.target.value)}
                />
                <Button
                  intent="secondary"
                  size="sm"
                  onClick={() => removeAnswer(index)}
                  disabled={acceptedAnswers.length <= 1}
                  aria-label={`Remove accepted answer ${index + 1}`}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            intent="secondary"
            size="sm"
            onClick={addAnswer}
            disabled={acceptedAnswers.length >= 50}
            className="mt-2"
          >
            <Plus className="size-3.5" aria-hidden /> Add accepted answer
          </Button>
        </div>
        <label
          htmlFor="sa-case-sensitive"
          className="flex items-center gap-2 text-sm text-(--color-text-default)"
        >
          <Checkbox
            id="sa-case-sensitive"
            checked={caseSensitive}
            onCheckedChange={(checked) => setCaseSensitive(checked === true)}
          />
          Case sensitive
        </label>
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
