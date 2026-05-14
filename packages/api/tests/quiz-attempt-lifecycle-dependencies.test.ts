import type { CourseRole, TenantRole } from '@openlms/contracts';
import { hashQuizAccessPassword } from '@openlms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  completePassQuizRequirementsForAttempt: vi.fn(),
  dbHandle: { db: { transaction: vi.fn() } },
  createDbHandle: vi.fn(),
  getQuizAccessControlsForCourse: vi.fn(),
  getQuizForCourse: vi.fn(),
  listCourseGroupMembershipsForUser: vi.fn(),
  listQuizAttemptResponsesForAttempt: vi.fn(),
  listQuizAttemptsForQuiz: vi.fn(),
  listQuizOverridesForQuiz: vi.fn(),
  listQuizQuestionsWithAnswerKeysForQuiz: vi.fn(),
  listSectionMembershipsForStudent: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  recordQuizAttempt: vi.fn(),
  submitQuizAttempt: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    completePassQuizRequirementsForAttempt: coreMocks.completePassQuizRequirementsForAttempt,
    createDbHandle: coreMocks.createDbHandle,
    getQuizAccessControlsForCourse: coreMocks.getQuizAccessControlsForCourse,
    getQuizForCourse: coreMocks.getQuizForCourse,
    listCourseGroupMembershipsForUser: coreMocks.listCourseGroupMembershipsForUser,
    listQuizAttemptResponsesForAttempt: coreMocks.listQuizAttemptResponsesForAttempt,
    listQuizAttemptsForQuiz: coreMocks.listQuizAttemptsForQuiz,
    listQuizOverridesForQuiz: coreMocks.listQuizOverridesForQuiz,
    listQuizQuestionsWithAnswerKeysForQuiz: coreMocks.listQuizQuestionsWithAnswerKeysForQuiz,
    listSectionMembershipsForStudent: coreMocks.listSectionMembershipsForStudent,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    recordQuizAttempt: coreMocks.recordQuizAttempt,
    submitQuizAttempt: coreMocks.submitQuizAttempt,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE80';
const otherStudentId = '01J9QW7B6N5W2YH3D3A1V0KE81';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE82';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE83';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const attemptId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const questionId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const responseId = '01J9QW7B6N5W2YH3D3A1V0KE87';
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

const quiz = {
  id: quizId,
  tenantId,
  courseId,
  status: 'published',
  opensAt: null,
  closesAt: null,
  timeLimitMinutes: null,
  maxAttempts: 2,
};

const createAttempt = (
  studentId = actorUserId,
  status: 'in_progress' | 'submitted' = 'in_progress',
  attemptNumber = 1,
) => ({
  id: attemptId,
  tenantId,
  quizId,
  studentId,
  attemptNumber,
  status,
  startedAt: now,
  submittedAt: status === 'submitted' ? now : null,
  score: null,
  createdAt: now,
  updatedAt: now,
});

