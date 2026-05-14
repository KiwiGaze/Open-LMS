import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteCourseMembership: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateCourseMembership: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteCourseMembership: coreMocks.deleteCourseMembership,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateCourseMembership: coreMocks.updateCourseMembership,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const courseMembershipId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const targetUserId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const now = new Date('2026-05-12T00:00:00.000Z');

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

const sampleMembership = () => ({
  id: courseMembershipId,
  tenantId,
  courseId,
  userId: targetUserId,
  role: 'teaching_assistant',
  createdAt: now,
  updatedAt: now,
});

const updateInput = { role: 'teaching_assistant' as const };

describe('course membership update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateCourseMembership.mockResolvedValue(sampleMembership());
    coreMocks.deleteCourseMembership.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a course membership role for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseMembership(
        actorUserId,
        tenantId,
        courseId,
        courseMembershipId,
        updateInput,
      ),
    ).resolves.toMatchObject({ id: courseMembershipId, role: 'teaching_assistant' });

    expect(coreMocks.updateCourseMembership).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      courseMembershipId,
      role: 'teaching_assistant',
    });
  });

  it('returns not found when updating a missing course membership', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseMembership.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseMembership(
        actorUserId,
        tenantId,
        courseId,
        courseMembershipId,
        updateInput,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Course membership was not found in this course. Check the membership id and retry the request.',
    });
  });

  it('returns conflict when role change duplicates existing membership', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateCourseMembership.mockRejectedValue({
      code: '23505',
      constraint_name: 'course_membership_tenant_course_user_role_uq',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseMembership(
        actorUserId,
        tenantId,
        courseId,
        courseMembershipId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('rejects students from updating course memberships', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateCourseMembership(
        actorUserId,
        tenantId,
        courseId,
        courseMembershipId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateCourseMembership).not.toHaveBeenCalled();
  });

  it('deletes a course membership for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseMembership(actorUserId, tenantId, courseId, courseMembershipId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteCourseMembership).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      courseMembershipId,
    });
  });

  it('returns not found when deleting a missing course membership', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteCourseMembership.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseMembership(actorUserId, tenantId, courseId, courseMembershipId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Course membership was not found in this course. Check the membership id and retry the request.',
    });
  });

  it('rejects students from deleting course memberships', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteCourseMembership(actorUserId, tenantId, courseId, courseMembershipId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteCourseMembership).not.toHaveBeenCalled();
  });
});
