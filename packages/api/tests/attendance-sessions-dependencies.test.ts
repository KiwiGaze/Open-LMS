import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createAttendanceSession: vi.fn(),
  createDbHandle: vi.fn(),
  listAttendanceSessionsForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createAttendanceSession: coreMocks.createAttendanceSession,
    createDbHandle: coreMocks.createDbHandle,
    listAttendanceSessionsForCourse: coreMocks.listAttendanceSessionsForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const sessionId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const now = new Date('2026-05-10T00:00:00.000Z');
const startsAt = new Date('2026-05-11T00:00:00.000Z');
const endsAt = new Date('2026-05-11T01:00:00.000Z');

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

const missingAttendanceSessionCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'attendance_session_tenant_course_fk',
});

describe('attendance session API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listAttendanceSessionsForCourse.mockResolvedValue([]);
    coreMocks.createAttendanceSession.mockResolvedValue({
      id: sessionId,
      tenantId,
      courseId,
      title: 'Week 2 seminar',
      startsAt,
      endsAt,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates attendance sessions for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createAttendanceSession(actorUserId, tenantId, courseId, {
        title: 'Week 2 seminar',
        startsAt,
        endsAt,
        status: 'scheduled',
      }),
    ).resolves.toMatchObject({
      id: sessionId,
      courseId,
      title: 'Week 2 seminar',
      status: 'scheduled',
    });

    expect(coreMocks.createAttendanceSession).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      title: 'Week 2 seminar',
      startsAt,
      endsAt,
      status: 'scheduled',
    });
  });

  it('allows tenant staff without course membership to create sessions', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createAttendanceSession(actorUserId, tenantId, courseId, {
      title: 'Week 2 seminar',
      startsAt,
      endsAt,
      status: 'scheduled',
    });

    expect(coreMocks.createAttendanceSession).toHaveBeenCalled();
  });

  it('rejects students creating attendance sessions', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createAttendanceSession(actorUserId, tenantId, courseId, {
        title: 'Week 2 seminar',
        startsAt,
        endsAt,
        status: 'scheduled',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create attendance sessions. Ask an instructor for access.',
    });

    expect(coreMocks.createAttendanceSession).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createAttendanceSession.mockRejectedValue(missingAttendanceSessionCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createAttendanceSession(actorUserId, tenantId, courseId, {
        title: 'Week 2 seminar',
        startsAt,
        endsAt,
        status: 'scheduled',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });
});
