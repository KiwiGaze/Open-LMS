'use client';

import { DataTable, type DataTableColumn } from '@/components/patterns/data-table.tsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useCourseMembershipsQuery } from '@/lib/api/queries/gradebook.ts';
import {
  useDeleteCourseMembershipMutation,
  useUpdateCourseMembershipMutation,
} from '@/lib/api/queries/memberships.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { initialsOf } from '@/lib/format.ts';
import type { CourseMembership, CourseRole } from '@openlms/contracts';
import { Search, Trash2, Upload, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { use } from 'react';
import { BulkCsvDialog } from './bulk-csv-dialog.tsx';
import { InviteMemberDialog } from './invite-dialog.tsx';

type Params = { courseId: string };

const STAFF_ROLES = new Set<CourseRole>(['instructor', 'teaching_assistant', 'course_admin']);

const ROLE_TONE: Record<CourseRole, Parameters<typeof Badge>[0]['tone']> = {
  student: 'neutral',
  instructor: 'brand',
  teaching_assistant: 'info',
  course_admin: 'warning',
};

export default function CoursePeoplePage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const user = useSessionStore((s) => s.user);
  const { publish } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | CourseRole>('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);

  const memberships = useCourseMembershipsQuery(tenantId, courseId);
  const updateRole = useUpdateCourseMembershipMutation(tenantId, courseId);
  const remove = useDeleteCourseMembershipMutation(tenantId, courseId);

  const myMembership = memberships.data?.find((m) => m.userId === user?.id);
  const isStaff = myMembership ? STAFF_ROLES.has(myMembership.role) : false;

  const filtered = useMemo(() => {
    const all = memberships.data ?? [];
    return all.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (!search.trim()) return true;
      return m.userId.toLowerCase().includes(search.toLowerCase());
    });
  }, [memberships.data, search, roleFilter]);

  const handleRoleChange = async (membership: CourseMembership, role: CourseRole) => {
    if (role === membership.role) return;
    try {
      await updateRole.mutateAsync({ membershipId: membership.id, role });
      publish({ tone: 'success', title: 'Role updated' });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not update. Try again.';
      publish({ tone: 'danger', title: 'Update failed', description: message });
    }
  };

  const handleRemove = async (membership: CourseMembership) => {
    if (!window.confirm(`Remove ${membership.userId.slice(-12)} from this course?`)) return;
    try {
      await remove.mutateAsync(membership.id);
      publish({ tone: 'success', title: 'Member removed' });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not remove. Try again.';
      publish({ tone: 'danger', title: 'Remove failed', description: message });
    }
  };

  const columns: DataTableColumn<CourseMembership>[] = [
    {
      id: 'name',
      header: 'Member',
      cell: (m) => (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{initialsOf(m.userId.slice(-2))}</AvatarFallback>
          </Avatar>
          <span className="font-mono text-xs text-(--color-text-default)">
            {m.userId.slice(-12)}
          </span>
          {m.userId === user?.id ? <Badge tone="neutral">You</Badge> : null}
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      width: '200px',
      cell: (m) =>
        isStaff && m.userId !== user?.id ? (
          <Select
            value={m.role}
            onValueChange={(v) => handleRoleChange(m, v as CourseRole)}
            disabled={updateRole.isPending}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teaching_assistant">Teaching assistant</SelectItem>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="course_admin">Course admin</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge tone={ROLE_TONE[m.role] ?? 'neutral'}>{m.role.replace(/_/g, ' ')}</Badge>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      width: '140px',
      cell: (m) => (
        <Badge tone={m.status === 'active' ? 'success' : 'neutral'}>
          {m.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    ...(isStaff
      ? [
          {
            id: 'actions',
            header: '',
            width: '64px',
            cell: (m: CourseMembership) =>
              m.userId === user?.id ? null : (
                <Button
                  intent="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${m.userId.slice(-12)}`}
                  onClick={() => handleRemove(m)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              ),
          } as DataTableColumn<CourseMembership>,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-muted)"
            aria-hidden
          />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            type="search"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="instructor">Instructors</SelectItem>
            <SelectItem value="teaching_assistant">Teaching assistants</SelectItem>
            <SelectItem value="course_admin">Course admins</SelectItem>
          </SelectContent>
        </Select>
        {isStaff ? (
          <div className="flex items-center gap-2">
            <Button intent="secondary" onClick={() => setCsvOpen(true)}>
              <Upload className="size-4" aria-hidden /> Import CSV
            </Button>
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" aria-hidden /> Invite
            </Button>
          </div>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(m) => m.id}
        isLoading={memberships.isLoading}
        error={memberships.error}
        onRetry={() => memberships.refetch()}
        empty={{
          icon: Users,
          title: 'No members match',
          description: 'Adjust your filters or invite someone.',
        }}
      />

      <InviteMemberDialog
        tenantId={tenantId}
        courseId={courseId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
      <BulkCsvDialog
        tenantId={tenantId}
        courseId={courseId}
        open={csvOpen}
        onOpenChange={setCsvOpen}
      />
    </div>
  );
}
