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
import { useCourseGroupsQuery } from '@/lib/api/queries/groups.ts';
import { useMessageableUsersQuery } from '@/lib/api/queries/messaging.ts';
import { useCourseSectionsQuery } from '@/lib/api/queries/sections.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { AssignmentOverride, AssignmentOverrideTargetType } from '@openlms/contracts';
import { ArrowLeft, CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { use, useMemo, useState } from 'react';
import { OverrideDialog } from './override-dialog.tsx';

type Params = { courseId: string; assignmentId: string };

export default function AssignmentOverridesPage({ params }: { params: Promise<Params> }) {
  const { courseId, assignmentId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();

  const assignment = useAssignmentQuery(tenantId, courseId, assignmentId);
  const overrides = useAssignmentOverridesQuery(tenantId, courseId, assignmentId);
  const deleteOverride = useDeleteAssignmentOverrideMutation(tenantId, courseId, assignmentId);
  const messageable = useMessageableUsersQuery(tenantId, courseId);
  const sections = useCourseSectionsQuery(tenantId, courseId);
  const groups = useCourseGroupsQuery(tenantId, courseId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AssignmentOverride | null>(null);

  const resolveTargetName = useMemo(() => {
    const userLookup = new Map<string, string>(
      messageable.data?.map((m) => [m.userId, m.displayName]) ?? [],
    );
    const sectionLookup = new Map<string, string>(sections.data?.map((s) => [s.id, s.name]) ?? []);
    const groupLookup = new Map<string, string>(groups.data?.map((g) => [g.id, g.name]) ?? []);
    return (targetType: AssignmentOverrideTargetType, targetId: string): string => {
      switch (targetType) {
        case 'user':
          return userLookup.get(targetId) ?? targetId.slice(-12);
        case 'section':
          return sectionLookup.get(targetId) ?? targetId.slice(-12);
        case 'group':
          return groupLookup.get(targetId) ?? targetId.slice(-12);
      }
    };
  }, [messageable.data, sections.data, groups.data]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (override: AssignmentOverride) => {
    setEditing(override);
    setDialogOpen(true);
  };

  const handleDelete = async (override: AssignmentOverride) => {
    const name = resolveTargetName(override.targetType, override.targetId);
    if (!window.confirm(`Delete override for ${name}?`)) return;
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
                <TableCell className="text-sm text-(--color-text-default)">
                  {resolveTargetName(override.targetType, override.targetId)}
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
        onOpenChange={setDialogOpen}
        existing={editing}
      />
    </div>
  );
}
