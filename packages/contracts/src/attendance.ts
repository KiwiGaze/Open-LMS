import { z } from 'zod';
import { AttendanceRecordId, AttendanceSessionId, CourseId, TenantId, UserId } from './ids.ts';

export const AttendanceSessionStatus = z.enum(['scheduled', 'completed', 'cancelled']);
export type AttendanceSessionStatus = z.infer<typeof AttendanceSessionStatus>;

export const AttendanceRecordStatus = z.enum(['present', 'late', 'absent', 'excused']);
export type AttendanceRecordStatus = z.infer<typeof AttendanceRecordStatus>;

export const AttendanceSession = z.object({
  id: AttendanceSessionId,
  tenantId: TenantId,
  courseId: CourseId,
  title: z.string().min(1).max(180),
  startsAt: z.date(),
  endsAt: z.date(),
  status: AttendanceSessionStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type AttendanceSession = z.infer<typeof AttendanceSession>;

export const AttendanceRecord = z.object({
  id: AttendanceRecordId,
  tenantId: TenantId,
  sessionId: AttendanceSessionId,
  studentId: UserId,
  status: AttendanceRecordStatus,
  note: z.string().min(1).max(2_000).nullable(),
  recordedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type AttendanceRecord = z.infer<typeof AttendanceRecord>;
