import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  buildGradeChangeAuditLog: vi.fn(),
  buildGradeChangedEvent: vi.fn(),
  buildGradePublishedEvent: vi.fn(),
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getAssignmentById: vi.fn(),
  getGradeBySubmissionId: vi.fn(),
  getSubmissionById: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  saveAuditLog: vi.fn(),
  saveOutboxEvent: vi.fn(),
  upsertSubmissionGrade: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    buildGradeChangeAuditLog: coreMocks.buildGradeChangeAuditLog,
    buildGradeChangedEvent: coreMocks.buildGradeChangedEvent,
    buildGradePublishedEvent: coreMocks.buildGradePublishedEvent,
    createDbHandle: coreMocks.createDbHandle,
    getAssignmentById: coreMocks.getAssignmentById,
    getGradeBySubmissionId: coreMocks.getGradeBySubmissionId,
    getSubmissionById: coreMocks.getSubmissionById,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    saveAuditLog: coreMocks.saveAuditLog,
    saveOutboxEvent: coreMocks.saveOutboxEvent,
    upsertSubmissionGrade: coreMocks.upsertSubmissionGrade,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE70';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE71';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE72';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE73';
const submissionId = '01J9QW7B6N5W2YH3D3A1V0KE74';
const studentId = '01J9QW7B6N5W2YH3D3A1V0KE75';
const gradeId = '01J9QW7B6N5W2YH3D3A1V0KE76';
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

const sampleAssignment = () => ({
  id: assignmentId,
  tenantId,
  courseId,
  moduleId: null,
  unitId: null,
  position: null,
  title: 'Essay 1',
  instructions: 'Defend a thesis.',
  status: 'published' as const,
  dueAt: new Date('2026-05-08T00:00:00.000Z'),
  allowResubmission: false,
  activeRubricId: null,
  aiSettings: {
    precheckEnabled: false,
    feedbackDraftEnabled: false,
    scoreSuggestionEnabled: false,
  },
  latePenaltyPercentPerDay: null,
  lateMaxPenaltyPercent: null,
  createdAt: now,
  updatedAt: now,
});

const sampleSubmission = (overrides: Partial<{ assignmentId: string }> = {}) => ({
  id: submissionId,
  tenantId,
  assignmentId: overrides.assignmentId ?? assignmentId,
  studentId,
  sourceDraftId: '01J9QW7B6N5W2YH3D3A1V0KE77',
  version: 1,
  status: 'submitted' as const,
  contentSnapshot: [],
  submittedAt: new Date('2026-05-10T00:00:00.000Z'),
  createdAt: now,
});

const existingGrade = {
  id: gradeId,
  tenantId,
  submissionId,
  score: 7,
  maxScore: 10,
  status: 'draft' as const,
  source: 'manual' as const,
  createdAt: now,
  updatedAt: now,
};

describe('submission grade upsert API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getAssignmentById.mockResolvedValue(sampleAssignment());
    coreMocks.getSubmissionById.mockResolvedValue(sampleSubmission());
    coreMocks.getGradeBySubmissionId.mockResolvedValue(null);
    coreMocks.buildGradeChangeAuditLog.mockReturnValue({ id: 'audit-log' });
    coreMocks.buildGradeChangedEvent.mockReturnValue({ id: 'outbox-event' });
    coreMocks.buildGradePublishedEvent.mockReturnValue({ id: 'grade-published-event' });
    coreMocks.saveAuditLog.mockResolvedValue({ id: 'audit-log' });
    coreMocks.saveOutboxEvent.mockResolvedValue({ id: 'outbox-event' });
    coreMocks.upsertSubmissionGrade.mockResolvedValue({
      id: gradeId,
      tenantId,
      submissionId,
      score: 8.5,
      maxScore: 10,
      status: 'published',
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('grades submissions for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertSubmissionGrade(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        submissionId,
        {
          score: 8.5,
          maxScore: 10,
          status: 'published',
        },
      ),
    ).resolves.toMatchObject({ id: gradeId, score: 8.5, source: 'manual' });

    expect(coreMocks.upsertSubmissionGrade).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        actorId: actorUserId,
        tenantId,
        submissionId,
        score: 8.5,
        maxScore: 10,
        status: 'published',
        source: 'manual',
      }),
    );
  });

  it('records a grade-published lifecycle event when the first visible grade is saved', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.upsertSubmissionGrade(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      {
        score: 8.5,
        maxScore: 10,
        status: 'published',
      },
    );

    expect(coreMocks.buildGradePublishedEvent).toHaveBeenCalledWith(
      {
        grade: expect.objectContaining({
          tenantId,
          submissionId,
          status: 'published',
        }),
      },
      expect.any(Date),
    );
    expect(coreMocks.saveOutboxEvent).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      id: 'grade-published-event',
    });
  });

  it('does not record grade-published lifecycle events for draft grades', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.upsertSubmissionGrade.mockResolvedValue({
      id: gradeId,
      tenantId,
      submissionId,
      score: 8.5,
      maxScore: 10,
      status: 'draft',
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    });
    const dependencies = createDependencies();

    await dependencies.upsertSubmissionGrade(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      {
        score: 8.5,
        maxScore: 10,
        status: 'draft',
      },
    );

    expect(coreMocks.buildGradePublishedEvent).not.toHaveBeenCalled();
  });

  it('applies configured late penalties before saving grades', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getAssignmentById.mockResolvedValue({
      ...sampleAssignment(),
      latePenaltyPercentPerDay: 10,
      lateMaxPenaltyPercent: 50,
    });
    const dependencies = createDependencies();

    await dependencies.upsertSubmissionGrade(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      {
        score: 10,
        maxScore: 10,
        status: 'published',
      },
    );

    expect(coreMocks.upsertSubmissionGrade).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        score: 8,
        maxScore: 10,
      }),
    );
  });

  it('records audit and outbox events when an existing grade changes', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getGradeBySubmissionId.mockResolvedValue(existingGrade);
    coreMocks.upsertSubmissionGrade.mockResolvedValue({ ...existingGrade, score: 9 });
    const dependencies = createDependencies();

    await dependencies.upsertSubmissionGrade(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
      {
        score: 9,
        maxScore: 10,
        status: 'published',
      },
    );

    expect(coreMocks.buildGradeChangeAuditLog).toHaveBeenCalledWith(
      {
        actorId: actorUserId,
        previousGrade: existingGrade,
        grade: expect.objectContaining({ score: 9 }),
      },
      expect.any(Date),
    );
    expect(coreMocks.saveAuditLog).toHaveBeenCalledWith(coreMocks.dbHandle.db, { id: 'audit-log' });
    expect(coreMocks.saveOutboxEvent).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      id: 'outbox-event',
    });
  });

  it('rejects students with forbidden', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertSubmissionGrade(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        submissionId,
        {
          score: 5,
          maxScore: 10,
          status: 'published',
        },
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.upsertSubmissionGrade).not.toHaveBeenCalled();
  });

  it('returns not_found when the assignment does not exist', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getAssignmentById.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertSubmissionGrade(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        submissionId,
        {
          score: 5,
          maxScore: 10,
          status: 'published',
        },
      ),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('returns not_found when the submission belongs to a different assignment', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getSubmissionById.mockResolvedValue(
      sampleSubmission({ assignmentId: '01J9QW7B6N5W2YH3D3A1V0KE78' }),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.upsertSubmissionGrade(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        submissionId,
        {
          score: 5,
          maxScore: 10,
          status: 'published',
        },
      ),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});
