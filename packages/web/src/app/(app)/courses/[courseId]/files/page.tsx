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
import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDate, formatNumber } from '@/lib/format.ts';
import { useQuery } from '@tanstack/react-query';
import { FileText, Upload } from 'lucide-react';
import { use } from 'react';

type Params = { courseId: string };

type FileItem = {
  id: string;
  filename: string;
  mediaType: string;
  byteSize: number;
  visibility: string;
  createdAt: string;
};

export default function CourseFilesPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);

  const files = useQuery({
    queryKey: tenantId ? queryKeys.courseFiles(tenantId, courseId) : ['files', 'inactive'],
    queryFn: () => apiFetch<FileItem[]>(`/tenants/${tenantId}/courses/${courseId}/files`),
    enabled: Boolean(tenantId),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-(--color-text-muted)">Course documents and media.</p>
        <Button>
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
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead style={{ width: 180 }}>Type</TableHead>
              <TableHead style={{ width: 120, textAlign: 'right' }}>Size</TableHead>
              <TableHead style={{ width: 120 }}>Visibility</TableHead>
              <TableHead style={{ width: 140 }}>Uploaded</TableHead>
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
                  {formatNumber(file.byteSize / 1024)} KB
                </TableCell>
                <TableCell>
                  <Badge tone={file.visibility === 'public' ? 'info' : 'neutral'}>
                    {file.visibility}
                  </Badge>
                </TableCell>
                <TableCell className="text-(--color-text-muted)">
                  {formatDate(file.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
