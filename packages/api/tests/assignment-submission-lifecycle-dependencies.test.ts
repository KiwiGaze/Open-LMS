import type { CourseRole, TenantRole } from '@openlms/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  completeSubmitAssignmentRequirementsForSubmission: vi.fn(),
  createSubmissionAttachment: vi.fn(),
  dbHandle: { db: { transaction: vi.fn() } },
  createDbHandle: vi.fn(),
  getAssignmentById: vi.fn(),
  getFileResourceById: vi.fn(),
  getSubmissionById: vi.fn(),
  listCourseModules: vi.fn(),
  listCourseGroupMembers: vi.fn(),
  listCourseGroupsForCourse: vi.fn(),
  listLearningObjectiveMasteryForCourse: vi.fn(),
  listReleaseOverridesForStudent: vi.fn(),
  listReleasePoliciesForCourse: vi.fn(),
  listReleaseRulesForCourse: vi.fn(),
  listSubmissionAttachmentsForSubmission: vi.fn(),
  listSubmissionsForAssignment: vi.fn(),
  listSubmissionsForStudentAssignment: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  saveStudentDraft: vi.fn(),
  saveSubmission: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    completeSubmitAssignmentRequirementsForSubmission:
      coreMocks.completeSubmitAssignmentRequirementsForSubmission,
    createSubmissionAttachment: coreMocks.createSubmissionAttachment,
    createDbHandle: coreMocks.createDbHandle,
    getAssignmentById: coreMocks.getAssignmentById,
    getFileResourceById: coreMocks.getFileResourceById,
    getSubmissionById: coreMocks.getSubmissionById,
    listCourseModules: coreMocks.listCourseModules,
    listCourseGroupMembers: coreMocks.listCourseGroupMembers,
    listCourseGroupsForCourse: coreMocks.listCourseGroupsForCourse,
    listLearningObjectiveMasteryForCourse: coreMocks.listLearningObjectiveMasteryForCourse,
    listReleaseOverridesForStudent: coreMocks.listReleaseOverridesForStudent,
    listReleasePoliciesForCourse: coreMocks.listReleasePoliciesForCourse,
    listReleaseRulesForCourse: coreMocks.listReleaseRulesForCourse,
    listSubmissionAttachmentsForSubmission: coreMocks.listSubmissionAttachmentsForSubmission,
    listSubmissionsForAssignment: coreMocks.listSubmissionsForAssignment,
    listSubmissionsForStudentAssignment: coreMocks.listSubmissionsForStudentAssignment,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    saveStudentDraft: coreMocks.saveStudentDraft,
    saveSubmission: coreMocks.saveSubmission,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE80';
const teammateUserId = '01J9QW7B6N5W2YH3D3A1V0KE81';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE82';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE83';
const assignmentId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const draftId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const previousSubmissionId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const fileResourceId = '01J9QW7B6N5W2YH3D3A1V0KE8D';
const attachmentId = '01J9QW7B6N5W2YH3D3A1V0KE8E';
const groupSetId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const groupId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const ruleId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
const now = new Date('2026-05-10T00:00:00.000Z');
const blocks = [{ blockId: 'intro', text: 'Evidence supports the claim.' }];

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

const assignment = {
  id: assignmentId,
  tenantId,
  courseId,
  moduleId: null,
  unitId: null,
  position: null,
  title: 'Evidence essay',
  instructions: 'Write an essay using textual evidence.',
  status: 'published',
  dueAt: new Date('2026-05-11T00:00:00.000Z'),
  allowResubmission: true,
  activeRubricId: null,
  aiSettings: {
    precheckEnabled: true,
    feedbackDraftEnabled: true,
    scoreSuggestionEnabled: false,
  },
  groupSubmissionEnabled: false,
  groupSetId: null,
  allowedFileExtensions: [],
  maxFileSizeBytes: null,
  createdAt: now,
  updatedAt: now,
};

const createDraft = () => ({
  id: draftId,
  tenantId,
  assignmentId,
  studentId: actorUserId,
  blocks,
  createdAt: now,
  updatedAt: now,
});

