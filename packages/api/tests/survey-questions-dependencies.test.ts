import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createSurveyQuestion: vi.fn(),
  dbHandle: { db: {} },
  getSurveyForCourse: vi.fn(),
  listSurveyQuestionsForSurvey: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createSurveyQuestion: coreMocks.createSurveyQuestion,
    getSurveyForCourse: coreMocks.getSurveyForCourse,
    listSurveyQuestionsForSurvey: coreMocks.listSurveyQuestionsForSurvey,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const surveyId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const questionId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
const now = new Date('2026-05-12T00:00:00.000Z');

const choices = [
  { id: 'a', text: 'Too slow' },
  { id: 'b', text: 'Just right' },
  { id: 'c', text: 'Too fast' },
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

const sampleSurvey = () => ({
  id: surveyId,
  tenantId,
  courseId,
  title: 'End-of-term reflection',
  description: null,
  status: 'published',
  opensAt: null,
  closesAt: null,
  allowsAnonymousResponses: true,
  createdAt: now,
  updatedAt: now,
});

const sampleQuestion = () => ({
  id: questionId,
  tenantId,
  surveyId,
  position: 0,
  questionType: 'single_choice',
  prompt: 'How did the pacing feel?',
  required: true,
  choices,
  createdAt: now,
  updatedAt: now,
});

const duplicatePositionError = (): unknown => ({
  code: '23505',
  constraint_name: 'survey_question_tenant_survey_position_uq',
});

describe('survey question API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getSurveyForCourse.mockResolvedValue(sampleSurvey());
    coreMocks.listSurveyQuestionsForSurvey.mockResolvedValue([sampleQuestion()]);
    coreMocks.createSurveyQuestion.mockResolvedValue(sampleQuestion());
    configureCourseAccess('student', 'student');
  });

  it('lists survey questions for any course member', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listSurveyQuestions(actorUserId, tenantId, courseId, surveyId),
    ).resolves.toMatchObject([{ id: questionId, prompt: 'How did the pacing feel?' }]);

    expect(coreMocks.listSurveyQuestionsForSurvey).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      surveyId,
    });
  });

  it('returns not found when the survey does not belong to the course on list', async () => {
    coreMocks.getSurveyForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listSurveyQuestions(actorUserId, tenantId, courseId, surveyId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Survey was not found in this course. Check the survey id and retry the request.',
    });

    expect(coreMocks.listSurveyQuestionsForSurvey).not.toHaveBeenCalled();
  });

  it('creates survey questions for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createSurveyQuestion(actorUserId, tenantId, courseId, surveyId, {
        position: 0,
        questionType: 'single_choice',
        prompt: 'How did the pacing feel?',
        required: true,
        choices,
      }),
    ).resolves.toMatchObject({
      id: questionId,
      surveyId,
      questionType: 'single_choice',
    });

    expect(coreMocks.createSurveyQuestion).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      surveyId,
      position: 0,
      questionType: 'single_choice',
      prompt: 'How did the pacing feel?',
      required: true,
      choices,
    });
  });

  it('allows tenant staff without course membership to create survey questions', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createSurveyQuestion(actorUserId, tenantId, courseId, surveyId, {
      position: 1,
      questionType: 'free_text',
      prompt: 'Anything else you would like the instructor to know?',
      required: false,
      choices: [],
    });

    expect(coreMocks.createSurveyQuestion).toHaveBeenCalledTimes(1);
  });

  it('rejects students creating survey questions', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createSurveyQuestion(actorUserId, tenantId, courseId, surveyId, {
        position: 0,
        questionType: 'single_choice',
        prompt: 'How did the pacing feel?',
        required: true,
        choices,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can author survey questions. Ask an instructor for access.',
    });

    expect(coreMocks.createSurveyQuestion).not.toHaveBeenCalled();
  });

  it('returns not found when the survey does not belong to the course on create', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.getSurveyForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.createSurveyQuestion(actorUserId, tenantId, courseId, surveyId, {
        position: 0,
        questionType: 'single_choice',
        prompt: 'How did the pacing feel?',
        required: true,
        choices,
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Survey was not found in this course. Check the survey id and retry the request.',
    });

    expect(coreMocks.createSurveyQuestion).not.toHaveBeenCalled();
  });

  it('maps duplicate positions to a conflict', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createSurveyQuestion.mockRejectedValue(duplicatePositionError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createSurveyQuestion(actorUserId, tenantId, courseId, surveyId, {
        position: 0,
        questionType: 'single_choice',
        prompt: 'How did the pacing feel?',
        required: true,
        choices,
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'Survey question position is already used. Choose a unique position and retry the request.',
    });
  });
});
