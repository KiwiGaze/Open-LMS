import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createDbHandle: vi.fn(),
  getAssignmentById: vi.fn(),
  listAssignmentPeerReviewsForAssignment: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getAssignmentById: coreMocks.getAssignmentById,
    listAssignmentPeerReviewsForAssignment: coreMocks.listAssignmentPeerReviewsForAssignment,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE70';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE72';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE73';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE74';

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

describe('assignment peer review API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getAssignmentById.mockResolvedValue({ courseId });
    coreMocks.listAssignmentPeerReviewsForAssignment.mockResolvedValue([]);
    configureCourseAccess('student', 'student');
  });

  it('lists only assigned peer reviews for students', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listAssignmentPeerReviews(actorUserId, tenantId, courseId, assignmentId),
    ).resolves.toEqual([]);

    expect(coreMocks.listAssignmentPeerReviewsForAssignment).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        assignmentId,
        reviewerId: actorUserId,
      },
    );
  });

  it('lists all assignment peer reviews for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.listAssignmentPeerReviews(actorUserId, tenantId, courseId, assignmentId);

    expect(coreMocks.listAssignmentPeerReviewsForAssignment).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        assignmentId,
        reviewerId: undefined,
      },
    );
  });

  it('rejects peer reviews when the assignment belongs to another course', async () => {
    coreMocks.getAssignmentById.mockResolvedValue({
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE75',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.listAssignmentPeerReviews(actorUserId, tenantId, courseId, assignmentId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Assignment was not found in this course. Check the assignment id and retry the request.',
    });

    expect(coreMocks.listAssignmentPeerReviewsForAssignment).not.toHaveBeenCalled();
  });

  it('rejects peer reviews for tenant members without course access', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listAssignmentPeerReviews(actorUserId, tenantId, courseId, assignmentId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'You are not a member of this course. Switch courses or ask an instructor for access.',
    });

    expect(coreMocks.listAssignmentPeerReviewsForAssignment).not.toHaveBeenCalled();
  });
});
