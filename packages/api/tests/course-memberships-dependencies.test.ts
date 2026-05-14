import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createCourseMembership: vi.fn(),
  createDbHandle: vi.fn(),
  listCourseMemberships: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseMembership: coreMocks.createCourseMembership,
    createDbHandle: coreMocks.createDbHandle,
    listCourseMemberships: coreMocks.listCourseMemberships,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const targetUserId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const membershipId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const now = new Date('2026-05-10T00:00:00.000Z');

const createDependencies = () =>
  createApiDependencies({
    DATABASE_CONNECTION_STRING: 'postgresql://openlms:openlms@localhost:5432/openlms',
  });

const configureCourseAccess = (tenantRole: TenantRole, courseRole: CourseRole | null): void => {
  coreMocks.listUserTenantMemberships.mockResolvedValue([
    { tenantId, userId: actorUserId, role: tenantRole },
    { tenantId, userId: targetUserId, role: 'student' },
  ]);
  coreMocks.listUserCourseMemberships.mockResolvedValue(
    courseRole ? [{ tenantId, courseId, role: courseRole }] : [],
  );
};

const duplicateCourseMembershipError = (): unknown => ({
  code: '23505',
  constraint_name: 'course_membership_tenant_course_user_role_uq',
});

const missingCourseMembershipError = (): unknown => ({
  code: '23503',
  constraint_name: 'course_membership_tenant_course_fk',
});

describe('course membership API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listCourseMemberships.mockResolvedValue([]);
    coreMocks.createCourseMembership.mockResolvedValue({
      id: membershipId,
      tenantId,
      courseId,
      userId: targetUserId,
      role: 'student',
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates course memberships for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseMembership(actorUserId, tenantId, courseId, {
        userId: targetUserId,
        role: 'student',
      }),
    ).resolves.toMatchObject({
      id: membershipId,
      tenantId,
      courseId,
      userId: targetUserId,
      role: 'student',
    });

    expect(coreMocks.createCourseMembership).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      userId: targetUserId,
      role: 'student',
      status: 'active',
    });
  });

  it('creates course memberships for tenant staff without course membership', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseMembership(actorUserId, tenantId, courseId, {
      userId: targetUserId,
      role: 'teaching_assistant',
    });

    expect(coreMocks.createCourseMembership).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      userId: targetUserId,
      role: 'teaching_assistant',
      status: 'active',
    });
  });

  it('rejects students creating course memberships', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseMembership(actorUserId, tenantId, courseId, {
        userId: targetUserId,
        role: 'student',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create course memberships. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseMembership).not.toHaveBeenCalled();
  });

  it('rejects course memberships for users outside the tenant', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.listUserTenantMemberships.mockImplementation((_, requestedUserId: string) =>
      Promise.resolve(requestedUserId === targetUserId ? [] : [{ tenantId, role: 'instructor' }]),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseMembership(actorUserId, tenantId, courseId, {
        userId: targetUserId,
        role: 'student',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'User is not a member of this tenant. Add the user to the tenant before creating a course membership.',
    });

    expect(coreMocks.createCourseMembership).not.toHaveBeenCalled();
  });

  it('maps duplicate course membership races to a conflict', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.createCourseMembership.mockRejectedValue(duplicateCourseMembershipError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseMembership(actorUserId, tenantId, courseId, {
        userId: targetUserId,
        role: 'student',
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'Course membership already exists for this user and role. Refresh memberships and retry only if another role is needed.',
    });
  });

  it('maps missing course foreign key failures to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseMembership.mockRejectedValue(missingCourseMembershipError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseMembership(actorUserId, tenantId, courseId, {
        userId: targetUserId,
        role: 'student',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('passes the role filter through when listing memberships', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.listCourseMemberships(actorUserId, tenantId, courseId, 'student');

    expect(coreMocks.listCourseMemberships).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      role: 'student',
    });
  });

  it('omits the role filter when none is provided', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.listCourseMemberships(actorUserId, tenantId, courseId);

    expect(coreMocks.listCourseMemberships).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      role: undefined,
    });
  });
});
