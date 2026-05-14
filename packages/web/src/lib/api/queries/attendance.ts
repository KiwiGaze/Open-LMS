'use client';

import { apiFetch } from '@/lib/api/client.ts';
import { queryKeys } from '@/lib/api/keys.ts';
import type {
  AttendanceRecord,
  AttendanceRecordStatus,
  AttendanceSession,
} from '@openlms/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type AttendanceSessionInput = {
  title: string;
  startsAt: string;
  endsAt: string;
};

export type AttendanceRecordInput = {
  status: AttendanceRecordStatus;
  note?: string | null;
};

function rejectIfMissingScope(tenantId: string | null, courseId: string | null) {
  if (!tenantId || !courseId) {
    return Promise.reject(new Error('No active course — cannot save attendance.'));
  }
  return null;
}

export function useAttendanceSessionsQuery(tenantId: string | null, courseId: string | null) {
  return useQuery({
    queryKey:
      tenantId && courseId
        ? queryKeys.attendanceSessions(tenantId, courseId)
        : ['attendance-sessions', 'inactive'],
    queryFn: () =>
      apiFetch<AttendanceSession[]>(`/tenants/${tenantId}/courses/${courseId}/attendance-sessions`),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useCreateAttendanceSessionMutation(
  tenantId: string | null,
  courseId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AttendanceSessionInput) => {
      const guard = rejectIfMissingScope(tenantId, courseId);
      if (guard) return guard;
      return apiFetch<AttendanceSession>(
        `/tenants/${tenantId}/courses/${courseId}/attendance-sessions`,
        { method: 'POST', body: input },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.attendanceSessions(tenantId, courseId),
        });
      }
    },
  });
}

export function useAttendanceRecordsQuery(
  tenantId: string | null,
  courseId: string | null,
  sessionId: string | null,
) {
  return useQuery({
    queryKey:
      tenantId && courseId && sessionId
        ? queryKeys.attendanceRecords(tenantId, courseId, sessionId)
        : ['attendance-records', 'inactive'],
    queryFn: () =>
      apiFetch<AttendanceRecord[]>(
        `/tenants/${tenantId}/courses/${courseId}/attendance-sessions/${sessionId}/records`,
      ),
    enabled: Boolean(tenantId && courseId && sessionId),
  });
}

export function useUpsertAttendanceRecordMutation(
  tenantId: string | null,
  courseId: string | null,
  sessionId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, input }: { studentId: string; input: AttendanceRecordInput }) => {
      if (!tenantId || !courseId || !sessionId) {
        return Promise.reject(new Error('No active session — cannot record attendance.'));
      }
      return apiFetch<AttendanceRecord>(
        `/tenants/${tenantId}/courses/${courseId}/attendance-sessions/${sessionId}/records/${studentId}`,
        { method: 'PUT', body: input },
      );
    },
    onSuccess: () => {
      if (tenantId && courseId && sessionId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.attendanceRecords(tenantId, courseId, sessionId),
        });
      }
    },
  });
}
