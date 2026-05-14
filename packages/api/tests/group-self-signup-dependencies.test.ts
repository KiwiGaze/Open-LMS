import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseGroupMember: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteCourseGroupMembershipForUser: vi.fn(),
  getCourseGroupForCourse: vi.fn(),
  getCourseGroupSetById: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseGroupMember: coreMocks.createCourseGroupMember,
    createDbHandle: coreMocks.createDbHandle,
    deleteCourseGroupMembershipForUser: coreMocks.deleteCourseGroupMembershipForUser,
    getCourseGroupForCourse: coreMocks.getCourseGroupForCourse,
    getCourseGroupSetById: coreMocks.getCourseGroupSetById,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE80';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE81';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE82';
const groupSetId = '01J9QW7B6N5W2YH3D3A1V0KE83';
const groupId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const memberId = '01J9QW7B6N5W2YH3D3A1V0KE85';
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

const sampleGroup = (overrides: Partial<{ status: 'active' | 'archived' }> = {}) => ({
  id: groupId,
  tenantId,
  courseId,
  groupSetId,
  name: 'Team A',
  description: null,
  status: overrides.status ?? 'active',
  position: 0,
  createdAt: now,
  updatedAt: now,
});

const sampleGroupSet = (
  overrides: Partial<{ selfSignupEnabled: boolean; status: 'active' | 'archived' }> = {},
) => ({
  id: groupSetId,
  tenantId,
  courseId,
  name: 'Project teams',
  selfSignupEnabled: overrides.selfSignupEnabled ?? true,
  status: overrides.status ?? 'active',
  position: 0,
  createdAt: now,
  updatedAt: now,
});

describe('group self-signup API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getCourseGroupForCourse.mockResolvedValue(sampleGroup());
    coreMocks.getCourseGroupSetById.mockResolvedValue(sampleGroupSet());
    coreMocks.createCourseGroupMember.mockResolvedValue({
      id: memberId,
      tenantId,
      groupId,
      userId: actorUserId,
      role: 'member',
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('lets a student join a group when self-signup is enabled', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.joinCourseGroup(actorUserId, tenantId, courseId, groupId),
    ).resolves.toMatchObject({ id: memberId, userId: actorUserId, role: 'member' });

    expect(coreMocks.createCourseGroupMember).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      groupId,
      userId: actorUserId,
      role: 'member',
    });
  });

  it('rejects when self-signup is disabled on the group set', async () => {
    coreMocks.getCourseGroupSetById.mockResolvedValue(sampleGroupSet({ selfSignupEnabled: false }));
    const dependencies = createDependencies();

    await expect(
      dependencies.joinCourseGroup(actorUserId, tenantId, courseId, groupId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.createCourseGroupMember).not.toHaveBeenCalled();
  });

  it('rejects when the group is archived', async () => {
    coreMocks.getCourseGroupForCourse.mockResolvedValue(sampleGroup({ status: 'archived' }));
    const dependencies = createDependencies();

    await expect(
      dependencies.joinCourseGroup(actorUserId, tenantId, courseId, groupId),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('rejects when the group set is archived', async () => {
    coreMocks.getCourseGroupSetById.mockResolvedValue(sampleGroupSet({ status: 'archived' }));
    const dependencies = createDependencies();

    await expect(
      dependencies.joinCourseGroup(actorUserId, tenantId, courseId, groupId),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('returns conflict if the student already belongs to the group', async () => {
    coreMocks.createCourseGroupMember.mockRejectedValue({
      code: '23505',
      constraint_name: 'course_group_member_tenant_group_user_uq',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.joinCourseGroup(actorUserId, tenantId, courseId, groupId),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('rejects when the actor is not enrolled in the course', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.joinCourseGroup(actorUserId, tenantId, courseId, groupId),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('group leave API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getCourseGroupForCourse.mockResolvedValue(sampleGroup());
    coreMocks.deleteCourseGroupMembershipForUser.mockResolvedValue(undefined);
    configureCourseAccess('student', 'student');
  });

  it('removes the actor from the group', async () => {
    const dependencies = createDependencies();

    await dependencies.leaveCourseGroup(actorUserId, tenantId, courseId, groupId);

    expect(coreMocks.deleteCourseGroupMembershipForUser).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      { tenantId, groupId, userId: actorUserId },
    );
  });

  it('is idempotent when the actor was never a member', async () => {
    coreMocks.deleteCourseGroupMembershipForUser.mockResolvedValue(undefined);
    const dependencies = createDependencies();

    await expect(
      dependencies.leaveCourseGroup(actorUserId, tenantId, courseId, groupId),
    ).resolves.toBeUndefined();
  });

  it('returns not_found when the group does not exist', async () => {
    coreMocks.getCourseGroupForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.leaveCourseGroup(actorUserId, tenantId, courseId, groupId),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.deleteCourseGroupMembershipForUser).not.toHaveBeenCalled();
  });

  it('rejects when the actor is not enrolled in the course', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.leaveCourseGroup(actorUserId, tenantId, courseId, groupId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteCourseGroupMembershipForUser).not.toHaveBeenCalled();
  });
});
