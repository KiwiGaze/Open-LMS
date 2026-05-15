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
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useCreateCourseCalendarEventMutation } from '@/lib/api/queries/course-calendar.ts';
import type { CourseCalendarEventVisibility } from '@openlms/contracts';
import { useEffect, useState } from 'react';

type Props = {
  tenantId: string | null;
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function CalendarEventDialog({ tenantId, courseId, open, onOpenChange }: Props) {
  const { publish } = useToast();
  const create = useCreateCourseCalendarEventMutation(tenantId, courseId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [visibility, setVisibility] = useState<CourseCalendarEventVisibility>('published');
  const [recurrenceRule, setRecurrenceRule] = useState('');
  const [startsAtError, setStartsAtError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setLocation('');
      setStartsAt('');
      setEndsAt('');
      setVisibility('published');
      setRecurrenceRule('');
      setStartsAtError(null);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStartsAtError(null);
    const startsIso = toIso(startsAt);
    if (!startsIso) {
      setStartsAtError('Start time is required.');
      return;
    }
    try {
      await create.mutateAsync({
        title: title.trim(),
        description: description.trim() === '' ? null : description.trim(),
        location: location.trim() === '' ? null : location.trim(),
        startsAt: startsIso,
        endsAt: toIso(endsAt),
        visibility,
        recurrenceRule: recurrenceRule.trim() === '' ? null : recurrenceRule.trim(),
      });
      publish({ tone: 'success', title: 'Event created' });
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
          <DialogTitle>New course event</DialogTitle>
          <DialogDescription>
            Lecture, office hour, study session — anything you want on the course calendar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Title" id="ce-title" required>
            <Input
              id="ce-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={180}
              placeholder="Weekly lecture"
              autoFocus
            />
          </FormField>
          <FormField label="Description" id="ce-description">
            <Textarea
              id="ce-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="What attendees should expect."
            />
          </FormField>
          <FormField label="Location" id="ce-location">
            <Input
              id="ce-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={180}
              placeholder="Room 204 or Zoom link"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Starts at" id="ce-startsAt" error={startsAtError} required>
              <Input
                id="ce-startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </FormField>
            <FormField label="Ends at" id="ce-endsAt">
              <Input
                id="ce-endsAt"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Recurrence (RRULE)" id="ce-rrule">
            <Input
              id="ce-rrule"
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value)}
              placeholder="FREQ=WEEKLY;COUNT=10"
              maxLength={1000}
            />
          </FormField>
          <FormField label="Visibility" id="ce-visibility" required>
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as CourseCalendarEventVisibility)}
            >
              <SelectTrigger id="ce-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
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
            <Button
              type="submit"
              disabled={!title.trim() || create.isPending}
              loading={create.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
