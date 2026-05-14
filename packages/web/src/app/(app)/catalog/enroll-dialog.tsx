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
import { useSelfEnrollMutation } from '@/lib/api/queries/courses.ts';
import type { CatalogCourse } from '@openlms/contracts';
import { GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function EnrollDialog({
  tenantId,
  course,
  open,
  onOpenChange,
}: {
  tenantId: string | null;
  course: CatalogCourse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { publish } = useToast();
  const enroll = useSelfEnrollMutation(tenantId);

  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEnrollmentCode('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!course) return;
    const trimmed = enrollmentCode.trim();
    if (!trimmed) {
      setError('Enter the enrollment code from your instructor.');
      return;
    }
    setError(null);
    try {
      await enroll.mutateAsync({ courseId: course.id, enrollmentCode: trimmed });
      publish({ tone: 'success', title: `Enrolled in ${course.code}` });
      onOpenChange(false);
      router.push(`/courses/${course.id}`);
    } catch (e) {
      const message = e instanceof ApiHttpError ? e.message : 'Could not enroll. Try again.';
      setError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {course ? `Enroll in ${course.code} · ${course.title}` : 'Enroll in course'}
          </DialogTitle>
          <DialogDescription>
            Enter the enrollment code shared by the course instructor.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Enrollment code"
            id="enroll-code"
            required
            error={error}
            description="Codes are case-sensitive."
          >
            <Input
              id="enroll-code"
              type="text"
              maxLength={64}
              value={enrollmentCode}
              onChange={(e) => {
                setEnrollmentCode(e.target.value);
                if (error) setError(null);
              }}
              placeholder="JOIN-WRIT-101"
              required
              autoFocus
            />
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={enroll.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={enroll.isPending} loading={enroll.isPending}>
              <GraduationCap className="size-4" aria-hidden /> Enroll
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
