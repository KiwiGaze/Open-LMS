import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createQuizQuestion: vi.fn(),
  dbHandle: { db: {} },
  getQuizForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createQuizQuestion: coreMocks.createQuizQuestion,
    getQuizForCourse: coreMocks.getQuizForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KE87';
const quizQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE88';
const now = new Date('2026-05-12T00:00:00.000Z');

const sampleChoices = [
  { id: 'a', text: 'Reasoning' },
  { id: 'b', text: 'Evidence' },
  { id: 'c', text: 'Claim' },
];

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

const duplicatePositionError = (): unknown => ({
  code: '23505',
  constraint_name: 'quiz_question_tenant_quiz_position_uq',
});

describe('quiz question creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getQuizForCourse.mockResolvedValue(sampleQuiz());
    coreMocks.createQuizQuestion.mockResolvedValue({
      id: quizQuestionId,
      tenantId,
      quizId,
      position: 0,
      questionType: 'multiple_choice',
      prompt: 'Which element connects evidence to a claim?',
      points: 2,
      choices: sampleChoices,
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates quiz questions for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuizQuestion(actorUserId, tenantId, courseId, quizId, {
        position: 0,
        questionType: 'multiple_choice',
        prompt: 'Which element connects evidence to a claim?',
        points: 2,
        choices: sampleChoices,
      }),
    ).resolves.toMatchObject({
      id: quizQuestionId,
      quizId,
      questionType: 'multiple_choice',
      points: 2,
    });

    expect(coreMocks.createQuizQuestion).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      quizId,
      position: 0,
      questionType: 'multiple_choice',
      prompt: 'Which element connects evidence to a claim?',
      points: 2,
      choices: sampleChoices,
    });
  });

  it('allows tenant staff without course membership to create questions', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createQuizQuestion(actorUserId, tenantId, courseId, quizId, {
      position: 1,
      questionType: 'short_answer',
      prompt: 'Describe one reasoning move.',
      points: 4,
      choices: [],
    });

    expect(coreMocks.createQuizQuestion).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      quizId,
      position: 1,
      questionType: 'short_answer',
      prompt: 'Describe one reasoning move.',
      points: 4,
      choices: [],
    });
  });

  it('rejects students creating questions', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuizQuestion(actorUserId, tenantId, courseId, quizId, {
        position: 0,
        questionType: 'multiple_choice',
        prompt: 'Which element connects evidence to a claim?',
        points: 2,
        choices: sampleChoices,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can author quiz questions. Ask an instructor for access.',
    });

    expect(coreMocks.createQuizQuestion).not.toHaveBeenCalled();
  });

  it('returns not found when the quiz does not belong to the course', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.getQuizForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuizQuestion(actorUserId, tenantId, courseId, quizId, {
        position: 0,
        questionType: 'multiple_choice',
        prompt: 'Which element connects evidence to a claim?',
        points: 2,
        choices: sampleChoices,
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Quiz was not found in this course. Check the quiz id and retry the request.',
    });

    expect(coreMocks.createQuizQuestion).not.toHaveBeenCalled();
  });

  it('maps duplicate positions to a conflict', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createQuizQuestion.mockRejectedValue(duplicatePositionError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuizQuestion(actorUserId, tenantId, courseId, quizId, {
        position: 0,
        questionType: 'multiple_choice',
        prompt: 'Which element connects evidence to a claim?',
        points: 2,
        choices: sampleChoices,
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'Quiz question position is already used. Choose a unique position and retry the request.',
    });
  });
});
