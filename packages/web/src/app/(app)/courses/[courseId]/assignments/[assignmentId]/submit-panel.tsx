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
import { Textarea } from '@/components/ui/textarea.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { apiFetch } from '@/lib/api/client.ts';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useState } from 'react';

export function SubmitAssignmentPanel({
  tenantId,
  courseId,
  assignmentId,
}: {
  tenantId: string | null;
  courseId: string;
  assignmentId: string;
}) {
  const [text, setText] = useState('');
  const { publish } = useToast();
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: async () => {
      // Create a draft, then submit it. Drafts carry block-structured content.
      const draft = await apiFetch<{ id: string }>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/drafts`,
        { method: 'POST', body: { blocks: [{ blockId: 'main', text }] } },
      );
      await apiFetch(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/drafts/${draft.id}/submit`,
        { method: 'POST', responseType: 'void' },
      );
    },
    onSuccess: () => {
      setText('');
      publish({ tone: 'success', title: 'Submission sent' });
      queryClient.invalidateQueries({
        queryKey: ['courses', tenantId, courseId, 'assignments', assignmentId, 'submissions'],
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not submit. Try again.';
      publish({ tone: 'danger', title: 'Submission failed', description: message });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit your work</CardTitle>
        <CardDescription>
          Paste your response below. You can also save a draft and finish later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField label="Your response" id="submission-body">
          <Textarea
            id="submission-body"
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your submission here..."
          />
        </FormField>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button intent="secondary" disabled={!text.trim() || submit.isPending}>
            Save draft
          </Button>
          <Button
            onClick={() => submit.mutate()}
            loading={submit.isPending}
            disabled={!text.trim()}
          >
            <Send className="size-4" aria-hidden /> Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
