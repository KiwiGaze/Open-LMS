import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  createFileResource: vi.fn(),
  createFileResourceId: vi.fn(),
  createGradeAppeal: vi.fn(),
  getIntegrationConnectionById: vi.fn(),
  getAssignmentById: vi.fn(),
  getGradeBySubmissionId: vi.fn(),
  getSubmissionById: vi.fn(),
  localFileStorage: { upload: vi.fn(), delete: vi.fn() },
  listCourseGradingSchemesForCourse: vi.fn(),
  listGradeAppealsForCourse: vi.fn(),
  listGradeHistoryForSubmission: vi.fn(),
  listGradebookCategoriesForCourse: vi.fn(),
  listGradebookEntriesForCourse: vi.fn(),
  listGradebookManualGradesForItem: vi.fn(),
  listGradebookManualItemsForCourse: vi.fn(),
  listSubmissionsForAssignment: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  saveOutboxEvent: vi.fn(),
  updateGradeAppealStatus: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createFileResource: coreMocks.createFileResource,
    createFileResourceId: coreMocks.createFileResourceId,
    createGradeAppeal: coreMocks.createGradeAppeal,
    getIntegrationConnectionById: coreMocks.getIntegrationConnectionById,
    getAssignmentById: coreMocks.getAssignmentById,
    getGradeBySubmissionId: coreMocks.getGradeBySubmissionId,
    getSubmissionById: coreMocks.getSubmissionById,
    LocalFileStorageProvider: vi.fn(() => coreMocks.localFileStorage),
    listCourseGradingSchemesForCourse: coreMocks.listCourseGradingSchemesForCourse,
    listGradeAppealsForCourse: coreMocks.listGradeAppealsForCourse,
    listGradeHistoryForSubmission: coreMocks.listGradeHistoryForSubmission,
    listGradebookCategoriesForCourse: coreMocks.listGradebookCategoriesForCourse,
    listGradebookEntriesForCourse: coreMocks.listGradebookEntriesForCourse,
    listGradebookManualGradesForItem: coreMocks.listGradebookManualGradesForItem,
    listGradebookManualItemsForCourse: coreMocks.listGradebookManualItemsForCourse,
    listSubmissionsForAssignment: coreMocks.listSubmissionsForAssignment,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    saveOutboxEvent: coreMocks.saveOutboxEvent,
    updateGradeAppealStatus: coreMocks.updateGradeAppealStatus,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE80';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE81';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE82';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE83';
const submissionId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const gradeId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const integrationConnectionId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const storageFileId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
const now = new Date('2026-05-13T00:00:00.000Z');

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

const submission = {
  id: submissionId,
  tenantId,
  assignmentId,
  studentId: actorUserId,
  sourceDraftId: '01J9QW7B6N5W2YH3D3A1V0KE86',
  version: 1,
  status: 'submitted',
  contentSnapshot: [],
  submittedAt: now,
  createdAt: now,
};

const grade = {
  id: gradeId,
  tenantId,
  submissionId,
  score: 9,
  maxScore: 10,
  status: 'published',
  source: 'manual',
  createdAt: now,
  updatedAt: now,
};

const gradebookEntry = {
  id: `gradebook_entry:${gradeId}`,
  tenantId,
  courseId,
  assignmentId,
  assignmentTitle: 'Essay 1',
  assignmentDueAt: null,
  assignmentExtraCredit: false,
  gradebookCategoryId: null,
  gradebookCategoryName: null,
  studentId: actorUserId,
  submissionId,
  submittedAt: now,
  gradeId,
  score: 9,
  maxScore: 10,
  gradeStatus: 'published' as const,
  gradeSource: 'manual' as const,
  gradedAt: now,
};

