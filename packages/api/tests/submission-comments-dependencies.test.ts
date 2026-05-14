import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createDbHandle: vi.fn(),
  createSubmissionComment: vi.fn(),
  getAssignmentById: vi.fn(),
  getSubmissionById: vi.fn(),
  listAssignmentPeerReviewsForAssignment: vi.fn(),
  listSubmissionCommentsForSubmission: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createSubmissionComment: coreMocks.createSubmissionComment,
    getAssignmentById: coreMocks.getAssignmentById,
    getSubmissionById: coreMocks.getSubmissionById,
    listAssignmentPeerReviewsForAssignment: coreMocks.listAssignmentPeerReviewsForAssignment,
    listSubmissionCommentsForSubmission: coreMocks.listSubmissionCommentsForSubmission,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE70';
const otherStudentId = '01J9QW7B6N5W2YH3D3A1V0KE71';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE72';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE73';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE74';
const otherAssignmentId = '01J9QW7B6N5W2YH3D3A1V0KE75';
const submissionId = '01J9QW7B6N5W2YH3D3A1V0KE76';
const peerReviewId = '01J9QW7B6N5W2YH3D3A1V0KE78';
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

describe('submission comment API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getAssignmentById.mockResolvedValue({ courseId });
    coreMocks.getSubmissionById.mockResolvedValue({ assignmentId, studentId: actorUserId });
    coreMocks.listAssignmentPeerReviewsForAssignment.mockResolvedValue([]);
    coreMocks.listSubmissionCommentsForSubmission.mockResolvedValue([]);
    coreMocks.createSubmissionComment.mockResolvedValue({
      id: '01J9QW7B6N5W2YH3D3A1V0KE77',
      tenantId,
      submissionId,
      authorId: actorUserId,
      body: 'Please expand the evidence explanation.',
      visibility: 'student_visible',
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('lists only student-visible comments for the submitting student', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listSubmissionComments(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        submissionId,
      ),
    ).resolves.toEqual([]);

    expect(coreMocks.listSubmissionCommentsForSubmission).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        submissionId,
        visibilities: ['student_visible'],
      },
    );
  });

  it('lists student-visible, staff-only, and peer-reviewer comments for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getSubmissionById.mockResolvedValue({ assignmentId, studentId: otherStudentId });
    const dependencies = createDependencies();

    await dependencies.listSubmissionComments(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
    );

    expect(coreMocks.listSubmissionCommentsForSubmission).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        submissionId,
        visibilities: ['student_visible', 'staff_only', 'peer_reviewer_visible'],
      },
    );
  });

  it('lists peer-reviewer comments for an assigned peer reviewer', async () => {
    coreMocks.getSubmissionById.mockResolvedValue({ assignmentId, studentId: otherStudentId });
    coreMocks.listAssignmentPeerReviewsForAssignment.mockResolvedValue([
      { id: peerReviewId, tenantId, assignmentId, submissionId, reviewerId: actorUserId },
    ]);
    const dependencies = createDependencies();

    await dependencies.listSubmissionComments(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
    );

    expect(coreMocks.listAssignmentPeerReviewsForAssignment).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        assignmentId,
        reviewerId: actorUserId,
        submissionId,
      },
    );
    expect(coreMocks.listSubmissionCommentsForSubmission).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        submissionId,
        visibilities: ['peer_reviewer_visible'],
      },
    );
  });

  it('hides another student submission comments behind not found', async () => {
    coreMocks.getSubmissionById.mockResolvedValue({ assignmentId, studentId: otherStudentId });
    const dependencies = createDependencies();

    await expect(
      dependencies.listSubmissionComments(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        submissionId,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Submission was not found in this assignment. Check the submission id and retry the request.',
    });

    expect(coreMocks.listSubmissionCommentsForSubmission).not.toHaveBeenCalled();
  });

  it('hides submission comments when the submission belongs to another assignment', async () => {
    coreMocks.getSubmissionById.mockResolvedValue({
      assignmentId: otherAssignmentId,
      studentId: actorUserId,
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.listSubmissionComments(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        submissionId,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Submission was not found in this assignment. Check the submission id and retry the request.',
    });

    expect(coreMocks.listSubmissionCommentsForSubmission).not.toHaveBeenCalled();
  });

  it('creates student-visible comments for the submitting student', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createSubmissionComment(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        submissionId,
        {
          body: 'Please expand the evidence explanation.',
          visibility: 'student_visible',
        },
      ),
    ).resolves.toMatchObject({
      submissionId,
      authorId: actorUserId,
      visibility: 'student_visible',
    });

    expect(coreMocks.createSubmissionComment).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      submissionId,
      authorId: actorUserId,
      body: 'Please expand the evidence explanation.',
      visibility: 'student_visible',
    });
  });

  it('allows staff-only comments for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getSubmissionById.mockResolvedValue({ assignmentId, studentId: otherStudentId });
    const dependencies = createDependencies();

    await dependencies.createSubmissionComment(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      {
        body: 'Check for possible late penalty.',
        visibility: 'staff_only',
      },
    );

    expect(coreMocks.createSubmissionComment).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      submissionId,
      authorId: actorUserId,
      body: 'Check for possible late penalty.',
      visibility: 'staff_only',
    });
  });

  it('allows peer-reviewer comments for an assigned peer reviewer', async () => {
    coreMocks.getSubmissionById.mockResolvedValue({ assignmentId, studentId: otherStudentId });
    coreMocks.listAssignmentPeerReviewsForAssignment.mockResolvedValue([
      { id: peerReviewId, tenantId, assignmentId, submissionId, reviewerId: actorUserId },
    ]);
    coreMocks.createSubmissionComment.mockResolvedValue({
      id: '01J9QW7B6N5W2YH3D3A1V0KE77',
      tenantId,
      submissionId,
      authorId: actorUserId,
      body: 'The thesis needs a clearer counterargument.',
      visibility: 'peer_reviewer_visible',
      createdAt: now,
      updatedAt: now,
    });
    const dependencies = createDependencies();

    await dependencies.createSubmissionComment(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      {
        body: 'The thesis needs a clearer counterargument.',
        visibility: 'peer_reviewer_visible',
      },
    );

    expect(coreMocks.createSubmissionComment).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      submissionId,
      authorId: actorUserId,
      body: 'The thesis needs a clearer counterargument.',
      visibility: 'peer_reviewer_visible',
    });
  });

  it('rejects learner staff-only comments', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createSubmissionComment(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        submissionId,
        {
          body: 'Internal note',
          visibility: 'staff_only',
        },
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Learners can only create comments that are visible to students.',
    });

    expect(coreMocks.createSubmissionComment).not.toHaveBeenCalled();
  });
});
