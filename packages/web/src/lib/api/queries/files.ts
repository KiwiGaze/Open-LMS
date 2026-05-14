'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  CreateFileUpload,
  FileMetadata,
  FileVisibility,
  SubmissionAttachment,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type UploadFileInput = {
  courseId: string | null;
  filename: string;
  mediaType: string;
  contentBase64: string;
  visibility: FileVisibility;
  altText?: string | null;
  transcriptText?: string | null;
  license?: string | null;
  copyrightHolder?: string | null;
};

export function useCourseFilesQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.courseFiles(tenantId, courseId)
        : ['files', 'course', 'inactive'],
    queryFn: () => apiFetch<FileMetadata[]>(`/tenants/${tenantId}/files`, { query: { courseId } }),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useUploadFileMutation(tenantId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadFileInput) => {
      const body: CreateFileUpload = {
        courseId: (input.courseId ?? null) as CreateFileUpload['courseId'],
        filename: input.filename,
        mediaType: input.mediaType,
        contentBase64: input.contentBase64,
        visibility: input.visibility,
        altText: input.altText ?? null,
        transcriptText: input.transcriptText ?? null,
        license: input.license ?? null,
        copyrightHolder: input.copyrightHolder ?? null,
      };
      return apiFetch<FileMetadata>(`/tenants/${tenantId}/files`, {
        method: 'POST',
        body,
      });
    },
    onSuccess: (file) => {
      if (!tenantId) return;
      if (file.courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseFiles(tenantId, file.courseId),
        });
      }
    },
  });
}

export function useDeleteFileMutation(tenantId: string | null, courseId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) =>
      apiFetch<void>(`/tenants/${tenantId}/files/${fileId}`, {
        method: 'DELETE',
        responseType: 'void',
      }),
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseFiles(tenantId, courseId),
        });
      }
    },
  });
}

/**
 * Trigger a browser download for a file owned-by or accessible-to the caller.
 * Uses Blob + ObjectURL so the bearer token can be applied via fetch.
 */
export function useDownloadFileMutation(tenantId: string | null) {
  return useMutation({
    mutationFn: async ({ fileId, filename }: { fileId: string; filename: string }) => {
      const blob = await apiFetch<Blob>(`/tenants/${tenantId}/files/${fileId}/download`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Safari/older Firefox can race revoke against the download dispatch.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    },
  });
}

export function useSubmissionAttachmentsQuery(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
  submissionId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && assignmentId && submissionId
        ? queryKeys.submissionAttachments(tenantId, courseId, assignmentId, submissionId)
        : ['submission-attachments', 'inactive'],
    queryFn: () =>
      apiFetch<SubmissionAttachment[]>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/attachments`,
      ),
    enabled: Boolean(tenantId && courseId && assignmentId && submissionId),
  });
}

export function useCreateSubmissionAttachmentMutation(
  tenantId: string | null,
  courseId: string | null,
  assignmentId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      submissionId,
      fileResourceId,
      displayName,
    }: {
      submissionId: string;
      fileResourceId: string;
      displayName?: string | null;
    }) =>
      apiFetch<SubmissionAttachment>(
        `/tenants/${tenantId}/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/attachments`,
        {
          method: 'POST',
          body: { fileResourceId, displayName: displayName ?? null },
        },
      ),
  });
}
