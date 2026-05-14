import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  completePassQuizRequirementsForAttempt: vi.fn(),
  dbHandle: { db: { transaction: vi.fn() } },
  createDbHandle: vi.fn(),
  getQuizForCourse: vi.fn(),
  listQuizAttemptQuestionGradesForAttempt: vi.fn(),
  listQuizAttemptResponsesForAttempt: vi.fn(),
  listQuizAttemptsForQuiz: vi.fn(),
  listQuizQuestionsForQuiz: vi.fn(),
  listQuizQuestionsWithAnswerKeysForQuiz: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  recordQuizAttemptQuestionGrade: vi.fn(),
  updateQuizAttemptGrade: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    completePassQuizRequirementsForAttempt: coreMocks.completePassQuizRequirementsForAttempt,
    createDbHandle: coreMocks.createDbHandle,
    getQuizForCourse: coreMocks.getQuizForCourse,
    listQuizAttemptQuestionGradesForAttempt: coreMocks.listQuizAttemptQuestionGradesForAttempt,
    listQuizAttemptResponsesForAttempt: coreMocks.listQuizAttemptResponsesForAttempt,
    listQuizAttemptsForQuiz: coreMocks.listQuizAttemptsForQuiz,
    listQuizQuestionsForQuiz: coreMocks.listQuizQuestionsForQuiz,
    listQuizQuestionsWithAnswerKeysForQuiz: coreMocks.listQuizQuestionsWithAnswerKeysForQuiz,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    recordQuizAttemptQuestionGrade: coreMocks.recordQuizAttemptQuestionGrade,
    updateQuizAttemptGrade: coreMocks.updateQuizAttemptGrade,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEA0';
const learnerUserId = '01J9QW7B6N5W2YH3D3A1V0KEA1';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEA2';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KEA3';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KEA4';
const attemptId = '01J9QW7B6N5W2YH3D3A1V0KEA5';
const choiceQuestionId = '01J9QW7B6N5W2YH3D3A1V0KEA6';
const essayQuestionId = '01J9QW7B6N5W2YH3D3A1V0KEA7';
const gradeId = '01J9QW7B6N5W2YH3D3A1V0KEA8';
const responseId = '01J9QW7B6N5W2YH3D3A1V0KEA9';
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

const attempt = {
  id: attemptId,
  tenantId,
  quizId,
  studentId: learnerUserId,
  attemptNumber: 1,
  status: 'submitted',
  startedAt: now,
  submittedAt: now,
  score: null,
  createdAt: now,
  updatedAt: now,
};

const essayQuestion = {
  id: essayQuestionId,
  tenantId,
  quizId,
  position: 1,
  questionType: 'essay',
  prompt: 'Explain the evidence.',
  points: 5,
  choices: [],
  createdAt: now,
  updatedAt: now,
};

const manualGrade = {
  id: gradeId,
  tenantId,
  quizId,
  attemptId,
  questionId: essayQuestionId,
  graderId: actorUserId,
  score: 4,
  feedback: 'Clear explanation.',
  createdAt: now,
  updatedAt: now,
};

