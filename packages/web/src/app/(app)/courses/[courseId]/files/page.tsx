'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useCourseFilesQuery,
  useDeleteFileMutation,
  useDownloadFileMutation,
} from '@/lib/api/queries/files.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatBytes } from '@/lib/files/encoding.ts';
import { formatDate } from '@/lib/format.ts';
import type { FileVisibility } from '@openlms/contracts';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { use, useState } from 'react';
import { UploadFileDialog } from './upload-dialog.tsx';

type Params = { courseId: string };

const VISIBILITY_TONE: Record<FileVisibility, 'success' | 'info' | 'warning' | 'neutral'> = {
  course_member: 'success',
  course_staff: 'info',
  owner_and_instructors: 'info',
  private: 'neutral',
};

const VISIBILITY_LABEL: Record<FileVisibility, string> = {
  course_member: 'course members',
  course_staff: 'staff',
  owner_and_instructors: 'you & instructors',
  private: 'private',
};

export default function CourseFilesPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);

  const files = useCourseFilesQuery(tenantId, courseId);
  const download = useDownloadFileMutation(tenantId);
  const deleteFile = useDeleteFileMutation(tenantId, courseId);

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      await download.mutateAsync({ fileId, filename });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not download. Try again.';
      publish({ tone: 'danger', title: 'Download failed', description: message });
    }
  };

  const handleDelete = async (fileId: string, filename: string) => {
    if (!window.confirm(`Delete "${filename}"? This cannot be undone.`)) return;
    try {
      await deleteFile.mutateAsync(fileId);
      publish({ tone: 'success', title: 'File deleted', description: filename });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not delete. Try again.';
      publish({ tone: 'danger', title: 'Delete failed', description: message });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-(--color-text-muted)">Course documents and media.</p>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="size-4" aria-hidden /> Upload file
        </Button>
      </div>

      {files.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      ) : files.error ? (
        <ErrorState error={files.error} onRetry={() => files.refetch()} />
      ) : (files.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={FileText}
          title="No files yet"
          description="Upload PDFs, slides, images, or media for your students."
          action={
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="size-4" aria-hidden /> Upload file
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead style={{ width: 180 }}>Type</TableHead>
              <TableHead style={{ width: 120, textAlign: 'right' }}>Size</TableHead>
              <TableHead style={{ width: 160 }}>Visibility</TableHead>
              <TableHead style={{ width: 140 }}>Uploaded</TableHead>
              <TableHead style={{ width: 180, textAlign: 'right' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.data?.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium text-(--color-text-default)">
                  {file.filename}
                </TableCell>
                <TableCell className="text-xs font-mono text-(--color-text-muted)">
                  {file.mediaType}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatBytes(file.byteSize)}
                </TableCell>
                <TableCell>
                  <Badge tone={VISIBILITY_TONE[file.visibility]}>
                    {VISIBILITY_LABEL[file.visibility]}
                  </Badge>
                </TableCell>
                <TableCell className="text-(--color-text-muted)">
                  {formatDate(file.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      intent="ghost"
                      size="icon-sm"
                      aria-label={`Download ${file.filename}`}
                      onClick={() => handleDownload(file.id, file.filename)}
                      disabled={download.isPending}
                    >
                      <Download className="size-4" aria-hidden />
                    </Button>
                    <Button
                      intent="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${file.filename}`}
                      onClick={() => handleDelete(file.id, file.filename)}
                      disabled={deleteFile.isPending}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <UploadFileDialog
        tenantId={tenantId}
        courseId={courseId}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />
    </div>
  );
}
