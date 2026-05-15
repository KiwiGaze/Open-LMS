'use client';

import { FormField } from '@/components/patterns/form-field.tsx';
import { Button } from '@/components/ui/button.tsx';
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
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useCreateQuizOverrideMutation } from '@/lib/api/queries/quiz-overrides.ts';
import type { QuizOverrideStatus, QuizOverrideTargetType } from '@openlms/contracts';
import { useEffect, useState } from 'react';

type Props = {
  tenantId: string | null;
  courseId: string;
  quizId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function QuizOverrideDialog({ tenantId, courseId, quizId, open, onOpenChange }: Props) {
  const { publish } = useToast();
  const create = useCreateQuizOverrideMutation(tenantId, courseId, quizId);

  const [targetType, setTargetType] = useState<QuizOverrideTargetType>('user');
  const [targetId, setTargetId] = useState('');
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('');
  const [status, setStatus] = useState<QuizOverrideStatus>('active');
  const [targetIdError, setTargetIdError] = useState<string | null>(null);
  const [timeLimitError, setTimeLimitError] = useState<string | null>(null);
  const [maxAttemptsError, setMaxAttemptsError] = useState<string | null>(null);

  const parsePositiveInt = (raw: string): { value: number | null; error: string | null } => {
    if (raw.trim() === '') return { value: null, error: null };
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
      return { value: null, error: 'Must be a positive whole number.' };
    }
    return { value: n, error: null };
  };

  useEffect(() => {
    if (!open) {
      setTargetType('user');
      setTargetId('');
      setOpensAt('');
      setClosesAt('');
      setTimeLimit('');
      setMaxAttempts('');
      setStatus('active');
      setTargetIdError(null);
      setTimeLimitError(null);
      setMaxAttemptsError(null);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTargetIdError(null);
    setTimeLimitError(null);
    setMaxAttemptsError(null);
    const trimmed = targetId.trim();
    if (!ULID_RE.test(trimmed)) {
      setTargetIdError('Target ID must be a 26-character ULID.');
      return;
    }
    const parsedTime = parsePositiveInt(timeLimit);
    if (parsedTime.error) {
      setTimeLimitError(parsedTime.error);
      return;
    }
    const parsedAttempts = parsePositiveInt(maxAttempts);
    if (parsedAttempts.error) {
      setMaxAttemptsError(parsedAttempts.error);
      return;
    }
    try {
      await create.mutateAsync({
        targetType,
        targetId: trimmed,
        opensAt: toIso(opensAt),
        closesAt: toIso(closesAt),
        timeLimitMinutes: parsedTime.value,
        maxAttempts: parsedAttempts.value,
        status,
      });
      publish({ tone: 'success', title: 'Override created' });
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not create. Try again.';
      publish({ tone: 'danger', title: 'Create failed', description: message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New quiz override</DialogTitle>
          <DialogDescription>
            Apply an accommodation or extended window to a specific user, group, or section.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Target type" id="qo-targetType" required>
            <Select
              value={targetType}
              onValueChange={(v) => setTargetType(v as QuizOverrideTargetType)}
            >
              <SelectTrigger id="qo-targetType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="section">Section</SelectItem>
                <SelectItem value="group">Group</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Target ID (ULID)" id="qo-targetId" error={targetIdError} required>
            <Input
              id="qo-targetId"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="01J9QW7B6N5W2YH3D3A1V0KE8M"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Opens at" id="qo-opensAt">
              <Input
                id="qo-opensAt"
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
              />
            </FormField>
            <FormField label="Closes at" id="qo-closesAt">
              <Input
                id="qo-closesAt"
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Time limit (minutes)" id="qo-timeLimit" error={timeLimitError}>
              <Input
                id="qo-timeLimit"
                type="number"
                min={1}
                step={1}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
              />
            </FormField>
            <FormField label="Max attempts" id="qo-maxAttempts" error={maxAttemptsError}>
              <Input
                id="qo-maxAttempts"
                type="number"
                min={1}
                step={1}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Status" id="qo-status" required>
            <Select value={status} onValueChange={(v) => setStatus(v as QuizOverrideStatus)}>
              <SelectTrigger id="qo-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={create.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={create.isPending} loading={create.isPending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
