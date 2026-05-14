import type { CourseRole, GradeStatus, SubmissionId, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  buildGradePublishedEvent: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getAssignmentById: vi.fn(),
  getGradeBySubmissionId: vi.fn(),
  listSubmissionsForAssignment: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  saveOutboxEvent: vi.fn(),
  upsertSubmissionGrade: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();
  return {
    ...actual,
    buildGradePublishedEvent: coreMocks.buildGradePublishedEvent,
    createDbHandle: coreMocks.createDbHandle,
    getAssignmentById: coreMocks.getAssignmentById,
    getGradeBySubmissionId: coreMocks.getGradeBySubmissionId,
    listSubmissionsForAssignment: coreMocks.listSubmissionsForAssignment,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    saveOutboxEvent: coreMocks.saveOutboxEvent,
    upsertSubmissionGrade: coreMocks.upsertSubmissionGrade,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE40';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE41';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE42';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE43';
const submissionAId = '01J9QW7B6N5W2YH3D3A1V0KE44';
const submissionBId = '01J9QW7B6N5W2YH3D3A1V0KE45';
const missingSubmissionId = '01J9QW7B6N5W2YH3D3A1V0KE46';
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

const draftItem = (submissionId: string, score: number) => ({
  submissionId: submissionId as SubmissionId,
  score,
  maxScore: 10,
  status: 'draft' as GradeStatus,
});

const publishedItem = (submissionId: string, score: number) => ({
  submissionId: submissionId as SubmissionId,
  score,
  maxScore: 10,
  status: 'published' as GradeStatus,
});

describe('batch submission grading dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getAssignmentById.mockResolvedValue({
      id: assignmentId,
      tenantId,
      courseId,
      dueAt: null,
      latePenaltyPercentPerDay: null,
      lateMaxPenaltyPercent: null,
    });
    coreMocks.getGradeBySubmissionId.mockResolvedValue(null);
    coreMocks.buildGradePublishedEvent.mockReturnValue({ id: 'grade-published-event' });
    coreMocks.saveOutboxEvent.mockResolvedValue({ id: 'grade-published-event' });
    coreMocks.listSubmissionsForAssignment.mockResolvedValue([
      { id: submissionAId, tenantId, assignmentId },
      { id: submissionBId, tenantId, assignmentId },
    ]);
    configureCourseAccess('instructor', null);
  });

  it('saves valid grades and surfaces per-item failures (per-item commit, not transactional)', async () => {
    coreMocks.upsertSubmissionGrade.mockImplementation(async (_db, input) => ({
      id: '01J9QW7B6N5W2YH3D3A1V0KE50',
      tenantId,
      submissionId: input.submissionId,
      score: input.score,
      maxScore: input.maxScore,
      status: input.status,
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    }));

    const dependencies = createDependencies();
    const result = await dependencies.batchUpsertSubmissionGrades(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      [draftItem(submissionAId, 9), draftItem(missingSubmissionId, 5), draftItem(submissionBId, 7)],
    );

    expect(result.savedCount).toBe(2);
    expect(result.failedCount).toBe(1);
    expect(result.results).toHaveLength(3);
    expect(result.results[0]).toMatchObject({ submissionId: submissionAId, status: 'saved' });
    expect(result.results[1]).toMatchObject({
      submissionId: missingSubmissionId,
      status: 'failed',
    });
    expect(result.results[1]?.error).toContain('Submission not found');
    expect(result.results[2]).toMatchObject({ submissionId: submissionBId, status: 'saved' });
  });

  it('records grade-published lifecycle events for first visible batch grades', async () => {
    coreMocks.upsertSubmissionGrade.mockImplementation(async (_db, input) => ({
      id: '01J9QW7B6N5W2YH3D3A1V0KE50',
      tenantId,
      submissionId: input.submissionId,
      score: input.score,
      maxScore: input.maxScore,
      status: input.status,
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    }));

    const dependencies = createDependencies();
    await dependencies.batchUpsertSubmissionGrades(actorUserId, tenantId, courseId, assignmentId, [
      publishedItem(submissionAId, 9),
    ]);

    expect(coreMocks.buildGradePublishedEvent).toHaveBeenCalledWith(
      {
        grade: expect.objectContaining({
          tenantId,
          submissionId: submissionAId,
          status: 'published',
        }),
      },
      expect.any(Date),
    );
    expect(coreMocks.saveOutboxEvent).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      id: 'grade-published-event',
    });
  });

  it('rejects callers without course staff access', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();
    await expect(
      dependencies.batchUpsertSubmissionGrades(actorUserId, tenantId, courseId, assignmentId, [
        draftItem(submissionAId, 9),
      ]),
    ).rejects.toMatchObject({ code: 'forbidden' });
    expect(coreMocks.upsertSubmissionGrade).not.toHaveBeenCalled();
  });

  it('returns not_found when the assignment does not belong to the course', async () => {
    coreMocks.getAssignmentById.mockResolvedValue({
      id: assignmentId,
      tenantId,
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE47',
    });
    const dependencies = createDependencies();
    await expect(
      dependencies.batchUpsertSubmissionGrades(actorUserId, tenantId, courseId, assignmentId, [
        draftItem(submissionAId, 9),
      ]),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('captures upsert errors per-item and continues with the rest', async () => {
    coreMocks.upsertSubmissionGrade.mockImplementation(async (_db, input) => {
      if (input.submissionId === submissionAId) {
        throw new Error('database write failed');
      }
      return {
        id: '01J9QW7B6N5W2YH3D3A1V0KE51',
        tenantId,
        submissionId: input.submissionId,
        score: input.score,
        maxScore: input.maxScore,
        status: input.status,
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      };
    });
    const dependencies = createDependencies();
    const result = await dependencies.batchUpsertSubmissionGrades(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      [draftItem(submissionAId, 9), draftItem(submissionBId, 7)],
    );
    expect(result.savedCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.results[0]).toMatchObject({ submissionId: submissionAId, status: 'failed' });
    expect(result.results[0]?.error).toContain('database write failed');
    expect(result.results[1]).toMatchObject({ submissionId: submissionBId, status: 'saved' });
  });

  it('imports submission grades from CSV through the batch grading workflow', async () => {
    coreMocks.upsertSubmissionGrade.mockImplementation(async (_db, input) => ({
      id: '01J9QW7B6N5W2YH3D3A1V0KE50',
      tenantId,
      submissionId: input.submissionId,
      score: input.score,
      maxScore: input.maxScore,
      status: input.status,
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    }));

    const dependencies = createDependencies();
    const result = await dependencies.importSubmissionGradesCsv(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      [
        'submission_id,score,max_score,status',
        `${submissionAId},8.5,10,published`,
        `${submissionBId},7,10,draft`,
      ].join('\n'),
    );

    expect(result.savedCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(coreMocks.upsertSubmissionGrade).toHaveBeenNthCalledWith(
      1,
      coreMocks.dbHandle.db,
      expect.objectContaining({
        tenantId,
        submissionId: submissionAId,
        score: 8.5,
        maxScore: 10,
        status: 'published',
        source: 'manual',
        actorId: actorUserId,
      }),
    );
    expect(coreMocks.upsertSubmissionGrade).toHaveBeenNthCalledWith(
      2,
      coreMocks.dbHandle.db,
      expect.objectContaining({
        tenantId,
        submissionId: submissionBId,
        score: 7,
        maxScore: 10,
        status: 'draft',
        source: 'manual',
        actorId: actorUserId,
      }),
    );
  });

  it('rejects malformed submission grade CSV before grading', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.importSubmissionGradesCsv(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        ['submission_id,score,max_score,status', `${submissionAId},11,10,published`].join('\n'),
      ),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Submission grade CSV row 2 has score greater than max_score.',
    });

    expect(coreMocks.upsertSubmissionGrade).not.toHaveBeenCalled();
  });

  it('rejects CSV imports from callers without course staff access', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.importSubmissionGradesCsv(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        ['submission_id,score,max_score,status', `${submissionAId},8,10,published`].join('\n'),
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.upsertSubmissionGrade).not.toHaveBeenCalled();
  });

  it('checks course staff access before validating CSV import contents', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.importSubmissionGradesCsv(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        ['submission_id,score,max_score,status', `${submissionAId},11,10,published`].join('\n'),
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.upsertSubmissionGrade).not.toHaveBeenCalled();
  });
});
