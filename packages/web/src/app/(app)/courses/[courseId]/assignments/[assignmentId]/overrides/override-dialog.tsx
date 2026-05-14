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
import { useCourseGroupsQuery } from '@/lib/api/queries/groups.ts';
import { useMessageableUsersQuery } from '@/lib/api/queries/messaging.ts';
import { useCourseSectionsQuery } from '@/lib/api/queries/sections.ts';
import type {
  AssignmentOverride,
  AssignmentOverrideStatus,
  AssignmentOverrideTargetType,
} from '@openlms/contracts';
import { Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
  const messageable = useMessageableUsersQuery(tenantId, courseId);
  const sections = useCourseSectionsQuery(tenantId, courseId);
  const groups = useCourseGroupsQuery(tenantId, courseId);
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

  const candidates = useMemo(() => {
    switch (targetType) {
      case 'user':
        return (
          messageable.data?.map((m) => ({
            id: m.userId,
            label: `${m.displayName} · ${m.role.replace(/_/g, ' ')}`,
          })) ?? []
        );
      case 'section':
        return sections.data?.map((s) => ({ id: s.id, label: s.name })) ?? [];
      case 'group':
        return groups.data?.map((g) => ({ id: g.id, label: g.name })) ?? [];
    }
  }, [targetType, messageable.data, sections.data, groups.data]);

  const candidatesLoading =
    (targetType === 'user' && messageable.isLoading) ||
    (targetType === 'section' && sections.isLoading) ||
    (targetType === 'group' && groups.isLoading);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTargetIdError(null);

    if (!targetId) {
      setTargetIdError('Pick a target.');
      return;
    }

    const input: AssignmentOverrideInput = {
      targetType,
      targetId,
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
              onValueChange={(v) => {
                setTargetType(v as AssignmentOverrideTargetType);
                setTargetId('');
                setTargetIdError(null);
              }}
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
            label="Target"
            id="target-id"
            required
            error={targetIdError}
            description={
              targetType === 'user'
                ? 'Choose a course member.'
                : targetType === 'section'
                  ? 'Choose a course section.'
                  : 'Choose a course group.'
            }
          >
            <Select
              value={targetId}
              onValueChange={(v) => setTargetId(v)}
              disabled={isEdit || candidatesLoading}
            >
              <SelectTrigger id="target-id">
                <SelectValue
                  placeholder={
                    candidatesLoading
                      ? 'Loading…'
                      : candidates.length === 0
                        ? `No ${targetType}s available`
                        : `Pick a ${targetType}`
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
