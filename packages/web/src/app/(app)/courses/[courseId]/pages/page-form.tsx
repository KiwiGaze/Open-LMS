'use client';

import { FormField } from '@/components/patterns/form-field.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
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
import type { CoursePageInput } from '@/lib/api/queries/pages.ts';
import type { CoursePageVisibility } from '@openlms/contracts';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

type Props = {
  courseId: string;
  initial?: Partial<CoursePageInput>;
  submitting: boolean;
  onSubmit: (input: CoursePageInput) => Promise<unknown>;
  submitLabel: string;
};

export function CoursePageForm({ courseId, initial, submitting, onSubmit, submitLabel }: Props) {
  const router = useRouter();
  const { publish } = useToast();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [visibility, setVisibility] = useState<CoursePageVisibility>(
    initial?.visibility ?? 'draft',
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTitleError(null);
    setBodyError(null);
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle) {
      setTitleError('Title is required.');
      return;
    }
    if (trimmedTitle.length > 180) {
      setTitleError('Title must be 180 characters or fewer.');
      return;
    }
    if (!trimmedBody) {
      setBodyError('Body is required.');
      return;
    }
    try {
      await onSubmit({
        title: trimmedTitle,
        body: trimmedBody,
        visibility,
        learningObjectiveIds: initial?.learningObjectiveIds ?? [],
      });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not save. Try again.';
      publish({ tone: 'danger', title: 'Save failed', description: message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Page content</CardTitle>
          <CardDescription>Title, body, and visibility for the page.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormField label="Title" id="title" required error={titleError}>
            <Input
              id="title"
              type="text"
              maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reading list for week 1"
            />
          </FormField>
          <FormField
            label="Body"
            id="body"
            required
            error={bodyError}
            description="Markdown allowed."
          >
            <Textarea
              id="body"
              rows={16}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the page content here…"
            />
          </FormField>
          <FormField label="Visibility" id="visibility">
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as CoursePageVisibility)}
            >
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft — only staff can see</SelectItem>
                <SelectItem value="published">Published — visible to course members</SelectItem>
                <SelectItem value="archived">Archived — hidden by default</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          intent="secondary"
          onClick={() => router.push(`/courses/${courseId}/pages`)}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" loading={submitting} disabled={submitting}>
          <Save className="size-4" aria-hidden /> {submitLabel}
        </Button>
      </div>
    </form>
  );
}
