import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createDbHandle: vi.fn(),
  getAssignmentById: vi.fn(),
  listAssignmentOverridesForAssignment: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getAssignmentById: coreMocks.getAssignmentById,
    listAssignmentOverridesForAssignment: coreMocks.listAssignmentOverridesForAssignment,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE8A';

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

describe('assignment override API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getAssignmentById.mockResolvedValue({ courseId });
    coreMocks.listAssignmentOverridesForAssignment.mockResolvedValue([]);
    configureCourseAccess('student', 'instructor');
  });

  it('lists assignment overrides for course staff', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listAssignmentOverrides(actorUserId, tenantId, courseId, assignmentId),
    ).resolves.toEqual([]);

    expect(coreMocks.listAssignmentOverridesForAssignment).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        assignmentId,
        statuses: ['active', 'archived'],
      },
    );
  });

  it('lists assignment overrides for tenant staff without course membership', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listAssignmentOverrides(actorUserId, tenantId, courseId, assignmentId),
    ).resolves.toEqual([]);

    expect(coreMocks.listAssignmentOverridesForAssignment).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        assignmentId,
        statuses: ['active', 'archived'],
      },
    );
  });

  it('rejects assignment override listing for students', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.listAssignmentOverrides(actorUserId, tenantId, courseId, assignmentId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can view assignment overrides. Ask an instructor for access.',
    });

    expect(coreMocks.listAssignmentOverridesForAssignment).not.toHaveBeenCalled();
  });

  it('rejects assignment override listing for tenant members without course access', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listAssignmentOverrides(actorUserId, tenantId, courseId, assignmentId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'You are not a member of this course. Switch courses or ask an instructor for access.',
    });

    expect(coreMocks.getAssignmentById).not.toHaveBeenCalled();
    expect(coreMocks.listAssignmentOverridesForAssignment).not.toHaveBeenCalled();
  });

  it('hides assignment overrides when the assignment does not exist', async () => {
    coreMocks.getAssignmentById.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listAssignmentOverrides(actorUserId, tenantId, courseId, assignmentId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Assignment was not found in this course. Check the assignment id and retry the request.',
    });

    expect(coreMocks.listAssignmentOverridesForAssignment).not.toHaveBeenCalled();
  });

  it('hides assignment overrides when the assignment is outside the course', async () => {
    coreMocks.getAssignmentById.mockResolvedValue({
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE8B',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.listAssignmentOverrides(actorUserId, tenantId, courseId, assignmentId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Assignment was not found in this course. Check the assignment id and retry the request.',
    });

    expect(coreMocks.listAssignmentOverridesForAssignment).not.toHaveBeenCalled();
  });
});
