'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
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
  useAssignmentOverridesQuery,
  useDeleteAssignmentOverrideMutation,
} from '@/lib/api/queries/assignment-overrides.ts';
import { useAssignmentQuery } from '@/lib/api/queries/assignments.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { AssignmentOverride } from '@openlms/contracts';
import { ArrowLeft, CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
import { OverrideDialog } from './override-dialog.tsx';

type Params = { courseId: string; assignmentId: string };

export default function AssignmentOverridesPage({ params }: { params: Promise<Params> }) {
  const { courseId, assignmentId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();

  const assignment = useAssignmentQuery(tenantId, courseId, assignmentId);
  const overrides = useAssignmentOverridesQuery(tenantId, courseId, assignmentId);
  const deleteOverride = useDeleteAssignmentOverrideMutation(tenantId, courseId, assignmentId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AssignmentOverride | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (override: AssignmentOverride) => {
    setEditing(override);
    setDialogOpen(true);
  };

  const handleDelete = async (override: AssignmentOverride) => {
    if (!window.confirm(`Delete override for ${override.targetId.slice(-12)}?`)) return;
    try {
      await deleteOverride.mutateAsync(override.id);
      publish({ tone: 'success', title: 'Override deleted' });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not delete. Try again.';
      publish({ tone: 'danger', title: 'Delete failed', description: message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Assignment overrides"
        title={assignment.data ? `Overrides for “${assignment.data.title}”` : 'Overrides'}
        description="Customize availability and due dates for individual students, groups, or sections."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild intent="ghost">
              <Link href={`/courses/${courseId}/assignments/${assignmentId}`}>
                <ArrowLeft className="size-4" aria-hidden /> Back to assignment
              </Link>
            </Button>
            <Button onClick={openNew}>
              <Plus className="size-4" aria-hidden /> New override
            </Button>
          </div>
        }
      />

      {overrides.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      ) : overrides.error ? (
        <ErrorState error={overrides.error} onRetry={() => overrides.refetch()} />
      ) : (overrides.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No overrides"
          description="Apply per-student or per-section due-date adjustments here."
          action={
            <Button onClick={openNew}>
              <Plus className="size-4" aria-hidden /> New override
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 110 }}>Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Opens at</TableHead>
              <TableHead>Due at</TableHead>
              <TableHead>Closes at</TableHead>
              <TableHead style={{ width: 100 }}>Status</TableHead>
              <TableHead style={{ width: 100, textAlign: 'right' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overrides.data?.map((override) => (
              <TableRow key={override.id}>
                <TableCell>
                  <Badge tone="info">{override.targetType}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-(--color-text-default)">
                  {override.targetId.slice(-12)}
                </TableCell>
                <TableCell className="text-(--color-text-muted)">
                  {override.opensAt ? formatDateTime(override.opensAt) : '—'}
                </TableCell>
                <TableCell className="text-(--color-text-muted)">
                  {override.dueAt ? formatDateTime(override.dueAt) : '—'}
                </TableCell>
                <TableCell className="text-(--color-text-muted)">
                  {override.closesAt ? formatDateTime(override.closesAt) : '—'}
                </TableCell>
                <TableCell>
                  <Badge tone={override.status === 'active' ? 'success' : 'neutral'}>
                    {override.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      intent="ghost"
                      size="icon-sm"
                      aria-label="Edit override"
                      onClick={() => openEdit(override)}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                    <Button
                      intent="ghost"
                      size="icon-sm"
                      aria-label="Delete override"
                      onClick={() => handleDelete(override)}
                      disabled={deleteOverride.isPending}
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

      <OverrideDialog
        tenantId={tenantId}
        courseId={courseId}
        assignmentId={assignmentId}
        open={dialogOpen}
        onOpenChange={(next) => {
          setDialogOpen(next);
          if (!next) setEditing(null);
        }}
        existing={editing}
      />
    </div>
  );
}
