import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseGroupSet: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseGroupSet: coreMocks.createCourseGroupSet,
    createDbHandle: coreMocks.createDbHandle,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const groupSetId = '01J9QW7B6N5W2YH3D3A1V0KE55';
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

const missingCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_group_set_tenant_course_fk',
});

describe('course group set creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createCourseGroupSet.mockResolvedValue({
      id: groupSetId,
      tenantId,
      courseId,
      name: 'Project teams',
      selfSignupEnabled: false,
      status: 'active',
      position: 0,
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates group sets for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGroupSet(actorUserId, tenantId, courseId, {
        name: 'Project teams',
        selfSignupEnabled: false,
        status: 'active',
        position: 0,
      }),
    ).resolves.toMatchObject({
      id: groupSetId,
      courseId,
      name: 'Project teams',
      selfSignupEnabled: false,
    });

    expect(coreMocks.createCourseGroupSet).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      name: 'Project teams',
      selfSignupEnabled: false,
      status: 'active',
      position: 0,
    });
  });

  it('allows tenant staff without course membership to create group sets', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseGroupSet(actorUserId, tenantId, courseId, {
      name: 'Study buddies',
      selfSignupEnabled: true,
      status: 'active',
      position: 1,
    });

    expect(coreMocks.createCourseGroupSet).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      name: 'Study buddies',
      selfSignupEnabled: true,
      status: 'active',
      position: 1,
    });
  });

  it('rejects students creating group sets', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGroupSet(actorUserId, tenantId, courseId, {
        name: 'Project teams',
        selfSignupEnabled: false,
        status: 'active',
        position: 0,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create group sets. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseGroupSet).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseGroupSet.mockRejectedValue(missingCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGroupSet(actorUserId, tenantId, courseId, {
        name: 'Project teams',
        selfSignupEnabled: false,
        status: 'active',
        position: 0,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });
});
