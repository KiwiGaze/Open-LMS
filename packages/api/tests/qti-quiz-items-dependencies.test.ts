import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createQuizQuestion: vi.fn(),
  dbHandle: { db: { transaction: vi.fn() } },
  exportQuizQuestionToQtiItem: vi.fn(),
  getQuizForCourse: vi.fn(),
  listQuizQuestionsForQuiz: vi.fn(),
  listQuizQuestionsWithAnswerKeysForQuiz: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  parseQtiAssessmentItem: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createQuizQuestion: coreMocks.createQuizQuestion,
    exportQuizQuestionToQtiItem: coreMocks.exportQuizQuestionToQtiItem,
    getQuizForCourse: coreMocks.getQuizForCourse,
    listQuizQuestionsForQuiz: coreMocks.listQuizQuestionsForQuiz,
    listQuizQuestionsWithAnswerKeysForQuiz: coreMocks.listQuizQuestionsWithAnswerKeysForQuiz,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    parseQtiAssessmentItem: coreMocks.parseQtiAssessmentItem,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const quizQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE88';
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

const sampleQuiz = () => ({
  id: quizId,
  tenantId,
  courseId,
  moduleId: null,
  unitId: null,
  position: null,
  title: 'Argumentation diagnostic',
  description: null,
  status: 'draft',
  opensAt: null,
  closesAt: null,
  timeLimitMinutes: null,
  shuffleQuestions: false,
  maxAttempts: 1,
  createdAt: now,
  updatedAt: now,
});

const sampleQuestion = (position = 0) => ({
  id: quizQuestionId,
  tenantId,
  quizId,
  position,
  questionType: 'multiple_choice' as const,
  prompt: 'Which element connects evidence to a claim?',
  points: 2,
  choices: [{ id: 'choice-a', text: 'Reasoning' }],
  answerKey: { kind: 'choice' as const, correctChoiceIds: ['choice-a'] },
  createdAt: now,
  updatedAt: now,
});

describe('QTI quiz item API dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.dbHandle.db.transaction.mockImplementation(async (callback) =>
      callback(coreMocks.dbHandle.db),
    );
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getQuizForCourse.mockResolvedValue(sampleQuiz());
    coreMocks.listQuizQuestionsWithAnswerKeysForQuiz.mockResolvedValue([sampleQuestion()]);
    coreMocks.listQuizQuestionsForQuiz.mockResolvedValue([
      { ...sampleQuestion(4), answerKey: undefined },
    ]);
    coreMocks.exportQuizQuestionToQtiItem.mockReturnValue({
      identifier: quizQuestionId,
      title: 'Which element connects evidence to a claim?',
      xml: '<assessmentItem identifier="item-1"></assessmentItem>',
    });
    coreMocks.parseQtiAssessmentItem.mockReturnValue({
      questionType: 'multiple_choice',
      prompt: 'Which element connects evidence to a claim?',
      points: 2,
      choices: [{ id: 'choice-a', text: 'Reasoning' }],
      answerKey: { kind: 'choice', correctChoiceIds: ['choice-a'] },
    });
    coreMocks.createQuizQuestion.mockResolvedValue({ ...sampleQuestion(5), answerKey: undefined });
    configureCourseAccess('student', 'student');
  });

  it('exports QTI items for course staff with answer keys available to the mapper', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const exportBundle = await dependencies.exportQuizQtiItems(
      actorUserId,
      tenantId,
      courseId,
      quizId,
    );

    expect(coreMocks.listQuizQuestionsWithAnswerKeysForQuiz).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      {
        tenantId,
        quizId,
      },
    );
    expect(exportBundle.items).toEqual([
      {
        identifier: quizQuestionId,
        title: 'Which element connects evidence to a claim?',
        xml: '<assessmentItem identifier="item-1"></assessmentItem>',
      },
    ]);
  });

  it('rejects students exporting QTI items because answer keys are included', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.exportQuizQtiItems(actorUserId, tenantId, courseId, quizId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can export QTI quiz items. Ask an instructor for access.',
    });

    expect(coreMocks.listQuizQuestionsWithAnswerKeysForQuiz).not.toHaveBeenCalled();
  });

  it('imports QTI items after the current last quiz question position', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const result = await dependencies.importQuizQtiItems(actorUserId, tenantId, courseId, quizId, {
      format: 'qti_2_1',
      items: [{ xml: '<assessmentItem identifier="item-1"></assessmentItem>' }],
    });

    expect(coreMocks.dbHandle.db.transaction).toHaveBeenCalledOnce();
    expect(coreMocks.createQuizQuestion).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      quizId,
      position: 5,
      questionType: 'multiple_choice',
      prompt: 'Which element connects evidence to a claim?',
      points: 2,
      choices: [{ id: 'choice-a', text: 'Reasoning' }],
      answerKey: { kind: 'choice', correctChoiceIds: ['choice-a'] },
    });
    expect(result.importedCount).toBe(1);
  });
});
