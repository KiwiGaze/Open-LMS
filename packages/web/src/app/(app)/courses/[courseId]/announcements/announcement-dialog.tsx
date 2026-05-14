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
import { Label } from '@/components/ui/label.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  type CourseAnnouncementInput,
  useCreateCourseAnnouncementMutation,
  useUpdateCourseAnnouncementMutation,
} from '@/lib/api/queries/announcements.ts';
import type { CourseAnnouncement } from '@openlms/contracts';
import { Save, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
  tenantId: string | null;
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog is in edit mode. */
  existing?: CourseAnnouncement | null;
};

export function AnnouncementDialog({ tenantId, courseId, open, onOpenChange, existing }: Props) {
  const { publish } = useToast();
  const create = useCreateCourseAnnouncementMutation(tenantId, courseId);
  const update = useUpdateCourseAnnouncementMutation(tenantId, courseId);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [submitAs, setSubmitAs] = useState<'draft' | 'published'>('published');

  // Sync state when dialog opens or existing changes.
  useEffect(() => {
    if (open) {
      setTitle(existing?.title ?? '');
      setBody(existing?.body ?? '');
      setPinned(existing?.pinned ?? false);
      // The update body accepts only 'draft' | 'published'; archived rows
      // default to publishing on next save.
      setSubmitAs(existing?.status === 'draft' ? 'draft' : 'published');
    }
  }, [open, existing]);

  const submitting = create.isPending || update.isPending;
  const isEdit = Boolean(existing);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
    status: 'draft' | 'published',
  ) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) return;

    const input: CourseAnnouncementInput = {
      title: trimmedTitle,
      body: trimmedBody,
      status,
      pinned,
    };

    try {
      if (existing) {
        await update.mutateAsync({ announcementId: existing.id, input });
      } else {
        await create.mutateAsync(input);
      }
      publish({
        tone: 'success',
        title: isEdit
          ? 'Announcement saved'
          : status === 'published'
            ? 'Announcement posted'
            : 'Draft saved',
      });
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
          <DialogTitle>{isEdit ? 'Edit announcement' : 'New announcement'}</DialogTitle>
          <DialogDescription>
            Posts to all enrolled course members when published.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => handleSubmit(e, submitAs)}
          className="flex flex-col gap-4"
          id="announcement-form"
        >
          <FormField label="Title" id="title" required>
            <Input
              id="title"
              type="text"
              maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Essay workshop reminder"
              required
            />
          </FormField>

          <FormField label="Body" id="body" required>
            <Textarea
              id="body"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the announcement…"
              required
            />
          </FormField>

          <div className="flex items-center gap-2">
            <Switch id="pinned" checked={pinned} onCheckedChange={setPinned} />
            <Label htmlFor="pinned" className="cursor-pointer">
              Pin to the top of the announcements list
            </Label>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" intent="secondary" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form="announcement-form"
              intent="secondary"
              disabled={submitting || !title.trim() || !body.trim()}
              onClick={() => setSubmitAs('draft')}
            >
              <Save className="size-4" aria-hidden /> Save draft
            </Button>
            <Button
              type="submit"
              form="announcement-form"
              disabled={submitting || !title.trim() || !body.trim()}
              loading={submitting && submitAs === 'published'}
              onClick={() => setSubmitAs('published')}
            >
              <Send className="size-4" aria-hidden /> {isEdit ? 'Save & publish' : 'Publish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