describe('gradebook foundation API dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getAssignmentById.mockResolvedValue({ id: assignmentId, tenantId, courseId });
    coreMocks.getIntegrationConnectionById.mockResolvedValue({
      id: integrationConnectionId,
      tenantId,
      providerType: 'sis_csv',
      displayName: 'Registrar CSV',
      status: 'enabled',
      config: {},
      createdAt: now,
      updatedAt: now,
    });
    coreMocks.getSubmissionById.mockResolvedValue(submission);
    coreMocks.getGradeBySubmissionId.mockResolvedValue(grade);
    coreMocks.listGradebookCategoriesForCourse.mockResolvedValue([]);
    coreMocks.listGradebookEntriesForCourse.mockResolvedValue([gradebookEntry]);
    coreMocks.listGradebookManualItemsForCourse.mockResolvedValue([]);
    coreMocks.listGradebookManualGradesForItem.mockResolvedValue([]);
    coreMocks.listCourseGradingSchemesForCourse.mockResolvedValue([]);
    coreMocks.listGradeHistoryForSubmission.mockResolvedValue([]);
    coreMocks.listGradeAppealsForCourse.mockResolvedValue([]);
    coreMocks.createFileResourceId.mockReturnValue(storageFileId);
    coreMocks.localFileStorage.upload.mockResolvedValue({
      storageProvider: 'local_fs',
      storageKey: `${tenantId}/${storageFileId}`,
    });
    coreMocks.localFileStorage.delete.mockResolvedValue(undefined);
    coreMocks.createFileResource.mockImplementation(async (_db, input) => ({
      id: input.id,
      tenantId: input.tenantId,
      courseId: input.courseId,
      ownerId: input.ownerId,
      storageProvider: input.storageProvider,
      storageKey: input.storageKey,
      filename: input.filename,
      mediaType: input.mediaType,
      byteSize: input.byteSize,
      checksumSha256: input.checksumSha256,
      visibility: input.visibility,
      altText: input.altText,
      transcriptText: input.transcriptText,
      license: input.license,
      copyrightHolder: input.copyrightHolder,
      createdAt: now,
    }));
    coreMocks.saveOutboxEvent.mockImplementation(async (_db, event) => event);
  });

  it('computes final grades for course staff from existing gradebook rows', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.listCourseFinalGrades(actorUserId, tenantId, courseId);

    expect(coreMocks.listGradebookCategoriesForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      statuses: ['active'],
    });
    expect(coreMocks.listGradebookEntriesForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      studentId: undefined,
      statuses: ['published', 'locked', 'appealed', 'revised', 'incomplete'],
    });
  });

  it('queues a SIS final grade submission for course staff without embedding grades in the event', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const result = await dependencies.submitCourseFinalGradesToSis(
      actorUserId,
      tenantId,
      courseId,
      { integrationConnectionId },
    );

    expect(result).toMatchObject({
      tenantId,
      courseId,
      integrationConnectionId,
      storageFileId,
      rowCount: 1,
      status: 'queued',
    });
    expect(coreMocks.localFileStorage.upload).toHaveBeenCalledWith({
      tenantId,
      fileResourceId: storageFileId,
      bytes: expect.any(Uint8Array),
    });
    const uploadedBytes = coreMocks.localFileStorage.upload.mock.calls[0]?.[0]?.bytes;
    expect(new TextDecoder().decode(uploadedBytes)).toContain(
      'tenant_id,course_id,student_id,score,max_score,percent,letter_grade,computed_at',
    );
    expect(coreMocks.createFileResource).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        tenantId,
        id: storageFileId,
        courseId,
        ownerId: actorUserId,
        filename: `sis-final-grades-${courseId}.csv`,
        mediaType: 'text/csv',
        visibility: 'course_staff',
      }),
    );
    expect(coreMocks.saveOutboxEvent).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        topic: 'integration.sis',
        eventType: 'sis.final_grades_submitted',
        payload: {
          courseId,
          integrationConnectionId,
          storageFileId,
          rowCount: 1,
        },
      }),
    );
  });

  it('rejects SIS final grade submission for non-SIS connections', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getIntegrationConnectionById.mockResolvedValue({
      id: integrationConnectionId,
      tenantId,
      providerType: 'generic_webhook',
      displayName: 'Webhook',
      status: 'enabled',
      config: {},
      createdAt: now,
      updatedAt: now,
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.submitCourseFinalGradesToSis(actorUserId, tenantId, courseId, {
        integrationConnectionId,
      }),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.localFileStorage.upload).not.toHaveBeenCalled();
    expect(coreMocks.saveOutboxEvent).not.toHaveBeenCalled();
  });

  it('allows students to appeal their own grade', async () => {
    configureCourseAccess('student', 'student');
    coreMocks.createGradeAppeal.mockResolvedValue({
      id: '01J9QW7B6N5W2YH3D3A1V0KE87',
      tenantId,
      gradeId,
      submissionId,
      studentId: actorUserId,
      status: 'open',
      reason: 'The rubric total appears incorrect.',
      resolution: null,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.createGradeAppeal(actorUserId, tenantId, courseId, assignmentId, submissionId, {
        reason: 'The rubric total appears incorrect.',
      }),
    ).resolves.toMatchObject({ status: 'open' });

    expect(coreMocks.createGradeAppeal).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        tenantId,
        gradeId,
        submissionId,
        studentId: actorUserId,
      }),
    );
  });

  it('rejects appeals when the submission belongs to another course', async () => {
    configureCourseAccess('student', 'student');
    coreMocks.getAssignmentById.mockResolvedValue({
      id: assignmentId,
      tenantId,
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE88',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.createGradeAppeal(actorUserId, tenantId, courseId, assignmentId, submissionId, {
        reason: 'The rubric total appears incorrect.',
      }),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.createGradeAppeal).not.toHaveBeenCalled();
  });

  it('restricts grade history to course staff and the owning student', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await dependencies.listSubmissionGradeHistory(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      submissionId,
    );

    expect(coreMocks.listGradeHistoryForSubmission).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      submissionId,
    });
  });

  it('rejects grade history when the submission belongs to another course', async () => {
    configureCourseAccess('student', 'student');
    coreMocks.getAssignmentById.mockResolvedValue({
      id: assignmentId,
      tenantId,
      courseId: '01J9QW7B6N5W2YH3D3A1V0KE88',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.listSubmissionGradeHistory(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        submissionId,
      ),
    ).rejects.toMatchObject({ code: 'not_found' });

    expect(coreMocks.listGradeHistoryForSubmission).not.toHaveBeenCalled();
  });
});
