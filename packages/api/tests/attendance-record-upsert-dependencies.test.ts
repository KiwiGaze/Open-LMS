import type { CourseRole, TenantRole } from '@openlms/contracts';
import {
  AttendanceSessionUnavailableError,
  AttendanceStudentUnavailableError,
} from '@openlms/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createDbHandle: vi.fn(),
  getAttendanceSessionForCourse: vi.fn(),
  listAttendanceRecordsForSession: vi.fn(),
  listAttendanceSessionsForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  recordAttendanceRecord: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getAttendanceSessionForCourse: coreMocks.getAttendanceSessionForCourse,
    listAttendanceRecordsForSession: coreMocks.listAttendanceRecordsForSession,
    listAttendanceSessionsForCourse: coreMocks.listAttendanceSessionsForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    recordAttendanceRecord: coreMocks.recordAttendanceRecord,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const studentUserId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const sessionId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const attendanceRecordId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const now = new Date('2026-05-10T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureCourseAccess = (tenantRole: TenantRole, courseRole: CourseRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue([{ tenantId, role: tenantRole }]);
  coreMocks.listUserCourseMemberships.mockResolvedValue(
    courseRole ? [{ tenantId, courseId, role: courseRole }] : [],
  );
};

const configureSession = (status: 'scheduled' | 'completed' | 'cancelled'): void => {
  coreMocks.getAttendanceSessionForCourse.mockResolvedValue({
    id: sessionId,
    tenantId,
    courseId,
    title: 'Week 1 seminar',
    startsAt: now,
    endsAt: new Date('2026-05-10T01:00:00.000Z'),
    status,
    createdAt: now,
    updatedAt: now,
  });
};

describe('attendance record write dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listAttendanceSessionsForCourse.mockResolvedValue([]);
    coreMocks.listAttendanceRecordsForSession.mockResolvedValue([]);
    coreMocks.recordAttendanceRecord.mockResolvedValue({
      id: attendanceRecordId,
      tenantId,
      sessionId,
      studentId: studentUserId,
      status: 'late',
      note: 'Arrived after the opening activity.',
      recordedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
    configureSession('scheduled');
  });

  it('records attendance for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.recordAttendanceRecord(
        actorUserId,
        tenantId,
        courseId,
        sessionId,
        studentUserId,
        {
          status: 'late',
          note: 'Arrived after the opening activity.',
        },
      ),
    ).resolves.toMatchObject({
      id: attendanceRecordId,
      sessionId,
      studentId: studentUserId,
      status: 'late',
    });

    expect(coreMocks.recordAttendanceRecord).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      sessionId,
      studentId: studentUserId,
      status: 'late',
      note: 'Arrived after the opening activity.',
    });
  });

  it('records attendance for tenant staff without course membership', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.recordAttendanceRecord(
      actorUserId,
      tenantId,
      courseId,
      sessionId,
      studentUserId,
      {
        status: 'late',
        note: 'Arrived after the opening activity.',
      },
    );

    expect(coreMocks.recordAttendanceRecord).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      sessionId,
      studentId: studentUserId,
      status: 'late',
      note: 'Arrived after the opening activity.',
    });
  });

  it('rejects students recording attendance', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.recordAttendanceRecord(
        actorUserId,
        tenantId,
        courseId,
        sessionId,
        studentUserId,
        {
          status: 'late',
          note: 'Arrived after the opening activity.',
        },
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can record attendance. Ask an instructor for access.',
    });

    expect(coreMocks.recordAttendanceRecord).not.toHaveBeenCalled();
  });

  it('rejects cancelled attendance sessions', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.recordAttendanceRecord.mockRejectedValue(new AttendanceSessionUnavailableError());
    const dependencies = createDependencies();

    await expect(
      dependencies.recordAttendanceRecord(
        actorUserId,
        tenantId,
        courseId,
        sessionId,
        studentUserId,
        {
          status: 'late',
          note: 'Arrived after the opening activity.',
        },
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Attendance session was not found in this course. Check the session id and retry the request.',
    });
  });

  it('rejects attendance for users who are not course students', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.recordAttendanceRecord.mockRejectedValue(new AttendanceStudentUnavailableError());
    const dependencies = createDependencies();

    await expect(
      dependencies.recordAttendanceRecord(
        actorUserId,
        tenantId,
        courseId,
        sessionId,
        studentUserId,
        {
          status: 'late',
          note: 'Arrived after the opening activity.',
        },
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Student was not found in this course. Check the student id and retry the request.',
    });
  });
});
