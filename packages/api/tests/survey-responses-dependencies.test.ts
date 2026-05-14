import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createSurveyResponse: vi.fn(),
  dbHandle: { db: {} },
  getSurveyForCourse: vi.fn(),
  getSurveyQuestionForSurvey: vi.fn(),
  listSurveyResponsesForSurvey: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createSurveyResponse: coreMocks.createSurveyResponse,
    getSurveyForCourse: coreMocks.getSurveyForCourse,
    getSurveyQuestionForSurvey: coreMocks.getSurveyQuestionForSurvey,
    listSurveyResponsesForSurvey: coreMocks.listSurveyResponsesForSurvey,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const surveyId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const surveyQuestionId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
const responseId = '01J9QW7B6N5W2YH3D3A1V0KE8B';
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

const sampleSurvey = (overrides: Partial<{ allowsAnonymousResponses: boolean }> = {}) => ({
  id: surveyId,
  tenantId,
  courseId,
  title: 'End-of-term reflection',
  description: null,
  status: 'published',
  opensAt: null,
  closesAt: null,
  allowsAnonymousResponses: overrides.allowsAnonymousResponses ?? true,
  createdAt: now,
  updatedAt: now,
});

const sampleQuestion = () => ({
  id: surveyQuestionId,
  tenantId,
  surveyId,
  position: 0,
  questionType: 'single_choice',
  prompt: 'How did the pacing feel?',
  required: true,
  choices: [
    { id: 'a', text: 'Too slow' },
    { id: 'b', text: 'Just right' },
    { id: 'c', text: 'Too fast' },
  ],
  createdAt: now,
  updatedAt: now,
});

describe('survey response API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getSurveyForCourse.mockResolvedValue(sampleSurvey());
    coreMocks.getSurveyQuestionForSurvey.mockResolvedValue(sampleQuestion());
    coreMocks.listSurveyResponsesForSurvey.mockResolvedValue([]);
    coreMocks.createSurveyResponse.mockImplementation((_db, input) => ({
      id: responseId,
      tenantId: input.tenantId,
      surveyId: input.surveyId,
      surveyQuestionId: input.surveyQuestionId,
      respondentId: input.respondentId,
      answer: input.answer,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    }));
    configureCourseAccess('student', 'student');
  });

  it('lists survey responses for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.listSurveyResponses(actorUserId, tenantId, courseId, surveyId);

    expect(coreMocks.listSurveyResponsesForSurvey).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      surveyId,
    });
  });

  it('rejects students listing survey responses', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listSurveyResponses(actorUserId, tenantId, courseId, surveyId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can view survey responses. Ask an instructor for access.',
    });

    expect(coreMocks.listSurveyResponsesForSurvey).not.toHaveBeenCalled();
  });

  it('returns not found when the survey does not belong to the course on list', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getSurveyForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listSurveyResponses(actorUserId, tenantId, courseId, surveyId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Survey was not found in this course. Check the survey id and retry the request.',
    });

    expect(coreMocks.listSurveyResponsesForSurvey).not.toHaveBeenCalled();
  });

  it('records anonymous responses with null respondent when the survey allows anonymity', async () => {
    const dependencies = createDependencies();

    await dependencies.submitSurveyResponse(actorUserId, tenantId, courseId, surveyId, {
      surveyQuestionId,
      answer: { kind: 'single_choice', choiceId: 'b' },
    });

    expect(coreMocks.createSurveyResponse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      surveyId,
      surveyQuestionId,
      respondentId: null,
      answer: { kind: 'single_choice', choiceId: 'b' },
    });
  });

  it('records identified responses when the survey forbids anonymity', async () => {
    coreMocks.getSurveyForCourse.mockResolvedValue(
      sampleSurvey({ allowsAnonymousResponses: false }),
    );
    const dependencies = createDependencies();

    await dependencies.submitSurveyResponse(actorUserId, tenantId, courseId, surveyId, {
      surveyQuestionId,
      answer: { kind: 'free_text', text: 'I liked the pacing.' },
    });

    expect(coreMocks.createSurveyResponse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      surveyId,
      surveyQuestionId,
      respondentId: actorUserId,
      answer: { kind: 'free_text', text: 'I liked the pacing.' },
    });
  });

  it('rejects responses when the question does not belong to the survey', async () => {
    coreMocks.getSurveyQuestionForSurvey.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.submitSurveyResponse(actorUserId, tenantId, courseId, surveyId, {
        surveyQuestionId,
        answer: { kind: 'single_choice', choiceId: 'b' },
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Survey question was not found in this survey. Check the question id and retry the request.',
    });

    expect(coreMocks.createSurveyResponse).not.toHaveBeenCalled();
  });

  it('returns not found when the survey does not belong to the course on submit', async () => {
    coreMocks.getSurveyForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.submitSurveyResponse(actorUserId, tenantId, courseId, surveyId, {
        surveyQuestionId,
        answer: { kind: 'single_choice', choiceId: 'b' },
      }),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Survey was not found in this course. Check the survey id and retry the request.',
    });

    expect(coreMocks.createSurveyResponse).not.toHaveBeenCalled();
  });
});
