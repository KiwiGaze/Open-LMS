'use client';

import { DataTable, type DataTableColumn } from '@/components/patterns/data-table.tsx';
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
import { useAssignmentsQuery } from '@/lib/api/queries/assignments.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import { ClipboardList, Pencil, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { use } from 'react';

type Params = { courseId: string };

export default function CourseAssignmentsPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const assignments = useAssignmentsQuery(tenantId, courseId);
  const [status, setStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const all = assignments.data ?? [];
    return all.filter((a) => {
      if (status !== 'all' && a.status !== status) return false;
      if (!search.trim()) return true;
      return a.title.toLowerCase().includes(search.toLowerCase());
    });
  }, [assignments.data, status, search]);

  const columns: DataTableColumn<(typeof filtered)[number]>[] = [
    {
      id: 'title',
      header: 'Title',
      cell: (a) => (
        <Link
          href={`/courses/${courseId}/assignments/${a.id}`}
          className="font-medium text-(--color-text-default) hover:text-(--color-text-link)"
        >
          {a.title}
        </Link>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: '120px',
      cell: (a) => (
        <Badge
          tone={
            a.status === 'published' ? 'success' : a.status === 'archived' ? 'outline' : 'neutral'
          }
        >
          {a.status}
        </Badge>
      ),
    },
    {
      id: 'due',
      header: 'Due',
      width: '200px',
      cell: (a) => (
        <span className="text-sm text-(--color-text-muted)">
          {a.dueAt ? formatDateTime(a.dueAt) : '—'}
        </span>
      ),
    },
    {
      id: 'resubmission',
      header: 'Resubmission',
      width: '130px',
      cell: (a) => (
        <span className="text-sm text-(--color-text-muted)">
          {a.allowResubmission ? 'Allowed' : 'Single attempt'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: '88px',
      cell: (a) => (
        <Button asChild intent="ghost" size="sm">
          <Link
            href={`/courses/${courseId}/assignments/${a.id}/edit`}
            aria-label={`Edit ${a.title}`}
          >
            <Pencil className="size-3.5" aria-hidden /> Edit
          </Link>
        </Button>
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
            placeholder="Search assignments..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href={`/courses/${courseId}/assignments/new`}>
            <Plus className="size-4" aria-hidden /> New assignment
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(a) => a.id}
        isLoading={assignments.isLoading}
        error={assignments.error}
        onRetry={() => assignments.refetch()}
        empty={{
          icon: ClipboardList,
          title:
            (assignments.data?.length ?? 0) === 0
              ? 'No assignments yet'
              : 'No matching assignments',
          description:
            (assignments.data?.length ?? 0) === 0
              ? 'Create your first assignment to give students something to work on.'
              : 'Adjust your filters or search to find what you need.',
        }}
      />
    </div>
  );
}
