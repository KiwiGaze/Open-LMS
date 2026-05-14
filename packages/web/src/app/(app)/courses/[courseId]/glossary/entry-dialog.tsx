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
import {
  type GlossaryEntryInput,
  useCreateGlossaryEntryMutation,
  useUpdateGlossaryEntryMutation,
} from '@/lib/api/queries/glossary.ts';
import type { GlossaryEntry, GlossaryEntryStatus } from '@openlms/contracts';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';

export function GlossaryEntryDialog({
  tenantId,
  courseId,
  open,
  onOpenChange,
  existing,
}: {
  tenantId: string | null;
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: GlossaryEntry | null;
}) {
  const { publish } = useToast();
  const create = useCreateGlossaryEntryMutation(tenantId, courseId);
  const update = useUpdateGlossaryEntryMutation(tenantId, courseId);
  const isEdit = Boolean(existing);
  const submitting = create.isPending || update.isPending;

  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [status, setStatus] = useState<GlossaryEntryStatus>('published');

  useEffect(() => {
    if (open) {
      setTerm(existing?.term ?? '');
      setDefinition(existing?.definition ?? '');
      setStatus(existing?.status ?? 'published');
    }
  }, [open, existing]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTerm = term.trim();
    const trimmedDefinition = definition.trim();
    if (!trimmedTerm || !trimmedDefinition) return;

    const input: GlossaryEntryInput = {
      term: trimmedTerm,
      definition: trimmedDefinition,
      status,
    };

    try {
      if (existing) {
        await update.mutateAsync({ entryId: existing.id, input });
      } else {
        await create.mutateAsync(input);
      }
      publish({ tone: 'success', title: isEdit ? 'Entry saved' : 'Entry created' });
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
          <DialogTitle>{isEdit ? 'Edit glossary entry' : 'New glossary entry'}</DialogTitle>
          <DialogDescription>
            Terms are course-scoped. Use Draft while you're still writing — students only see
            Published entries.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Term" id="glossary-term" required>
            <Input
              id="glossary-term"
              type="text"
              maxLength={160}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="thesis"
              required
            />
          </FormField>

          <FormField label="Definition" id="glossary-definition" required>
            <Textarea
              id="glossary-definition"
              rows={6}
              maxLength={4000}
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="A central claim supported by evidence and reasoning."
              required
            />
          </FormField>

          <FormField label="Status" id="glossary-status">
            <Select value={status} onValueChange={(v) => setStatus(v as GlossaryEntryStatus)}>
              <SelectTrigger id="glossary-status">
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
              <Button type="button" intent="secondary" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting} loading={submitting}>
              <Save className="size-4" aria-hidden /> {isEdit ? 'Save changes' : 'Create entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