const previousSubmission = {
  id: previousSubmissionId,
  tenantId,
  assignmentId,
  studentId: actorUserId,
  sourceDraftId: draftId,
  version: 1,
  status: 'submitted',
  contentSnapshot: blocks,
  submittedAt: now,
  createdAt: now,
  groupId: null,
};

const groupSubmission = {
  ...previousSubmission,
  groupId,
};

const fileResource = {
  id: fileResourceId,
  tenantId,
  courseId: null,
  ownerId: actorUserId,
  storageProvider: 'local_fs',
  storageKey: `${tenantId}/${fileResourceId}`,
  filename: 'evidence.pdf',
  mediaType: 'application/pdf',
  byteSize: 512_000,
  checksumSha256: 'a'.repeat(64),
  visibility: 'private',
  altText: null,
  transcriptText: null,
  license: null,
  copyrightHolder: null,
  createdAt: now,
};

const submissionAttachment = {
  id: attachmentId,
  tenantId,
  submissionId: previousSubmissionId,
  fileResourceId,
  displayName: 'evidence.pdf',
  position: 0,
  createdAt: now,
};

const groupAssignment = {
  ...assignment,
  groupSubmissionEnabled: true,
  groupSetId,
};

const courseGroup = {
  id: groupId,
  tenantId,
  courseId,
  groupSetId,
  name: 'Project Team',
  description: null,
  status: 'active',
  position: 0,
  createdAt: now,
  updatedAt: now,
};

