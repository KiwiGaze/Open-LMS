import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseGroup: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseGroup: coreMocks.createCourseGroup,
    createDbHandle: coreMocks.createDbHandle,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const groupSetId = '01J9QW7B6N5W2YH3D3A1V0KE55';
const groupId = '01J9QW7B6N5W2YH3D3A1V0KE56';
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
  constraint_name: 'course_group_tenant_course_fk',
});

const missingGroupSetError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_group_tenant_group_set_fk',
});

describe('course group creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createCourseGroup.mockResolvedValue({
      id: groupId,
      tenantId,
      courseId,
      groupSetId,
      name: 'Team Alpha',
      description: 'Project team for week 1.',
      status: 'active',
      position: 0,
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates groups for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGroup(actorUserId, tenantId, courseId, {
        groupSetId,
        name: 'Team Alpha',
        description: 'Project team for week 1.',
        status: 'active',
        position: 0,
      }),
    ).resolves.toMatchObject({
      id: groupId,
      courseId,
      groupSetId,
      name: 'Team Alpha',
    });

    expect(coreMocks.createCourseGroup).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      groupSetId,
      name: 'Team Alpha',
      description: 'Project team for week 1.',
      status: 'active',
      position: 0,
    });
  });

  it('allows tenant staff without course membership to create groups', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseGroup(actorUserId, tenantId, courseId, {
      groupSetId,
      name: 'Team Beta',
      description: null,
      status: 'active',
      position: 1,
    });

    expect(coreMocks.createCourseGroup).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      groupSetId,
      name: 'Team Beta',
      description: null,
      status: 'active',
      position: 1,
    });
  });

  it('rejects students creating groups', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGroup(actorUserId, tenantId, courseId, {
        groupSetId,
        name: 'Team Alpha',
        description: null,
        status: 'active',
        position: 0,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create course groups. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseGroup).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseGroup.mockRejectedValue(missingCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGroup(actorUserId, tenantId, courseId, {
        groupSetId,
        name: 'Team Alpha',
        description: null,
        status: 'active',
        position: 0,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('maps missing group sets to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseGroup.mockRejectedValue(missingGroupSetError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGroup(actorUserId, tenantId, courseId, {
        groupSetId,
        name: 'Team Alpha',
        description: null,
        status: 'active',
        position: 0,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Course group set was not found in this tenant. Check the group set id and retry the request.',
    });
  });
});