describe('quiz manual grading API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.dbHandle.db.transaction.mockImplementation(
      async (callback: (db: typeof coreMocks.dbHandle.db) => Promise<unknown>) =>
        callback(coreMocks.dbHandle.db),
    );
    coreMocks.getQuizForCourse.mockResolvedValue(quiz);
    coreMocks.listQuizAttemptQuestionGradesForAttempt.mockResolvedValue([manualGrade]);
    coreMocks.listQuizAttemptResponsesForAttempt.mockResolvedValue([]);
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([attempt]);
    coreMocks.listQuizQuestionsForQuiz.mockResolvedValue([essayQuestion]);
    coreMocks.listQuizQuestionsWithAnswerKeysForQuiz.mockResolvedValue([
      { ...essayQuestion, answerKey: null },
    ]);
    coreMocks.completePassQuizRequirementsForAttempt.mockResolvedValue([]);
    coreMocks.recordQuizAttemptQuestionGrade.mockResolvedValue(manualGrade);
    coreMocks.updateQuizAttemptGrade.mockResolvedValue({ ...attempt, status: 'graded', score: 4 });
    configureCourseAccess('student', 'instructor');
  });

  it('records a manual question grade for a submitted attempt as course staff', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.recordQuizAttemptQuestionGrade(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
        essayQuestionId,
        { score: 4, feedback: 'Clear explanation.' },
      ),
    ).resolves.toEqual(manualGrade);

    expect(coreMocks.recordQuizAttemptQuestionGrade).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      quizId,
      attemptId,
      questionId: essayQuestionId,
      graderId: actorUserId,
      score: 4,
      feedback: 'Clear explanation.',
    });
  });

  it('rejects manual scores above the question point value', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.recordQuizAttemptQuestionGrade(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
        essayQuestionId,
        { score: 6, feedback: null },
      ),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Score cannot exceed the quiz question points. Enter a score within the question point value.',
    });

    expect(coreMocks.recordQuizAttemptQuestionGrade).not.toHaveBeenCalled();
  });

  it('rejects manual grades for automatically graded questions', async () => {
    coreMocks.listQuizQuestionsWithAnswerKeysForQuiz.mockResolvedValue([
      {
        ...essayQuestion,
        id: choiceQuestionId,
        questionType: 'multiple_choice',
        points: 2,
        choices: [
          { id: 'a', text: 'Unsupported.' },
          { id: 'b', text: 'Supported.' },
        ],
        answerKey: { kind: 'choice', correctChoiceIds: ['b'] },
      },
    ]);
    const dependencies = createDependencies();

    await expect(
      dependencies.recordQuizAttemptQuestionGrade(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
        choiceQuestionId,
        { score: 2, feedback: null },
      ),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'This quiz question is automatically graded. Regrade the attempt instead of recording a manual question score.',
    });

    expect(coreMocks.recordQuizAttemptQuestionGrade).not.toHaveBeenCalled();
  });

  it('regrades an attempt by combining automatic and manual question scores', async () => {
    const choiceQuestion = {
      ...essayQuestion,
      id: choiceQuestionId,
      position: 0,
      questionType: 'multiple_choice',
      points: 2,
      choices: [
        { id: 'a', text: 'Unsupported.' },
        { id: 'b', text: 'Supported.' },
      ],
      answerKey: { kind: 'choice' as const, correctChoiceIds: ['b'] },
    };
    coreMocks.listQuizQuestionsWithAnswerKeysForQuiz.mockResolvedValue([
      choiceQuestion,
      { ...essayQuestion, answerKey: null },
    ]);
    coreMocks.listQuizAttemptResponsesForAttempt.mockResolvedValue([
      {
        id: responseId,
        tenantId,
        quizId,
        attemptId,
        questionId: choiceQuestionId,
        answer: { kind: 'choice', selectedChoiceIds: ['b'] },
        createdAt: now,
        updatedAt: now,
      },
    ]);
    coreMocks.updateQuizAttemptGrade.mockResolvedValue({ ...attempt, status: 'graded', score: 6 });
    const dependencies = createDependencies();

    await expect(
      dependencies.regradeQuizAttempt(actorUserId, tenantId, courseId, quizId, attemptId),
    ).resolves.toMatchObject({ status: 'graded', score: 6 });

    expect(coreMocks.updateQuizAttemptGrade).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      attemptId,
      status: 'graded',
      score: 6,
    });
    expect(coreMocks.completePassQuizRequirementsForAttempt).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        courseId,
        quizId,
        studentId: learnerUserId,
        score: 6,
        maxScore: 7,
        completedAt: expect.any(Date),
      },
      expect.any(Date),
    );
  });

  it('prevents students from recording manual question grades', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.recordQuizAttemptQuestionGrade(
        actorUserId,
        tenantId,
        courseId,
        quizId,
        attemptId,
        essayQuestionId,
        { score: 4, feedback: null },
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can grade quiz attempts. Ask an instructor for access.',
    });

    expect(coreMocks.recordQuizAttemptQuestionGrade).not.toHaveBeenCalled();
  });
});
