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
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  type AttendanceSessionInput,
  useCreateAttendanceSessionMutation,
} from '@/lib/api/queries/attendance.ts';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';

function toLocalInput(value: Date | null): string {
  if (!value) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function SessionDialog({
  tenantId,
  courseId,
  open,
  onOpenChange,
}: {
  tenantId: string | null;
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { publish } = useToast();
  const create = useCreateAttendanceSessionMutation(tenantId, courseId);

  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState(toLocalInput(new Date()));
  const [endsAt, setEndsAt] = useState('');
  const [errors, setErrors] = useState<{ title?: string; startsAt?: string; endsAt?: string }>({});

  useEffect(() => {
    if (!open) {
      setTitle('');
      setStartsAt(toLocalInput(new Date()));
      setEndsAt('');
      setErrors({});
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const startIso = toIso(startsAt);
    const endIso = toIso(endsAt);

    const nextErrors: typeof errors = {};
    if (!trimmedTitle) nextErrors.title = 'Enter a session title.';
    if (!startIso) nextErrors.startsAt = 'Pick a start time.';
    if (!endIso) nextErrors.endsAt = 'Pick an end time.';
    if (startIso && endIso && new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      nextErrors.endsAt = 'End time must be after the start time.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !startIso || !endIso) return;

    const input: AttendanceSessionInput = {
      title: trimmedTitle,
      startsAt: startIso,
      endsAt: endIso,
    };

    try {
      await create.mutateAsync(input);
      publish({ tone: 'success', title: 'Session created' });
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not save. Try again.';
      publish({ tone: 'danger', title: 'Save failed', description: message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New attendance session</DialogTitle>
          <DialogDescription>
            One session typically maps to a single class meeting.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Title" id="session-title" required error={errors.title}>
            <Input
              id="session-title"
              type="text"
              maxLength={180}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="Week 2 seminar"
              required
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Starts at" id="session-starts" required error={errors.startsAt}>
              <Input
                id="session-starts"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => {
                  setStartsAt(e.target.value);
                  if (errors.startsAt || errors.endsAt) {
                    setErrors((prev) => ({ ...prev, startsAt: undefined, endsAt: undefined }));
                  }
                }}
                required
              />
            </FormField>
            <FormField label="Ends at" id="session-ends" required error={errors.endsAt}>
              <Input
                id="session-ends"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => {
                  setEndsAt(e.target.value);
                  if (errors.endsAt) setErrors((prev) => ({ ...prev, endsAt: undefined }));
                }}
                required
              />
            </FormField>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={create.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={create.isPending} loading={create.isPending}>
              <Save className="size-4" aria-hidden /> Create session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
