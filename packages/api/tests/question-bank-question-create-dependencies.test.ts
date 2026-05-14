import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createQuestionBankQuestion: vi.fn(),
  dbHandle: { db: {} },
  getQuestionBankForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createQuestionBankQuestion: coreMocks.createQuestionBankQuestion,
    getQuestionBankForCourse: coreMocks.getQuestionBankForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const questionBankId = '01J9QW7B6N5W2YH3D3A1V0KE77';
const bankQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE78';
const now = new Date('2026-05-10T00:00:00.000Z');

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

const sampleBank = () => ({
  id: questionBankId,
  tenantId,
  courseId,
  title: 'Argumentation bank',
  description: null,
  status: 'active',
  createdAt: now,
  updatedAt: now,
});

const duplicatePositionError = (): unknown => ({
  code: '23505',
  constraint_name: 'question_bank_question_tenant_bank_position_uq',
});

describe('question bank question creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getQuestionBankForCourse.mockResolvedValue(sampleBank());
    coreMocks.createQuestionBankQuestion.mockResolvedValue({
      id: bankQuestionId,
      tenantId,
      questionBankId,
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

  it('creates question bank questions for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuestionBankQuestion(actorUserId, tenantId, courseId, questionBankId, {
        position: 0,
        questionType: 'multiple_choice',
        prompt: 'Which element connects evidence to a claim?',
        points: 2,
        choices: sampleChoices,
      }),
    ).resolves.toMatchObject({
      id: bankQuestionId,
      questionBankId,
      questionType: 'multiple_choice',
      points: 2,
    });

    expect(coreMocks.createQuestionBankQuestion).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      questionBankId,
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

    await dependencies.createQuestionBankQuestion(actorUserId, tenantId, courseId, questionBankId, {
      position: 1,
      questionType: 'short_answer',
      prompt: 'Describe one reasoning move.',
      points: 4,
      choices: [],
    });

    expect(coreMocks.createQuestionBankQuestion).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      questionBankId,
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
      dependencies.createQuestionBankQuestion(actorUserId, tenantId, courseId, questionBankId, {
        position: 0,
        questionType: 'multiple_choice',
        prompt: 'Which element connects evidence to a claim?',
        points: 2,
        choices: sampleChoices,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message:
        'Only course staff can author question bank questions. Ask an instructor for access.',
    });

    expect(coreMocks.createQuestionBankQuestion).not.toHaveBeenCalled();
  });

  it('returns not found when the question bank does not belong to the course', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.getQuestionBankForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuestionBankQuestion(actorUserId, tenantId, courseId, questionBankId, {
        position: 0,
        questionType: 'multiple_choice',
        prompt: 'Which element connects evidence to a claim?',
        points: 2,
        choices: sampleChoices,
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Question bank was not found in this course. Check the question bank id and retry the request.',
    });

    expect(coreMocks.createQuestionBankQuestion).not.toHaveBeenCalled();
  });

  it('maps duplicate positions to a conflict', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createQuestionBankQuestion.mockRejectedValue(duplicatePositionError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuestionBankQuestion(actorUserId, tenantId, courseId, questionBankId, {
        position: 0,
        questionType: 'multiple_choice',
        prompt: 'Which element connects evidence to a claim?',
        points: 2,
        choices: sampleChoices,
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'Question bank question position is already used. Choose a unique position and retry the request.',
    });
  });
});
