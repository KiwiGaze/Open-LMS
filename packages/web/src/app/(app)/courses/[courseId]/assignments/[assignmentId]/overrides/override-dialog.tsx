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
import {
  type AssignmentOverrideInput,
  useCreateAssignmentOverrideMutation,
  useUpdateAssignmentOverrideMutation,
} from '@/lib/api/queries/assignment-overrides.ts';
import type {
  AssignmentOverride,
  AssignmentOverrideStatus,
  AssignmentOverrideTargetType,
} from '@openlms/contracts';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// react-hook-form would help here but we already have manual patterns elsewhere;
// keep this stateful + manual for consistency with announcement-dialog.

function toLocalInput(value: Date | string | null): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function OverrideDialog({
  tenantId,
  courseId,
  assignmentId,
  open,
  onOpenChange,
  existing,
}: {
  tenantId: string | null;
  courseId: string;
  assignmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: AssignmentOverride | null;
}) {
  const { publish } = useToast();
  const create = useCreateAssignmentOverrideMutation(tenantId, courseId, assignmentId);
  const update = useUpdateAssignmentOverrideMutation(tenantId, courseId, assignmentId);
  const isEdit = Boolean(existing);

  const [targetType, setTargetType] = useState<AssignmentOverrideTargetType>('user');
  const [targetId, setTargetId] = useState('');
  const [opensAt, setOpensAt] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [status, setStatus] = useState<AssignmentOverrideStatus>('active');
  const [targetIdError, setTargetIdError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTargetType(existing?.targetType ?? 'user');
      setTargetId(existing?.targetId ?? '');
      setOpensAt(toLocalInput(existing?.opensAt ?? null));
      setDueAt(toLocalInput(existing?.dueAt ?? null));
      setClosesAt(toLocalInput(existing?.closesAt ?? null));
      setStatus(existing?.status ?? 'active');
      setTargetIdError(null);
    }
  }, [open, existing]);

  const submitting = create.isPending || update.isPending;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTargetIdError(null);

    const trimmedId = targetId.trim();
    if (!ULID_RE.test(trimmedId)) {
      setTargetIdError('Target ID must be a 26-character ULID.');
      return;
    }

    const input: AssignmentOverrideInput = {
      targetType,
      targetId: trimmedId,
      opensAt: toIso(opensAt),
      dueAt: toIso(dueAt),
      closesAt: toIso(closesAt),
      status,
    };

    try {
      if (existing) {
        await update.mutateAsync({
          overrideId: existing.id,
          patch: {
            opensAt: input.opensAt,
            dueAt: input.dueAt,
            closesAt: input.closesAt,
            status: input.status,
          },
        });
      } else {
        await create.mutateAsync(input);
      }
      publish({ tone: 'success', title: isEdit ? 'Override saved' : 'Override created' });
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not save. Try again.';
      publish({ tone: 'danger', title: 'Save failed', description: message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit override' : 'New override'}</DialogTitle>
          <DialogDescription>
            Customize availability or due date for a specific student, group, or section.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Target type" id="target-type">
            <Select
              value={targetType}
              onValueChange={(v) => setTargetType(v as AssignmentOverrideTargetType)}
              disabled={isEdit}
            >
              <SelectTrigger id="target-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="group">Group</SelectItem>
                <SelectItem value="section">Section</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Target ID"
            id="target-id"
            required
            error={targetIdError}
            description="26-character ULID. Get this from the people, groups, or sections page."
          >
            <Input
              id="target-id"
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={isEdit}
              placeholder="01J9QW7B6N5W2YH3D3A1V0KE3F"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Opens at" id="opens-at">
              <Input
                id="opens-at"
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
              />
            </FormField>
            <FormField label="Due at" id="due-at">
              <Input
                id="due-at"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </FormField>
            <FormField label="Closes at" id="closes-at">
              <Input
                id="closes-at"
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Status" id="override-status">
            <Select value={status} onValueChange={(v) => setStatus(v as AssignmentOverrideStatus)}>
              <SelectTrigger id="override-status">
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
              <Button type="button" intent="secondary" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting} loading={submitting}>
              <Save className="size-4" aria-hidden /> {isEdit ? 'Save changes' : 'Create override'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
