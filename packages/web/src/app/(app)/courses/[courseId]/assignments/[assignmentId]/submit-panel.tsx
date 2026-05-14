'use client';

import { FormField } from '@/components/patterns/form-field.tsx';
import { Badge } from '@/components/ui/badge.tsx';
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
import { queryKeys } from '@/lib/api/keys.ts';
import {
  useCreateSubmissionAttachmentMutation,
  useUploadFileMutation,
} from '@/lib/api/queries/files.ts';
import { fileExtension, fileToBase64, formatBytes } from '@/lib/files/encoding.ts';
import { ulid } from '@/lib/ids.ts';
import type { FileMetadata, Submission } from '@openlms/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, FileText, Paperclip, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';

const HARD_MAX_BYTES = 25 * 1024 * 1024;

type AttachmentEntry = {
  localId: string;
  file: File;
  uploaded?: FileMetadata;
  attachmentError?: string;
};

export function SubmitAssignmentPanel({
  tenantId,
  courseId,
  assignmentId,
  allowedExtensions,
  maxFileSizeBytes,
}: {
  tenantId: string | null;
  courseId: string;
  assignmentId: string;
  allowedExtensions: string[];
  maxFileSizeBytes: number | null;
}) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<AttachmentEntry[]>([]);
  const [partialSubmission, setPartialSubmission] = useState<Submission | null>(null);
  const draftIdRef = useRef<string>(ulid());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { publish } = useToast();
  const queryClient = useQueryClient();

  const upload = useUploadFileMutation(tenantId);
  const createAttachment = useCreateSubmissionAttachmentMutation(tenantId, courseId, assignmentId);

  const effectiveMaxBytes = Math.min(
    HARD_MAX_BYTES,
    maxFileSizeBytes && maxFileSizeBytes > 0 ? maxFileSizeBytes : HARD_MAX_BYTES,
  );

  const acceptAttr =
    allowedExtensions.length > 0 ? allowedExtensions.map((ext) => `.${ext}`).join(',') : undefined;

  const validateFile = (file: File): string | null => {
    if (file.size === 0) return `${file.name} is empty.`;
    if (file.size > effectiveMaxBytes) {
      return `${file.name} is larger than ${formatBytes(effectiveMaxBytes)}.`;
    }
    if (allowedExtensions.length > 0) {
      const ext = fileExtension(file.name);
      if (!allowedExtensions.includes(ext)) {
        return `${file.name} has an unsupported file type. Allowed: ${allowedExtensions.map((e) => `.${e}`).join(', ')}.`;
      }
    }
    return null;
  };

  const handlePickFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    const accepted: AttachmentEntry[] = [];
    for (const file of picked) {
      const err = validateFile(file);
      if (err) {
        publish({ tone: 'danger', title: 'File rejected', description: err });
        continue;
      }
      accepted.push({ localId: ulid(), file });
    }
    if (accepted.length > 0) {
      setAttachments((prev) => [...prev, ...accepted]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (localId: string) => {
    setAttachments((prev) => prev.filter((a) => a.localId !== localId));
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error('No active tenant');

      // Phase 1 — upload files. Visibility 'private' is the only value
      // students can set; instructors read attachments via the submission scope.
      // Commit progress to state after each successful upload so a mid-loop
      // failure doesn't lose track of files already persisted server-side.
      const uploaded: AttachmentEntry[] = [];
      for (const entry of attachments) {
        if (entry.uploaded) {
          uploaded.push(entry);
          continue;
        }
        const contentBase64 = await fileToBase64(entry.file);
        const file = await upload.mutateAsync({
          courseId: null,
          filename: entry.file.name,
          mediaType: entry.file.type || 'application/octet-stream',
          contentBase64,
          visibility: 'private',
        });
        const next: AttachmentEntry = { ...entry, uploaded: file };
        uploaded.push(next);
        setAttachments((prev) => prev.map((a) => (a.localId === entry.localId ? next : a)));
      }

      // Phase 2 — submit the draft. submitAssignmentDraft upserts the draft
      // server-side, so a single POST is enough; client supplies a fresh ulid.
      const submission = await apiFetch<Submission>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/drafts/${draftIdRef.current}/submit`,
        {
          method: 'POST',
          body: { blocks: [{ blockId: 'main', text }] },
        },
      );

      // Phase 3 — attach each uploaded file. Collect per-attachment failures
      // so the user can retry only the ones that failed.
      let failedCount = 0;
      const next: AttachmentEntry[] = [];
      for (const entry of uploaded) {
        if (!entry.uploaded) continue;
        try {
          await createAttachment.mutateAsync({
            submissionId: submission.id,
            fileResourceId: entry.uploaded.id,
            displayName: entry.file.name,
          });
          next.push({ ...entry, attachmentError: undefined });
        } catch (error) {
          failedCount += 1;
          const message = error instanceof ApiHttpError ? error.message : 'Attachment failed';
          next.push({ ...entry, attachmentError: message });
        }
      }
      setAttachments(next);

      return { submission, failedCount };
    },
    onSuccess: ({ submission, failedCount }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentSubmissions(tenantId ?? '', courseId, assignmentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.submissionAttachments(
          tenantId ?? '',
          courseId,
          assignmentId,
          submission.id,
        ),
      });
      if (failedCount === 0) {
        publish({ tone: 'success', title: 'Submitted', description: 'Your work has been sent.' });
        setText('');
        setAttachments([]);
        setPartialSubmission(null);
        draftIdRef.current = ulid();
      } else {
        setPartialSubmission(submission);
        publish({
          tone: 'warning',
          title: 'Submitted with errors',
          description: `${failedCount} attachment${failedCount === 1 ? '' : 's'} could not be attached. Retry below.`,
        });
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not submit. Try again.';
      publish({ tone: 'danger', title: 'Submission failed', description: message });
    },
  });

  const retryFailedAttachments = useMutation({
    mutationFn: async () => {
      if (!partialSubmission) return;
      const next: AttachmentEntry[] = [];
      let stillFailing = 0;
      for (const entry of attachments) {
        if (entry.attachmentError && entry.uploaded) {
          try {
            await createAttachment.mutateAsync({
              submissionId: partialSubmission.id,
              fileResourceId: entry.uploaded.id,
              displayName: entry.file.name,
            });
            next.push({ ...entry, attachmentError: undefined });
          } catch (error) {
            stillFailing += 1;
            const message = error instanceof ApiHttpError ? error.message : 'Attachment failed';
            next.push({ ...entry, attachmentError: message });
          }
        } else {
          next.push(entry);
        }
      }
      setAttachments(next);
      return { stillFailing };
    },
    onSuccess: (result) => {
      if (!result) return;
      if (partialSubmission) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.submissionAttachments(
            tenantId ?? '',
            courseId,
            assignmentId,
            partialSubmission.id,
          ),
        });
      }
      if (result.stillFailing === 0) {
        publish({ tone: 'success', title: 'All attachments attached' });
        setPartialSubmission(null);
        setText('');
        setAttachments([]);
        draftIdRef.current = ulid();
      } else {
        publish({
          tone: 'danger',
          title: 'Retry failed',
          description: `${result.stillFailing} attachment${result.stillFailing === 1 ? '' : 's'} still failing.`,
        });
      }
    },
  });

  const hasText = text.trim().length > 0;
  const hasContent = hasText || attachments.length > 0;
  const submitDisabled = !hasContent || submit.isPending || partialSubmission !== null;
  const phaseLabel = submit.isPending ? 'Submitting…' : 'Submit';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit your work</CardTitle>
        <CardDescription>
          Write your response and attach any files. Submission creates a new attempt.
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
            disabled={submit.isPending}
          />
        </FormField>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-(--color-text-default)">Attachments</p>
            <Button
              type="button"
              intent="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={submit.isPending}
            >
              <Paperclip className="size-4" aria-hidden /> Add files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptAttr}
              className="hidden"
              onChange={handlePickFiles}
            />
          </div>
          {allowedExtensions.length > 0 || maxFileSizeBytes ? (
            <p className="text-xs text-(--color-text-subtle)">
              {allowedExtensions.length > 0
                ? `Allowed: ${allowedExtensions.map((e) => `.${e}`).join(', ')}`
                : 'Any file type'}
              {maxFileSizeBytes ? ` · Max ${formatBytes(maxFileSizeBytes)} per file` : ''}
            </p>
          ) : null}

          {attachments.length > 0 ? (
            <ul className="flex flex-col divide-y divide-(--color-border-subtle) overflow-hidden rounded-[var(--radius-md)] border border-(--color-border-subtle)">
              {attachments.map((entry) => (
                <li key={entry.localId} className="flex items-center gap-2 px-3 py-2">
                  <FileText className="size-4 text-(--color-text-muted)" aria-hidden />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm text-(--color-text-default)">
                      {entry.file.name}
                    </span>
                    <span className="text-xs text-(--color-text-subtle)">
                      {formatBytes(entry.file.size)}
                    </span>
                  </div>
                  {entry.attachmentError ? (
                    <Badge tone="danger">Attach failed</Badge>
                  ) : entry.uploaded ? (
                    <Badge tone="success">Uploaded</Badge>
                  ) : null}
                  <Button
                    type="button"
                    intent="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${entry.file.name}`}
                    onClick={() => removeAttachment(entry.localId)}
                    disabled={submit.isPending}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {partialSubmission ? (
          <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-(--color-warning-200) bg-(--color-warning-50) px-3 py-2.5 text-sm text-(--color-warning-700)">
            <AlertCircle className="mt-0.5 size-4 flex-shrink-0" aria-hidden />
            <div className="flex-1">
              <p className="font-medium">
                Your text was submitted, but some attachments did not attach.
              </p>
              <p className="text-xs">
                Submission ID: <code className="font-mono">{partialSubmission.id.slice(-12)}</code>
              </p>
            </div>
            <Button
              type="button"
              intent="secondary"
              size="sm"
              onClick={() => retryFailedAttachments.mutate()}
              loading={retryFailedAttachments.isPending}
            >
              Retry
            </Button>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            onClick={() => submit.mutate()}
            loading={submit.isPending}
            disabled={submitDisabled}
          >
            <Send className="size-4" aria-hidden /> {phaseLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