describe('assignment submission lifecycle API dependency authorization', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.dbHandle.db.transaction.mockImplementation(
      async (callback: (db: typeof coreMocks.dbHandle.db) => Promise<unknown>) =>
        callback(coreMocks.dbHandle.db),
    );
    coreMocks.getAssignmentById.mockResolvedValue(assignment);
    coreMocks.getFileResourceById.mockResolvedValue(fileResource);
    coreMocks.getSubmissionById.mockResolvedValue(previousSubmission);
    coreMocks.listCourseModules.mockResolvedValue([
      {
        id: moduleId,
        tenantId,
        courseId,
        title: 'Module',
        summary: null,
        visibility: 'published',
        accessPolicy: 'course_member',
        version: 1,
        position: 0,
        learningObjectiveIds: [],
        createdAt: now,
        updatedAt: now,
      },
    ]);
    coreMocks.listCourseGroupsForCourse.mockResolvedValue([courseGroup]);
    coreMocks.listCourseGroupMembers.mockResolvedValue([
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE8B',
        tenantId,
        groupId,
        userId: actorUserId,
        role: 'member',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    coreMocks.listLearningObjectiveMasteryForCourse.mockResolvedValue([]);
    coreMocks.listReleaseOverridesForStudent.mockResolvedValue([]);
    coreMocks.listReleasePoliciesForCourse.mockResolvedValue([]);
    coreMocks.listReleaseRulesForCourse.mockResolvedValue([]);
    coreMocks.listSubmissionAttachmentsForSubmission.mockResolvedValue([]);
    coreMocks.listSubmissionsForAssignment.mockResolvedValue([previousSubmission]);
    coreMocks.listSubmissionsForStudentAssignment.mockResolvedValue([]);
    coreMocks.saveStudentDraft.mockResolvedValue(createDraft());
    coreMocks.saveSubmission.mockImplementation(async (_db, submission) => submission);
    coreMocks.createSubmissionAttachment.mockResolvedValue(submissionAttachment);
    coreMocks.completeSubmitAssignmentRequirementsForSubmission.mockResolvedValue([]);
    configureCourseAccess('student', 'student');
  });

  it('saves learner drafts for published assignments', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.saveAssignmentDraft(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        draftId,
        blocks,
      ),
    ).resolves.toEqual(createDraft());

    expect(coreMocks.saveStudentDraft).toHaveBeenCalledWith(coreMocks.dbHandle.db, createDraft());
  });

  it('prevents course staff from saving learner drafts', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.saveAssignmentDraft(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        draftId,
        blocks,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only learners can save assignment drafts through the learner workflow.',
    });

    expect(coreMocks.saveStudentDraft).not.toHaveBeenCalled();
  });

  it('prevents course staff from submitting learner drafts', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.submitAssignmentDraft(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        draftId,
        blocks,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only learners can save assignment drafts through the learner workflow.',
    });

    expect(coreMocks.saveStudentDraft).not.toHaveBeenCalled();
    expect(coreMocks.saveSubmission).not.toHaveBeenCalled();
  });

  it('rejects saving drafts for unpublished assignments', async () => {
    coreMocks.getAssignmentById.mockResolvedValue({ ...assignment, status: 'archived' });
    const dependencies = createDependencies();

    await expect(
      dependencies.saveAssignmentDraft(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        draftId,
        blocks,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Assignment was not found in this course. Check the assignment id and retry the request.',
    });

    expect(coreMocks.saveStudentDraft).not.toHaveBeenCalled();
  });

  it('rejects learner drafts for locked module assignments', async () => {
    coreMocks.getAssignmentById.mockResolvedValue({ ...assignment, moduleId });
    coreMocks.listReleaseRulesForCourse.mockResolvedValue([
      {
        id: ruleId,
        tenantId,
        courseId,
        moduleId,
        targetType: 'module',
        targetId: null,
        ruleType: 'date_after',
        config: { releaseAt: new Date('2099-01-01T00:00:00.000Z') },
        position: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const dependencies = createDependencies();

    await expect(
      dependencies.saveAssignmentDraft(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        draftId,
        blocks,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Assignment was not found in this course. Check the assignment id and retry the request.',
    });

    expect(coreMocks.saveStudentDraft).not.toHaveBeenCalled();
  });

  it('maps draft ownership conflicts to a not-found response', async () => {
    coreMocks.saveStudentDraft.mockRejectedValue(
      new Error(
        'Draft could not be saved because it belongs to a different assignment or student.',
      ),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.saveAssignmentDraft(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        draftId,
        blocks,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Assignment draft was not found for this learner and assignment. Check the draft id and retry the request.',
    });
  });

  it('submits learner drafts as the next submission version', async () => {
    coreMocks.listSubmissionsForStudentAssignment.mockResolvedValue([previousSubmission]);
    const dependencies = createDependencies();

    const submission = await dependencies.submitAssignmentDraft(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      draftId,
      blocks,
    );

    expect(submission).toMatchObject({
      tenantId,
      assignmentId,
      studentId: actorUserId,
      sourceDraftId: draftId,
      version: 2,
      status: 'submitted',
      contentSnapshot: blocks,
      submittedAt: now,
      createdAt: now,
    });
    expect(coreMocks.saveStudentDraft).toHaveBeenCalledWith(coreMocks.dbHandle.db, createDraft());
    expect(coreMocks.saveSubmission).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        tenantId,
        assignmentId,
        studentId: actorUserId,
        sourceDraftId: draftId,
        version: 2,
      }),
    );
    expect(coreMocks.completeSubmitAssignmentRequirementsForSubmission).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        assignmentId,
        studentId: actorUserId,
        completedAt: now,
      },
      now,
    );
  });

  it('submits group assignment drafts as the next shared group version', async () => {
    coreMocks.getAssignmentById.mockResolvedValue(groupAssignment);
    coreMocks.listSubmissionsForAssignment.mockResolvedValue([groupSubmission]);
    const dependencies = createDependencies();

    const submission = await dependencies.submitAssignmentDraft(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      draftId,
      blocks,
    );

    expect(coreMocks.listCourseGroupsForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      statuses: ['active'],
      memberUserId: actorUserId,
    });
    expect(submission).toMatchObject({
      tenantId,
      assignmentId,
      studentId: actorUserId,
      groupId,
      sourceDraftId: draftId,
      version: 2,
      status: 'submitted',
      contentSnapshot: blocks,
      submittedAt: now,
      createdAt: now,
    });
    expect(coreMocks.listSubmissionsForStudentAssignment).not.toHaveBeenCalled();
    expect(coreMocks.saveSubmission).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      expect.objectContaining({
        tenantId,
        assignmentId,
        studentId: actorUserId,
        groupId,
        sourceDraftId: draftId,
        version: 2,
      }),
    );
  });

  it('completes submit-assignment requirements for all group submission members', async () => {
    coreMocks.getAssignmentById.mockResolvedValue(groupAssignment);
    coreMocks.listSubmissionsForAssignment.mockResolvedValue([groupSubmission]);
    coreMocks.listCourseGroupMembers.mockResolvedValue([
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE8B',
        tenantId,
        groupId,
        userId: actorUserId,
        role: 'member',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE8C',
        tenantId,
        groupId,
        userId: teammateUserId,
        role: 'member',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const dependencies = createDependencies();

    await dependencies.submitAssignmentDraft(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      draftId,
      blocks,
    );

    expect(coreMocks.listCourseGroupMembers).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      groupId,
    });
    expect(coreMocks.completeSubmitAssignmentRequirementsForSubmission).toHaveBeenCalledTimes(2);
    expect(coreMocks.completeSubmitAssignmentRequirementsForSubmission).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        assignmentId,
        studentId: actorUserId,
        completedAt: now,
      },
      now,
    );
    expect(coreMocks.completeSubmitAssignmentRequirementsForSubmission).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        assignmentId,
        studentId: teammateUserId,
        completedAt: now,
      },
      now,
    );
  });

  it('rejects group assignment submissions when the learner has no group in the assignment set', async () => {
    coreMocks.getAssignmentById.mockResolvedValue(groupAssignment);
    coreMocks.listCourseGroupsForCourse.mockResolvedValue([]);
    const dependencies = createDependencies();

    await expect(
      dependencies.submitAssignmentDraft(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        draftId,
        blocks,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Join exactly one active assignment group before submitting this group assignment.',
    });

    expect(coreMocks.saveSubmission).not.toHaveBeenCalled();
  });

  it('redacts student ids from staff submission lists for anonymous grading', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getAssignmentById.mockResolvedValue({
      ...assignment,
      anonymousGradingEnabled: true,
    });
    const dependencies = createDependencies();

    const submissions = await dependencies.listAssignmentSubmissions(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
    );

    expect(submissions).toEqual([
      expect.objectContaining({
        id: previousSubmissionId,
        studentId: null,
        anonymousLabel: 'Student A',
      }),
    ]);
  });

  it('lists group submissions for learners in the assignment group', async () => {
    coreMocks.getAssignmentById.mockResolvedValue(groupAssignment);
    coreMocks.listSubmissionsForAssignment.mockResolvedValue([
      groupSubmission,
      {
        ...previousSubmission,
        id: '01J9QW7B6N5W2YH3D3A1V0KE89',
        groupId: '01J9QW7B6N5W2YH3D3A1V0KE8A',
      },
    ]);
    const dependencies = createDependencies();

    const submissions = await dependencies.listAssignmentSubmissions(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
    );

    expect(submissions).toEqual([expect.objectContaining({ id: previousSubmissionId, groupId })]);
    expect(coreMocks.listSubmissionsForStudentAssignment).not.toHaveBeenCalled();
  });

  it('attaches an owned uploaded file when it satisfies assignment constraints', async () => {
    coreMocks.getAssignmentById.mockResolvedValue({
      ...assignment,
      allowedFileExtensions: ['pdf'],
      maxFileSizeBytes: 1_000_000,
    });
    const dependencies = createDependencies();

    const attachment = await dependencies.createSubmissionAttachment(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      previousSubmissionId,
      { fileResourceId, displayName: null },
    );

    expect(attachment).toEqual(submissionAttachment);
    expect(coreMocks.createSubmissionAttachment).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      submissionId: previousSubmissionId,
      fileResourceId,
      displayName: 'evidence.pdf',
      position: 0,
    });
  });

  it('attaches files to group submissions for members of the submission group', async () => {
    coreMocks.getAssignmentById.mockResolvedValue(groupAssignment);
    coreMocks.getSubmissionById.mockResolvedValue({
      ...groupSubmission,
      studentId: teammateUserId,
    });
    const dependencies = createDependencies();

    const attachment = await dependencies.createSubmissionAttachment(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      previousSubmissionId,
      { fileResourceId, displayName: 'team-evidence.pdf' },
    );

    expect(attachment).toEqual(submissionAttachment);
    expect(coreMocks.listCourseGroupsForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      statuses: ['active'],
      memberUserId: actorUserId,
    });
    expect(coreMocks.createSubmissionAttachment).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      submissionId: previousSubmissionId,
      fileResourceId,
      displayName: 'team-evidence.pdf',
      position: 0,
    });
  });

  it('rejects submission attachments with disallowed file extensions', async () => {
    coreMocks.getAssignmentById.mockResolvedValue({
      ...assignment,
      allowedFileExtensions: ['pdf'],
      maxFileSizeBytes: null,
    });
    coreMocks.getFileResourceById.mockResolvedValue({ ...fileResource, filename: 'evidence.zip' });
    const dependencies = createDependencies();

    await expect(
      dependencies.createSubmissionAttachment(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        previousSubmissionId,
        { fileResourceId, displayName: null },
      ),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'File type is not allowed for this assignment. Upload a file with an allowed extension and retry.',
    });

    expect(coreMocks.createSubmissionAttachment).not.toHaveBeenCalled();
  });

  it('rejects submission attachments that exceed the assignment max size', async () => {
    coreMocks.getAssignmentById.mockResolvedValue({
      ...assignment,
      allowedFileExtensions: [],
      maxFileSizeBytes: 100,
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.createSubmissionAttachment(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        previousSubmissionId,
        { fileResourceId, displayName: null },
      ),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'File is larger than this assignment allows. Upload a smaller file and retry.',
    });

    expect(coreMocks.createSubmissionAttachment).not.toHaveBeenCalled();
  });

  it('marks learner submissions late after the assignment due date', async () => {
    vi.setSystemTime(new Date('2026-05-12T00:00:00.000Z'));
    const dependencies = createDependencies();

    const submission = await dependencies.submitAssignmentDraft(
      actorUserId,
      tenantId,
      courseId,
      assignmentId,
      draftId,
      blocks,
    );

    expect(submission.status).toBe('late');
    expect(submission.submittedAt).toEqual(new Date('2026-05-12T00:00:00.000Z'));
  });

  it('rejects learner resubmissions when the assignment disallows them', async () => {
    coreMocks.getAssignmentById.mockResolvedValue({ ...assignment, allowResubmission: false });
    coreMocks.listSubmissionsForStudentAssignment.mockResolvedValue([previousSubmission]);
    const dependencies = createDependencies();

    await expect(
      dependencies.submitAssignmentDraft(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        draftId,
        blocks,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'This assignment does not allow resubmission. Review your existing submission or ask an instructor for next steps.',
    });

    expect(coreMocks.saveSubmission).not.toHaveBeenCalled();
  });

  it('maps duplicate submission version races to a controlled API error', async () => {
    coreMocks.saveSubmission.mockRejectedValue(
      Object.assign(new Error('duplicate key value'), {
        code: '23505',
        constraint_name: 'submission_tenant_assignment_student_version_uq',
      }),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.submitAssignmentDraft(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        draftId,
        blocks,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'A submission was already created. Refresh submissions and retry if another attempt is allowed.',
    });
  });

  it('rejects learner submissions for unpublished assignments', async () => {
    coreMocks.getAssignmentById.mockResolvedValue({ ...assignment, status: 'draft' });
    const dependencies = createDependencies();

    await expect(
      dependencies.submitAssignmentDraft(
        actorUserId,
        tenantId,
        courseId,
        assignmentId,
        draftId,
        blocks,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Assignment was not found in this course. Check the assignment id and retry the request.',
    });

    expect(coreMocks.saveSubmission).not.toHaveBeenCalled();
  });
});
