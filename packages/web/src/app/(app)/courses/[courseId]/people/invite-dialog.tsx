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
import { useCreateCourseMembershipMutation } from '@/lib/api/queries/memberships.ts';
import type { CourseRole } from '@openlms/contracts';
import { UserPlus } from 'lucide-react';
import { type FormEvent, useState } from 'react';

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export function InviteMemberDialog({
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
  const create = useCreateCourseMembershipMutation(tenantId, courseId);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<CourseRole>('student');
  const [userIdError, setUserIdError] = useState<string | null>(null);

  const reset = () => {
    setUserId('');
    setRole('student');
    setUserIdError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUserIdError(null);
    const trimmed = userId.trim();
    if (!ULID_RE.test(trimmed)) {
      setUserIdError('Enter a valid User ID (26-character ULID).');
      return;
    }

    try {
      await create.mutateAsync({ userId: trimmed, role });
      publish({ tone: 'success', title: 'Member added' });
      reset();
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not invite. Try again.';
      publish({ tone: 'danger', title: 'Invite failed', description: message });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Add an existing tenant user to this course. Use the bulk import for many at once.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="User ID"
            id="user-id"
            required
            error={userIdError}
            description="26-character ULID. Find this on the user's profile or roster export."
          >
            <Input
              id="user-id"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="01J9QW7B6N5W2YH3D3A1V0KE85"
              autoFocus
            />
          </FormField>

          <FormField label="Role" id="role">
            <Select value={role} onValueChange={(v) => setRole(v as CourseRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teaching_assistant">Teaching assistant</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="course_admin">Course admin</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={create.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" loading={create.isPending} disabled={create.isPending}>
              <UserPlus className="size-4" aria-hidden /> Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
