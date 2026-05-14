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
import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { initialsOf } from '@/lib/format.ts';
import type { CourseMembership, CourseRole } from '@openlms/contracts';
import { useQuery } from '@tanstack/react-query';
import { Search, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { use } from 'react';

type Params = { courseId: string };

const ROLE_TONE: Record<CourseRole, Parameters<typeof Badge>[0]['tone']> = {
  student: 'neutral',
  instructor: 'brand',
  teaching_assistant: 'info',
  course_admin: 'warning',
};

export default function CoursePeoplePage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | CourseRole>('all');

  const memberships = useQuery({
    queryKey: tenantId ? queryKeys.coursePeople(tenantId, courseId) : ['people', 'inactive'],
    queryFn: () =>
      apiFetch<CourseMembership[]>(`/tenants/${tenantId}/courses/${courseId}/memberships`),
    enabled: Boolean(tenantId),
  });

  const filtered = useMemo(() => {
    const all = memberships.data ?? [];
    return all.filter((m) => {
      if (role !== 'all' && m.role !== role) return false;
      if (!search.trim()) return true;
      return m.userId.toLowerCase().includes(search.toLowerCase());
    });
  }, [memberships.data, search, role]);

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
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      width: '160px',
      cell: (m) => <Badge tone={ROLE_TONE[m.role] ?? 'neutral'}>{m.role.replace(/_/g, ' ')}</Badge>,
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
        <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
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
        <Button>
          <UserPlus className="size-4" aria-hidden /> Invite
        </Button>
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
    </div>
  );
}
