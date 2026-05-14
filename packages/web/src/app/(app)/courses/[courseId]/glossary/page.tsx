'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import {
  useDeleteGlossaryEntryMutation,
  useGlossaryEntriesQuery,
} from '@/lib/api/queries/glossary.ts';
import { useMyCourseMembershipsQuery } from '@/lib/api/queries/me.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import type { GlossaryEntry } from '@openlms/contracts';
import { Library, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { use, useMemo, useState } from 'react';
import { GlossaryEntryDialog } from './entry-dialog.tsx';

type Params = { courseId: string };

const COURSE_STAFF_ROLES = new Set(['instructor', 'teaching_assistant', 'course_admin']);

export default function CourseGlossaryPage({ params }: { params: Promise<Params> }) {
  const { courseId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();

  const entries = useGlossaryEntriesQuery(tenantId, courseId);
  const myCourseMemberships = useMyCourseMembershipsQuery();
  const deleteEntry = useDeleteGlossaryEntryMutation(tenantId, courseId);

  const isStaff =
    myCourseMemberships.data?.some(
      (m) => m.courseId === courseId && COURSE_STAFF_ROLES.has(m.role),
    ) ?? false;

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GlossaryEntry | null>(null);

  const visibleEntries = useMemo(() => {
    const list = entries.data ?? [];
    const filtered = isStaff ? list : list.filter((e) => e.status === 'published');
    const needle = search.trim().toLowerCase();
    const matched = needle
      ? filtered.filter(
          (e) =>
            e.term.toLowerCase().includes(needle) || e.definition.toLowerCase().includes(needle),
        )
      : filtered;
    return [...matched].sort((a, b) => a.term.localeCompare(b.term));
  }, [entries.data, isStaff, search]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (entry: GlossaryEntry) => {
    setEditing(entry);
    setDialogOpen(true);
  };

  const handleDelete = async (entry: GlossaryEntry) => {
    if (deleteEntry.isPending) return;
    if (!window.confirm(`Delete the glossary entry “${entry.term}”?`)) return;
    try {
      await deleteEntry.mutateAsync(entry.id);
      publish({ tone: 'success', title: 'Entry deleted' });
    } catch (error) {
      const message =
        error instanceof ApiHttpError ? error.message : 'Could not delete. Try again.';
      publish({ tone: 'danger', title: 'Delete failed', description: message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Glossary"
        title="Course glossary"
        description="Key terms and definitions for this course."
        actions={
          isStaff ? (
            <Button onClick={openNew}>
              <Plus className="size-4" aria-hidden /> New entry
            </Button>
          ) : null
        }
      />

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-muted)"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search terms or definitions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {entries.isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`gloss-skel-${i}`} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : entries.error ? (
        <ErrorState error={entries.error} onRetry={() => entries.refetch()} />
      ) : visibleEntries.length === 0 ? (
        <EmptyState
          icon={Library}
          title={search ? 'No matching terms' : 'No glossary entries yet'}
          description={
            search
              ? 'Adjust your search or clear the filter to see all entries.'
              : isStaff
                ? 'Add your first term to start building the course glossary.'
                : 'Your instructor has not published any glossary terms yet.'
          }
          action={
            isStaff && !search ? (
              <Button onClick={openNew}>
                <Plus className="size-4" aria-hidden /> New entry
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3">
          {visibleEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{entry.term}</CardTitle>
                    {isStaff && entry.status !== 'published' ? (
                      <CardDescription>
                        <Badge tone={entry.status === 'draft' ? 'neutral' : 'outline'}>
                          {entry.status}
                        </Badge>
                      </CardDescription>
                    ) : null}
                  </div>
                  {isStaff ? (
                    <div className="flex items-center gap-1">
                      <Button
                        intent="ghost"
                        size="icon-sm"
                        aria-label="Edit entry"
                        onClick={() => openEdit(entry)}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                      <Button
                        intent="ghost"
                        size="icon-sm"
                        aria-label="Delete entry"
                        onClick={() => handleDelete(entry)}
                        disabled={deleteEntry.isPending}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap text-(--color-text-default)">
                {entry.definition}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isStaff ? (
        <GlossaryEntryDialog
          tenantId={tenantId}
          courseId={courseId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          existing={editing}
        />
      ) : null}
    </div>
  );
}
