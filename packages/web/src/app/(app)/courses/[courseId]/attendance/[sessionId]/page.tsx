'use client';

import { EmptyState } from '@/components/patterns/empty-state.tsx';
import { ErrorState } from '@/components/patterns/error-state.tsx';
import { PageHeader } from '@/components/patterns/page-header.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
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
  useAttendanceRecordsQuery,
  useAttendanceSessionsQuery,
  useUpsertAttendanceRecordMutation,
} from '@/lib/api/queries/attendance.ts';
import { useCourseMembershipsQuery } from '@/lib/api/queries/messaging.ts';
import { useMessageableUsersQuery } from '@/lib/api/queries/messaging.ts';
import { useSessionStore } from '@/lib/auth/store.ts';
import { formatDateTime } from '@/lib/format.ts';
import type { AttendanceRecordStatus } from '@openlms/contracts';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { use, useMemo, useState } from 'react';

type Params = { courseId: string; sessionId: string };

const STATUS_OPTIONS: { value: AttendanceRecordStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
  { value: 'absent', label: 'Absent' },
];

const STATUS_TONE: Record<AttendanceRecordStatus, 'success' | 'warning' | 'info' | 'danger'> = {
  present: 'success',
  late: 'warning',
  excused: 'info',
  absent: 'danger',
};

export default function AttendanceRollPage({ params }: { params: Promise<Params> }) {
  const { courseId, sessionId } = use(params);
  const tenantId = useSessionStore((s) => s.activeTenantId);
  const { publish } = useToast();

  const sessions = useAttendanceSessionsQuery(tenantId, courseId);
  const records = useAttendanceRecordsQuery(tenantId, courseId, sessionId);
  const memberships = useCourseMembershipsQuery(tenantId, courseId);
  const messageable = useMessageableUsersQuery(tenantId, courseId);
  const upsert = useUpsertAttendanceRecordMutation(tenantId, courseId, sessionId);

  const [pendingStudentId, setPendingStudentId] = useState<string | null>(null);

  const session = sessions.data?.find((s) => s.id === sessionId);

  const students = useMemo(() => {
    const enrolled = (memberships.data ?? []).filter(
      (m) => m.role === 'student' && m.status === 'active',
    );
    const lookup = new Map(messageable.data?.map((m) => [m.userId, m.displayName]) ?? []);
    return enrolled
      .map((m) => ({
        userId: m.userId,
        displayName: lookup.get(m.userId) ?? m.userId.slice(-12),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [memberships.data, messageable.data]);

  const recordsByStudent = useMemo(() => {
    const map = new Map<string, AttendanceRecordStatus>();
    for (const r of records.data ?? []) {
      map.set(r.studentId, r.status);
    }
    return map;
  }, [records.data]);

  const handleChange = async (studentId: string, status: AttendanceRecordStatus) => {
    setPendingStudentId(studentId);
    try {
      await upsert.mutateAsync({ studentId, input: { status } });
    } catch (error) {
      const message = error instanceof ApiHttpError ? error.message : 'Could not save. Try again.';
      publish({ tone: 'danger', title: 'Save failed', description: message });
    } finally {
      setPendingStudentId(null);
    }
  };

  const loading = sessions.isLoading || memberships.isLoading || records.isLoading;
  const loadError = sessions.error || memberships.error || records.error;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Attendance"
        title={session?.title ?? 'Take roll'}
        description={
          session
            ? `${formatDateTime(session.startsAt)} — ${formatDateTime(session.endsAt)}`
            : undefined
        }
        actions={
          <Button asChild intent="ghost">
            <Link href={`/courses/${courseId}/attendance`}>
              <ArrowLeft className="size-4" aria-hidden /> Back to sessions
            </Link>
          </Button>
        }
      />

      {loading ? (
        <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />
      ) : loadError ? (
        <ErrorState
          error={loadError}
          onRetry={() => {
            sessions.refetch();
            memberships.refetch();
            records.refetch();
          }}
        />
      ) : students.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No students enrolled"
          description="Enrol students from the People tab to take attendance."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead style={{ width: 200 }}>Status</TableHead>
              <TableHead style={{ width: 120, textAlign: 'right' }}>Current</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => {
              const current = recordsByStudent.get(student.userId);
              const isPending = pendingStudentId === student.userId && upsert.isPending;
              return (
                <TableRow key={student.userId}>
                  <TableCell>{student.displayName}</TableCell>
                  <TableCell>
                    <Select
                      value={current ?? ''}
                      onValueChange={(v) =>
                        handleChange(student.userId, v as AttendanceRecordStatus)
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mark…" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    {current ? (
                      <Badge tone={STATUS_TONE[current]}>{current}</Badge>
                    ) : (
                      <span className="text-xs text-(--color-text-muted)">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