describe('quiz attempt lifecycle API dependency authorization', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.dbHandle.db.transaction.mockImplementation(
      async (callback: (db: typeof coreMocks.dbHandle.db) => Promise<unknown>) =>
        callback(coreMocks.dbHandle.db),
    );
    coreMocks.getQuizAccessControlsForCourse.mockResolvedValue({
      accessPasswordHash: null,
      allowedIpRanges: [],
    });
    coreMocks.getQuizForCourse.mockResolvedValue(quiz);
    coreMocks.listCourseGroupMembershipsForUser.mockResolvedValue([]);
    coreMocks.listQuizAttemptResponsesForAttempt.mockResolvedValue([]);
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([]);
    coreMocks.listQuizOverridesForQuiz.mockResolvedValue([]);
    coreMocks.listQuizQuestionsWithAnswerKeysForQuiz.mockResolvedValue([]);
    coreMocks.listSectionMembershipsForStudent.mockResolvedValue([]);
    coreMocks.completePassQuizRequirementsForAttempt.mockResolvedValue([]);
    coreMocks.recordQuizAttempt.mockResolvedValue(createAttempt(actorUserId, 'in_progress', 1));
    coreMocks.submitQuizAttempt.mockResolvedValue(createAttempt(actorUserId, 'submitted', 1));
    configureCourseAccess('student', 'student');
  });

  it('starts the next learner attempt when the quiz is visible and attempts remain', async () => {
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([
      createAttempt(actorUserId, 'submitted', 1),
    ]);
    coreMocks.recordQuizAttempt.mockResolvedValue(createAttempt(actorUserId, 'in_progress', 2));
    const dependencies = createDependencies();

    await expect(
      dependencies.startQuizAttempt(actorUserId, tenantId, courseId, quizId),
    ).resolves.toEqual(createAttempt(actorUserId, 'in_progress', 2));

    expect(coreMocks.listQuizAttemptsForQuiz).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      quizId,
      studentId: actorUserId,
    });
    expect(coreMocks.recordQuizAttempt).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      quizId,
      studentId: actorUserId,
      attemptNumber: 2,
    });
  });

  it('requires the quiz access password before starting a protected attempt', async () => {
    coreMocks.getQuizAccessControlsForCourse.mockResolvedValue({
      accessPasswordHash: hashQuizAccessPassword('exam-room'),
      allowedIpRanges: [],
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.startQuizAttempt(actorUserId, tenantId, courseId, quizId, {
        accessPassword: 'wrong-room',
        clientIp: null,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'Quiz access password is required or incorrect. Enter the quiz access password and retry.',
    });

    expect(coreMocks.listQuizAttemptsForQuiz).not.toHaveBeenCalled();
    expect(coreMocks.recordQuizAttempt).not.toHaveBeenCalled();
  });

  it('allows protected quiz attempts with the correct access password and approved IP', async () => {
    coreMocks.getQuizAccessControlsForCourse.mockResolvedValue({
      accessPasswordHash: hashQuizAccessPassword('exam-room'),
      allowedIpRanges: ['203.0.113.0/24'],
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.startQuizAttempt(actorUserId, tenantId, courseId, quizId, {
        accessPassword: 'exam-room',
        clientIp: '203.0.113.44',
      }),
    ).resolves.toEqual(createAttempt(actorUserId, 'in_progress', 1));

    expect(coreMocks.recordQuizAttempt).toHaveBeenCalled();
  });

  it('rejects quiz attempts from outside approved IP ranges', async () => {
    coreMocks.getQuizAccessControlsForCourse.mockResolvedValue({
      accessPasswordHash: null,
      allowedIpRanges: ['203.0.113.0/24'],
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.startQuizAttempt(actorUserId, tenantId, courseId, quizId, {
        accessPassword: null,
        clientIp: '198.51.100.44',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'Quiz attempt is restricted to approved networks. Connect from an approved network and retry.',
    });

    expect(coreMocks.listQuizAttemptsForQuiz).not.toHaveBeenCalled();
    expect(coreMocks.recordQuizAttempt).not.toHaveBeenCalled();
  });

  it('prevents course staff from starting learner quiz attempts', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.startQuizAttempt(actorUserId, tenantId, courseId, quizId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only learners can start quiz attempts. Use preview tools instead.',
    });

    expect(coreMocks.recordQuizAttempt).not.toHaveBeenCalled();
  });

  it('rejects starting attempts after the quiz attempt limit is reached', async () => {
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([
      createAttempt(actorUserId, 'submitted', 1),
      createAttempt(actorUserId, 'submitted', 2),
    ]);
    const dependencies = createDependencies();

    await expect(
      dependencies.startQuizAttempt(actorUserId, tenantId, courseId, quizId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Quiz attempt limit reached. Review your submitted attempts instead.',
    });

    expect(coreMocks.recordQuizAttempt).not.toHaveBeenCalled();
  });

  it('rejects starting attempts before the quiz opens', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T00:00:00.000Z'));
    coreMocks.getQuizForCourse.mockResolvedValue({
      ...quiz,
      opensAt: new Date('2026-05-10T00:05:00.000Z'),
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.startQuizAttempt(actorUserId, tenantId, courseId, quizId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Quiz is not open yet. Check the opening time and retry later.',
    });

    expect(coreMocks.recordQuizAttempt).not.toHaveBeenCalled();
  });

  it('rejects starting attempts after the quiz closes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T00:10:00.000Z'));
    coreMocks.getQuizForCourse.mockResolvedValue({
      ...quiz,
      closesAt: new Date('2026-05-10T00:05:00.000Z'),
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.startQuizAttempt(actorUserId, tenantId, courseId, quizId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Quiz availability window has closed. Ask an instructor for next steps.',
    });

    expect(coreMocks.recordQuizAttempt).not.toHaveBeenCalled();
  });

  it('submits the owning in-progress quiz attempt', async () => {
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([createAttempt()]);
    const dependencies = createDependencies();

    await expect(
      dependencies.submitQuizAttempt(actorUserId, tenantId, courseId, quizId, attemptId),
    ).resolves.toEqual(createAttempt(actorUserId, 'submitted', 1));

    expect(coreMocks.submitQuizAttempt).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      attemptId,
      score: null,
      status: 'submitted',
    });
    expect(coreMocks.completePassQuizRequirementsForAttempt).not.toHaveBeenCalled();
  });

  it('auto-grades a submitted attempt when every quiz question has an answer key', async () => {
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([createAttempt()]);
    coreMocks.listQuizQuestionsWithAnswerKeysForQuiz.mockResolvedValue([
      {
        id: questionId,
        tenantId,
        quizId,
        position: 0,
        questionType: 'multiple_choice',
        prompt: 'Which statement explains the evidence?',
        points: 2,
        choices: [
          { id: 'a', text: 'It repeats the quote.' },
          { id: 'b', text: 'It explains why the quote matters.' },
        ],
        answerKey: { kind: 'choice', correctChoiceIds: ['b'] },
        createdAt: now,
        updatedAt: now,
      },
    ]);
    coreMocks.listQuizAttemptResponsesForAttempt.mockResolvedValue([
      {
        id: responseId,
        tenantId,
        quizId,
        attemptId,
        questionId,
        answer: { kind: 'choice', selectedChoiceIds: ['b'] },
        createdAt: now,
        updatedAt: now,
      },
    ]);
    coreMocks.submitQuizAttempt.mockResolvedValue({
      ...createAttempt(actorUserId, 'submitted', 1),
      score: 2,
      status: 'graded',
      submittedAt: now,
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.submitQuizAttempt(actorUserId, tenantId, courseId, quizId, attemptId),
    ).resolves.toMatchObject({ status: 'graded', score: 2 });

    expect(coreMocks.submitQuizAttempt).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      attemptId,
      score: 2,
      status: 'graded',
    });
    expect(coreMocks.completePassQuizRequirementsForAttempt).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        quizId,
        studentId: actorUserId,
        score: 2,
        maxScore: 2,
        completedAt: expect.any(Date),
      },
      expect.any(Date),
    );
  });

  it('prevents course staff from submitting their own learner attempts', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([createAttempt(actorUserId)]);
    const dependencies = createDependencies();

    await expect(
      dependencies.submitQuizAttempt(actorUserId, tenantId, courseId, quizId, attemptId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'Only learners can submit quiz attempts through the learner workflow. Use grading tools instead.',
    });

    expect(coreMocks.submitQuizAttempt).not.toHaveBeenCalled();
  });

  it('prevents course staff from submitting learner quiz attempts', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([createAttempt(otherStudentId)]);
    const dependencies = createDependencies();

    await expect(
      dependencies.submitQuizAttempt(actorUserId, tenantId, courseId, quizId, attemptId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'Only learners can submit quiz attempts through the learner workflow. Use grading tools instead.',
    });

    expect(coreMocks.submitQuizAttempt).not.toHaveBeenCalled();
  });

  it('rejects submitting attempts that are no longer in progress', async () => {
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([
      createAttempt(actorUserId, 'submitted', 1),
    ]);
    const dependencies = createDependencies();

    await expect(
      dependencies.submitQuizAttempt(actorUserId, tenantId, courseId, quizId, attemptId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only in-progress quiz attempts can be submitted. Start a new attempt if allowed.',
    });

    expect(coreMocks.submitQuizAttempt).not.toHaveBeenCalled();
  });

  it('rejects submitting attempts after the quiz closes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T00:10:00.000Z'));
    coreMocks.getQuizForCourse.mockResolvedValue({
      ...quiz,
      closesAt: new Date('2026-05-10T00:05:00.000Z'),
    });
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([createAttempt()]);
    const dependencies = createDependencies();

    await expect(
      dependencies.submitQuizAttempt(actorUserId, tenantId, courseId, quizId, attemptId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Quiz availability window has closed. Ask an instructor for next steps.',
    });

    expect(coreMocks.submitQuizAttempt).not.toHaveBeenCalled();
  });

  it('rejects submitting attempts after the time limit expires', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T00:31:00.000Z'));
    coreMocks.getQuizForCourse.mockResolvedValue({
      ...quiz,
      timeLimitMinutes: 30,
    });
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([
      createAttempt(actorUserId, 'in_progress', 1),
    ]);
    const dependencies = createDependencies();

    await expect(
      dependencies.submitQuizAttempt(actorUserId, tenantId, courseId, quizId, attemptId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Quiz time limit has expired. Ask an instructor for next steps.',
    });

    expect(coreMocks.submitQuizAttempt).not.toHaveBeenCalled();
  });

  it('translates stale submit races to a controlled API error', async () => {
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([createAttempt()]);
    coreMocks.submitQuizAttempt.mockRejectedValue(
      new Error(
        'Quiz attempt could not be submitted because it was not found or is no longer in progress.',
      ),
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.submitQuizAttempt(actorUserId, tenantId, courseId, quizId, attemptId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only in-progress quiz attempts can be submitted. Start a new attempt if allowed.',
    });
  });

  it('translates duplicate attempt start races to a controlled API error', async () => {
    const duplicateAttemptError = Object.assign(new Error('duplicate key value'), {
      code: '23505',
      constraint_name: 'quiz_attempt_tenant_quiz_student_attempt_uq',
    });
    coreMocks.recordQuizAttempt.mockRejectedValue(duplicateAttemptError);
    const dependencies = createDependencies();

    await expect(
      dependencies.startQuizAttempt(actorUserId, tenantId, courseId, quizId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'A quiz attempt was already started. Refresh attempts and continue the in-progress attempt.',
    });
  });
});
