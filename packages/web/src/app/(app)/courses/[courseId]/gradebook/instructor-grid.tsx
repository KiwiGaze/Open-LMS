'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useToast } from '@/components/ui/toast.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { ApiHttpError } from '@/lib/api/errors.ts';
import { useAssignmentsQuery } from '@/lib/api/queries/assignments.ts';
import { useGradebookEntriesQuery, useUpsertSubmissionGrade } from '@/lib/api/queries/gradebook.ts';
import { cn } from '@/lib/cn';
import { formatNumber, formatPercent } from '@/lib/format.ts';
import type { Assignment, CourseMembership, GradebookEntry } from '@openlms/contracts';
import { ClipboardList, Download, EyeOff, Lock, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CsvImportDialog } from './csv-import-dialog.tsx';

export type InstructorGradebookGridProps = {
  tenantId: string | null;
  courseId: string;
  memberships: CourseMembership[];
};

type CellKey = `${string}|${string}`;

const cellKey = (studentId: string, assignmentId: string): CellKey =>
  `${studentId}|${assignmentId}`;

export function InstructorGradebookGrid({
  tenantId,
  courseId,
  memberships,
}: InstructorGradebookGridProps) {
  const entries = useGradebookEntriesQuery(tenantId, courseId);
  const assignments = useAssignmentsQuery(tenantId, courseId);
  const [search, setSearch] = useState('');

  const students = useMemo(
    () =>
      memberships
        .filter((m) => m.role === 'student' && m.status === 'active')
        .sort((a, b) => a.userId.localeCompare(b.userId)),
    [memberships],
  );

  const filteredStudents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return students;
    return students.filter((s) => s.userId.toLowerCase().includes(needle));
  }, [students, search]);

  const items = useMemo(
    () =>
      (assignments.data ?? [])
        .filter((a) => a.status !== 'archived')
        .sort((a, b) => a.title.localeCompare(b.title)),
    [assignments.data],
  );

  const hasAnonymousAssignment = items.some((a) => a.anonymousGradingEnabled);

  const entriesByCell = useMemo(() => {
    const map = new Map<CellKey, GradebookEntry>();
    for (const entry of entries.data ?? []) {
      map.set(cellKey(entry.studentId, entry.assignmentId), entry);
    }
    return map;
  }, [entries.data]);

  const studentTotals = useMemo(() => {
    const totals = new Map<string, { earned: number; possible: number }>();
    for (const entry of entries.data ?? []) {
      const t = totals.get(entry.studentId) ?? { earned: 0, possible: 0 };
      t.earned += entry.score;
      t.possible += entry.maxScore;
      totals.set(entry.studentId, t);
    }
    return totals;
  }, [entries.data]);

  const isLoading = entries.isLoading || assignments.isLoading;
  const loadError = entries.error || assignments.error;

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />;
  }
  if (loadError) {
    return (
      <ErrorState
        error={loadError}
        onRetry={() => {
          entries.refetch();
          assignments.refetch();
        }}
      />
    );
  }
  if (students.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No students enrolled"
        description="Enrol students from the People tab to see their grades here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {hasAnonymousAssignment ? (
        <div
          role="note"
          className="flex items-start gap-3 rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-elevated) p-3"
        >
          <EyeOff className="mt-0.5 size-4 text-(--color-text-muted)" aria-hidden />
          <div className="text-sm text-(--color-text-default)">
            <p className="font-medium">Anonymous grading is enabled for some assignments.</p>
            <p className="mt-0.5 text-(--color-text-muted)">
              Columns marked with{' '}
              <EyeOff className="inline size-3 text-(--color-text-muted)" aria-hidden /> are
              read-only here so anonymity isn&apos;t broken. Grade those assignments from the
              assignment&apos;s submissions screen.
            </p>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-muted)"
            aria-hidden
          />
          <Input
            className="pl-9"
            type="search"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button intent="secondary" size="sm" asChild>
            <a href={`/api/v1/tenants/${tenantId}/courses/${courseId}/gradebook/export`} download>
              <Download className="size-4" aria-hidden /> Export CSV
            </a>
          </Button>
          <CsvImportDialog tenantId={tenantId} courseId={courseId} assignments={items} />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="Create assignments to start tracking grades."
        />
      ) : (
        <Card className="p-0">
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto rounded-[var(--radius-lg)]">
              <table className="min-w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-(--color-surface-elevated)">
                  <tr>
                    <th
                      scope="col"
                      className="sticky left-0 z-20 min-w-56 border-b border-r border-(--color-border-subtle) bg-(--color-surface-elevated) px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-(--color-text-muted)"
                    >
                      Student
                    </th>
                    {items.map((item) => (
                      <th
                        key={item.id}
                        scope="col"
                        className="min-w-32 border-b border-(--color-border-subtle) px-3 py-3 text-left text-xs font-medium text-(--color-text-default)"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="line-clamp-2 inline-flex items-center gap-1">
                            {item.anonymousGradingEnabled ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <EyeOff
                                    className="size-3 shrink-0 text-(--color-text-muted)"
                                    aria-label="Anonymous grading"
                                  />
                                </TooltipTrigger>
                                <TooltipContent>Anonymous grading is enabled</TooltipContent>
                              </Tooltip>
                            ) : null}
                            {item.title}
                          </span>
                          <span className="text-2xs uppercase tracking-wider text-(--color-text-muted)">
                            {item.extraCredit ? 'Extra credit' : 'Assignment'}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="min-w-24 border-b border-l border-(--color-border-subtle) bg-(--color-surface-elevated) px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-(--color-text-muted)"
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const totals = studentTotals.get(student.userId) ?? {
                      earned: 0,
                      possible: 0,
                    };
                    const pct = totals.possible === 0 ? null : totals.earned / totals.possible;
                    return (
                      <tr key={student.userId} className="hover:bg-(--color-surface-elevated)">
                        <th
                          scope="row"
                          className="sticky left-0 z-10 border-b border-r border-(--color-border-subtle) bg-(--color-surface-base) px-4 py-2 text-left align-top"
                        >
                          <div className="flex flex-col">
                            <span className="font-mono text-xs text-(--color-text-default)">
                              {student.userId.slice(-12)}
                            </span>
                            <span className="text-xs text-(--color-text-muted)">Student</span>
                          </div>
                        </th>
                        {items.map((item) => {
                          const entry = entriesByCell.get(cellKey(student.userId, item.id));
                          return (
                            <td
                              key={item.id}
                              className="border-b border-(--color-border-subtle) px-2 py-1 align-top"
                            >
                              <GradeCell
                                tenantId={tenantId}
                                courseId={courseId}
                                assignmentId={item.id}
                                entry={entry}
                                gradingLocked={item.gradingLocked}
                                anonymousGradingEnabled={item.anonymousGradingEnabled}
                              />
                            </td>
                          );
                        })}
                        <td className="border-b border-l border-(--color-border-subtle) bg-(--color-surface-base) px-3 py-2 text-right align-top tabular-nums">
                          {pct === null ? (
                            <span className="text-xs text-(--color-text-muted)">—</span>
                          ) : (
                            <span className="text-sm font-medium text-(--color-text-default)">
                              {formatPercent(pct)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type GradeCellProps = {
  tenantId: string | null;
  courseId: string;
  assignmentId: string;
  entry: GradebookEntry | undefined;
  gradingLocked: boolean;
  anonymousGradingEnabled: boolean;
};

function GradeCell({
  tenantId,
  courseId,
  assignmentId,
  entry,
  gradingLocked,
  anonymousGradingEnabled,
}: GradeCellProps) {
  const upsert = useUpsertSubmissionGrade(tenantId, courseId);
  const { publish } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>('');

  if (anonymousGradingEnabled) {
    return entry ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex w-full flex-col items-end gap-0.5 rounded-[var(--radius-sm)] px-2 py-1 text-right">
            <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums text-(--color-text-default)">
              <EyeOff className="size-3 text-(--color-text-muted)" aria-label="Anonymous grading" />
              {formatNumber(entry.score, 1)}
              <span className="ml-0.5 text-xs text-(--color-text-muted)">
                /{formatNumber(entry.maxScore, 1)}
              </span>
            </span>
            <Badge tone="outline" className="text-2xs">
              anonymous
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>Grade from the assignment&apos;s submissions screen</TooltipContent>
      </Tooltip>
    ) : (
      <span className="text-xs text-(--color-text-muted)">Not submitted</span>
    );
  }

  if (!entry) {
    return <span className="text-xs text-(--color-text-muted)">Not submitted</span>;
  }

  if (gradingLocked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex w-full flex-col items-end gap-0.5 rounded-[var(--radius-sm)] px-2 py-1 text-right">
            <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums text-(--color-text-default)">
              <Lock className="size-3 text-(--color-text-muted)" aria-label="Grading locked" />
              {formatNumber(entry.score, 1)}
              <span className="ml-0.5 text-xs text-(--color-text-muted)">
                /{formatNumber(entry.maxScore, 1)}
              </span>
            </span>
            <Badge tone="outline" className="text-2xs">
              locked
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>Grading is locked for this assignment</TooltipContent>
      </Tooltip>
    );
  }

  const startEdit = () => {
    setDraft(String(entry.score));
    setEditing(true);
  };

  const commit = async () => {
    setEditing(false);
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > entry.maxScore) {
      publish({
        tone: 'danger',
        title: 'Invalid score',
        description: `Score must be between 0 and ${entry.maxScore}.`,
      });
      return;
    }
    if (parsed === entry.score) return;
    try {
      await upsert.mutateAsync({
        assignmentId,
        submissionId: entry.submissionId,
        score: parsed,
        maxScore: entry.maxScore,
        status: entry.gradeStatus === 'published' ? 'published' : 'draft',
      });
      publish({ tone: 'success', title: 'Grade saved', durationMs: 1500 });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not save the grade.';
      publish({ tone: 'danger', title: 'Save failed', description: message });
    }
  };

  if (editing) {
    return (
      <Input
        type="number"
        min={0}
        max={entry.maxScore}
        step="any"
        autoFocus
        defaultValue={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          } else if (e.key === 'Escape') {
            setEditing(false);
          }
        }}
        className="h-8 w-20 text-sm"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className={cn(
        'flex w-full flex-col items-end gap-0.5 rounded-[var(--radius-sm)] px-2 py-1 text-right hover:bg-(--color-brand-subtle) focus:bg-(--color-brand-subtle) focus:outline-none',
      )}
      aria-label={`Edit grade for ${entry.assignmentTitle}`}
    >
      <span className="text-sm font-medium tabular-nums text-(--color-text-default)">
        {formatNumber(entry.score, 1)}
        <span className="ml-0.5 text-xs text-(--color-text-muted)">
          /{formatNumber(entry.maxScore, 1)}
        </span>
      </span>
      <Badge
        tone={
          entry.gradeStatus === 'published'
            ? 'success'
            : entry.gradeStatus === 'appealed'
              ? 'warning'
              : entry.gradeStatus === 'locked'
                ? 'outline'
                : 'neutral'
        }
        className="text-2xs"
      >
        {entry.gradeStatus}
      </Badge>
    </button>
  );
}
