import {
  AttendanceRecord,
  type AttendanceRecord as AttendanceRecordContract,
  AttendanceRecordId,
  type AttendanceRecordStatus,
  AttendanceSession,
  type AttendanceSession as AttendanceSessionContract,
  AttendanceSessionId,
  type AttendanceSessionStatus,
  CourseId,
  TenantId,
  UserId,
} from '@openlms/contracts';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../db/client.ts';
import { attendanceRecord, attendanceSession } from '../db/schema/attendance.ts';
import { courseMembership } from '../db/schema/membership.ts';

export class AttendanceSessionUnavailableError extends Error {
  constructor() {
    super('Attendance session is not available for recording.');
    this.name = 'AttendanceSessionUnavailableError';
  }
}

export class AttendanceStudentUnavailableError extends Error {
  constructor() {
    super('Student is not enrolled in this course.');
    this.name = 'AttendanceStudentUnavailableError';
  }
}

export type ListAttendanceSessionsForCourseInput = {
  tenantId: string;
  courseId: string;
  statuses: AttendanceSessionStatus[];
};

export type CreateAttendanceSessionInput = {
  tenantId: string;
  courseId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  status: AttendanceSessionStatus;
};

export const listAttendanceSessionsForCourse = async (
  db: Database,
  input: ListAttendanceSessionsForCourseInput,
): Promise<AttendanceSessionContract[]> => {
  const conditions = [
    eq(attendanceSession.tenantId, input.tenantId),
    eq(attendanceSession.courseId, input.courseId),
  ];

  if (input.statuses.length > 0) {
    conditions.push(inArray(attendanceSession.status, input.statuses));
  }

  const rows = await db
    .select()
    .from(attendanceSession)
    .where(and(...conditions))
    .orderBy(asc(attendanceSession.startsAt), asc(attendanceSession.title));

  return rows.map((row) => AttendanceSession.parse(row));
};

export const createAttendanceSession = async (
  db: Database,
  input: CreateAttendanceSessionInput,
  now = new Date(),
): Promise<AttendanceSessionContract> => {
  const parsed = AttendanceSession.parse({
    id: AttendanceSessionId.parse(ulid()),
    tenantId: TenantId.parse(input.tenantId),
    courseId: CourseId.parse(input.courseId),
    title: input.title,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db.insert(attendanceSession).values(parsed).returning();

  if (!row) {
    throw new Error(
      'Attendance session could not be created because the database returned no row.',
    );
  }

  return AttendanceSession.parse(row);
};

export const getAttendanceSessionForCourse = async (
  db: Database,
  tenantId: string,
  courseId: string,
  sessionId: string,
): Promise<AttendanceSessionContract | null> => {
  const [row] = await db
    .select()
    .from(attendanceSession)
    .where(
      and(
        eq(attendanceSession.tenantId, tenantId),
        eq(attendanceSession.courseId, courseId),
        eq(attendanceSession.id, sessionId),
      ),
    )
    .limit(1);

  return row ? AttendanceSession.parse(row) : null;
};

export type ListAttendanceRecordsForSessionInput = {
  tenantId: string;
  sessionId: string;
  studentId?: string;
};

export type RecordAttendanceRecordInput = {
  tenantId: string;
  courseId: string;
  sessionId: string;
  studentId: string;
  status: AttendanceRecordStatus;
  note: string | null;
};

export const listAttendanceRecordsForSession = async (
  db: Database,
  input: ListAttendanceRecordsForSessionInput,
): Promise<AttendanceRecordContract[]> => {
  const conditions = [
    eq(attendanceRecord.tenantId, input.tenantId),
    eq(attendanceRecord.sessionId, input.sessionId),
  ];

  if (input.studentId) {
    conditions.push(eq(attendanceRecord.studentId, input.studentId));
  }

  const rows = await db
    .select()
    .from(attendanceRecord)
    .where(and(...conditions))
    .orderBy(asc(attendanceRecord.studentId));

  return rows.map((row) => AttendanceRecord.parse(row));
};

export const recordAttendanceRecord = async (
  db: Database,
  input: RecordAttendanceRecordInput,
  now = new Date(),
): Promise<AttendanceRecordContract> => {
  const tenantId = TenantId.parse(input.tenantId);
  const courseId = CourseId.parse(input.courseId);
  const sessionId = AttendanceSessionId.parse(input.sessionId);
  const studentId = UserId.parse(input.studentId);

  return db.transaction(async (tx) => {
    const [session] = await tx.execute(sql`
      SELECT status
      FROM ${attendanceSession}
      WHERE tenant_id = ${tenantId}
        AND course_id = ${courseId}
        AND id = ${sessionId}
        AND status IN ('scheduled', 'completed')
      FOR UPDATE
    `);

    if (!session) {
      throw new AttendanceSessionUnavailableError();
    }

    const [studentMembership] = await tx.execute(sql`
      SELECT id
      FROM ${courseMembership}
      WHERE tenant_id = ${tenantId}
        AND course_id = ${courseId}
        AND user_id = ${studentId}
        AND role = 'student'
      FOR UPDATE
    `);

    if (!studentMembership) {
      throw new AttendanceStudentUnavailableError();
    }

    const parsed = AttendanceRecord.parse({
      id: AttendanceRecordId.parse(ulid()),
      tenantId,
      sessionId,
      studentId,
      status: input.status,
      note: input.note,
      recordedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const [row] = await tx
      .insert(attendanceRecord)
      .values(parsed)
      .onConflictDoUpdate({
        target: [attendanceRecord.tenantId, attendanceRecord.sessionId, attendanceRecord.studentId],
        set: {
          status: parsed.status,
          note: parsed.note,
          recordedAt: parsed.recordedAt,
          updatedAt: parsed.updatedAt,
        },
      })
      .returning();

    if (!row) {
      throw new Error('Attendance record could not be saved because the database returned no row.');
    }

    return AttendanceRecord.parse(row);
  });
};
