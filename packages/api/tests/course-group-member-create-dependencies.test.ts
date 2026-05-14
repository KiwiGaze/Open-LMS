import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createCourseGroupMember: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getCourseGroupForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createCourseGroupMember: coreMocks.createCourseGroupMember,
    createDbHandle: coreMocks.createDbHandle,
    getCourseGroupForCourse: coreMocks.getCourseGroupForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const groupSetId = '01J9QW7B6N5W2YH3D3A1V0KE55';
const groupId = '01J9QW7B6N5W2YH3D3A1V0KE56';
const memberUserId = '01J9QW7B6N5W2YH3D3A1V0KE8M';
const memberId = '01J9QW7B6N5W2YH3D3A1V0KE8N';
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

const sampleGroup = () => ({
  id: groupId,
  tenantId,
  courseId,
  groupSetId,
  name: 'Team Alpha',
  description: null,
  status: 'active',
  position: 0,
  createdAt: now,
  updatedAt: now,
});

const duplicateMemberError = (): unknown => ({
  code: '23505',
  constraint_name: 'course_group_member_tenant_group_user_uq',
});

describe('course group member creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getCourseGroupForCourse.mockResolvedValue(sampleGroup());
    coreMocks.createCourseGroupMember.mockResolvedValue({
      id: memberId,
      tenantId,
      groupId,
      userId: memberUserId,
      role: 'member',
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('adds members to a group for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGroupMember(actorUserId, tenantId, courseId, groupId, {
        userId: memberUserId,
        role: 'member',
      }),
    ).resolves.toMatchObject({
      id: memberId,
      groupId,
      userId: memberUserId,
      role: 'member',
    });

    expect(coreMocks.createCourseGroupMember).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      groupId,
      userId: memberUserId,
      role: 'member',
    });
  });

  it('allows tenant staff without course membership to add members', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createCourseGroupMember(actorUserId, tenantId, courseId, groupId, {
      userId: memberUserId,
      role: 'leader',
    });

    expect(coreMocks.createCourseGroupMember).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      groupId,
      userId: memberUserId,
      role: 'leader',
    });
  });

  it('rejects students adding members', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGroupMember(actorUserId, tenantId, courseId, groupId, {
        userId: memberUserId,
        role: 'member',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can add members to course groups. Ask an instructor for access.',
    });

    expect(coreMocks.createCourseGroupMember).not.toHaveBeenCalled();
  });

  it('returns not found when the group does not belong to the course', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.getCourseGroupForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGroupMember(actorUserId, tenantId, courseId, groupId, {
        userId: memberUserId,
        role: 'member',
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Course group was not found in this course. Check the group id and retry the request.',
    });

    expect(coreMocks.createCourseGroupMember).not.toHaveBeenCalled();
  });

  it('maps duplicate memberships to a conflict', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createCourseGroupMember.mockRejectedValue(duplicateMemberError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createCourseGroupMember(actorUserId, tenantId, courseId, groupId, {
        userId: memberUserId,
        role: 'member',
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'User is already a member of this group. Remove the existing membership before adding them again.',
    });
  });
});
