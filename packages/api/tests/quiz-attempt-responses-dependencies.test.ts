import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createDbHandle: vi.fn(),
  getQuizForCourse: vi.fn(),
  listCourseGroupMembershipsForUser: vi.fn(),
  listQuizAttemptResponsesForAttempt: vi.fn(),
  listQuizAttemptsForQuiz: vi.fn(),
  listQuizOverridesForQuiz: vi.fn(),
  listQuizQuestionsForQuiz: vi.fn(),
  listSectionMembershipsForStudent: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  recordQuizAttemptResponse: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getQuizForCourse: coreMocks.getQuizForCourse,
    listCourseGroupMembershipsForUser: coreMocks.listCourseGroupMembershipsForUser,
    listQuizAttemptResponsesForAttempt: coreMocks.listQuizAttemptResponsesForAttempt,
    listQuizAttemptsForQuiz: coreMocks.listQuizAttemptsForQuiz,
    listQuizOverridesForQuiz: coreMocks.listQuizOverridesForQuiz,
    listQuizQuestionsForQuiz: coreMocks.listQuizQuestionsForQuiz,
    listSectionMembershipsForStudent: coreMocks.listSectionMembershipsForStudent,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    recordQuizAttemptResponse: coreMocks.recordQuizAttemptResponse,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE90';
const otherStudentId = '01J9QW7B6N5W2YH3D3A1V0KE91';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE92';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE93';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KE94';
const attemptId = '01J9QW7B6N5W2YH3D3A1V0KE95';
const questionId = '01J9QW7B6N5W2YH3D3A1V0KE96';
const responseId = '01J9QW7B6N5W2YH3D3A1V0KE97';
const now = new Date('2026-05-10T00:00:00.000Z');
const answer = { kind: 'choice' as const, selectedChoiceIds: ['b'] };

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

const createAttempt = (studentId = actorUserId, status = 'in_progress') => ({
  id: attemptId,
  tenantId,
  quizId,
  studentId,
  attemptNumber: 1,
  status,
  startedAt: now,
  submittedAt: null,
  score: null,
  createdAt: now,
  updatedAt: now,
});

const response = {
  id: responseId,
  tenantId,
  quizId,
  attemptId,
  questionId,
  answer,
  createdAt: now,
  updatedAt: now,
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

describe('quiz attempt response API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getQuizForCourse.mockResolvedValue(quiz);
    coreMocks.listCourseGroupMembershipsForUser.mockResolvedValue([]);
    coreMocks.listQuizAttemptResponsesForAttempt.mockResolvedValue([response]);
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([createAttempt()]);
    coreMocks.listQuizOverridesForQuiz.mockResolvedValue([]);
    coreMocks.listQuizQuestionsForQuiz.mockResolvedValue([{ id: questionId }]);
    coreMocks.listSectionMembershipsForStudent.mockResolvedValue([]);
    coreMocks.recordQuizAttemptResponse.mockResolvedValue(response);
    configureCourseAccess('student', 'student');
  });

  it('saves responses for the owning in-progress student attempt', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.saveQuizAttemptResponse(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
        questionId,
        answer,
      ),
    ).resolves.toEqual(response);

    expect(coreMocks.listQuizAttemptsForQuiz).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      quizId,
      studentId: actorUserId,
    });
    expect(coreMocks.recordQuizAttemptResponse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      quizId,
      attemptId,
      questionId,
      answer,
    });
  });

  it('prevents course staff from saving learner responses', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([createAttempt(otherStudentId)]);
    const dependencies = createDependencies();

    await expect(
      dependencies.saveQuizAttemptResponse(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
        questionId,
        answer,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'Only the student who owns a quiz attempt can save responses. Ask the learner to update their answer.',
    });

    expect(coreMocks.recordQuizAttemptResponse).not.toHaveBeenCalled();
  });

  it('hides another student attempt responses from students', async () => {
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([]);
    const dependencies = createDependencies();

    await expect(
      dependencies.listQuizAttemptResponses(actorUserId, tenantId, courseId, quizId, attemptId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Quiz attempt was not found. Check the attempt id and retry the request.',
    });

    expect(coreMocks.listQuizAttemptResponsesForAttempt).not.toHaveBeenCalled();
  });

  it('rejects saving responses after an attempt leaves in_progress', async () => {
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([createAttempt(actorUserId, 'submitted')]);
    const dependencies = createDependencies();

    await expect(
      dependencies.saveQuizAttemptResponse(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
        questionId,
        answer,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'Only in-progress quiz attempts can accept responses. Start a new attempt before saving responses.',
    });

    expect(coreMocks.recordQuizAttemptResponse).not.toHaveBeenCalled();
  });

  it('rejects saving responses after the quiz time limit has expired', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T00:31:00.000Z'));
    coreMocks.getQuizForCourse.mockResolvedValue({
      ...quiz,
      timeLimitMinutes: 30,
    });
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([
      createAttempt(actorUserId, 'in_progress'),
    ]);
    const dependencies = createDependencies();

    await expect(
      dependencies.saveQuizAttemptResponse(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
        questionId,
        answer,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Quiz time limit has expired. Ask an instructor for next steps.',
    });

    expect(coreMocks.recordQuizAttemptResponse).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('uses learner quiz override time limits when saving responses', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T00:31:00.000Z'));
    coreMocks.getQuizForCourse.mockResolvedValue({
      ...quiz,
      timeLimitMinutes: 30,
    });
    coreMocks.listQuizOverridesForQuiz.mockResolvedValue([
      {
        id: '01J9QW7B6N5W2YH3D3A1V0KE98',
        tenantId,
        quizId,
        targetType: 'user',
        targetId: actorUserId,
        opensAt: null,
        closesAt: null,
        timeLimitMinutes: 60,
        maxAttempts: null,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const dependencies = createDependencies();

    await expect(
      dependencies.saveQuizAttemptResponse(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
        questionId,
        answer,
      ),
    ).resolves.toEqual(response);

    expect(coreMocks.recordQuizAttemptResponse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      quizId,
      attemptId,
      questionId,
      answer,
    });
    vi.useRealTimers();
  });

  it('rejects saving a response for a question outside the quiz', async () => {
    coreMocks.listQuizQuestionsForQuiz.mockResolvedValue([]);
    const dependencies = createDependencies();

    await expect(
      dependencies.saveQuizAttemptResponse(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
        questionId,
        answer,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Quiz question was not found in this quiz. Check the question id and retry the request.',
    });

    expect(coreMocks.recordQuizAttemptResponse).not.toHaveBeenCalled();
  });

  it('allows course staff to list learner attempt responses', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([createAttempt(otherStudentId)]);
    const dependencies = createDependencies();

    await expect(
      dependencies.listQuizAttemptResponses(actorUserId, tenantId, courseId, quizId, attemptId),
    ).resolves.toEqual([response]);

    expect(coreMocks.listQuizAttemptsForQuiz).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      quizId,
      studentId: undefined,
    });
    expect(coreMocks.listQuizAttemptResponsesForAttempt).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        attemptId,
      },
    );
  });
});
