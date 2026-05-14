import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createSurvey: vi.fn(),
  dbHandle: { db: {} },
  listSurveysForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createSurvey: coreMocks.createSurvey,
    listSurveysForCourse: coreMocks.listSurveysForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const surveyId = '01J9QW7B6N5W2YH3D3A1V0KE89';
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

const missingCourseSurveyError = (): unknown => ({
  code: '23503',
  constraint_name: 'survey_tenant_course_fk',
});

const sampleSurvey = () => ({
  id: surveyId,
  tenantId,
  courseId,
  title: 'End-of-term reflection',
  description: 'Anonymous feedback on workshop pacing.',
  status: 'published',
  opensAt: null,
  closesAt: null,
  allowsAnonymousResponses: true,
  createdAt: now,
  updatedAt: now,
});

describe('survey API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.listSurveysForCourse.mockResolvedValue([sampleSurvey()]);
    coreMocks.createSurvey.mockResolvedValue(sampleSurvey());
    configureCourseAccess('student', 'student');
  });

  it('lists surveys for any course member', async () => {
    const dependencies = createDependencies();

    await expect(dependencies.listSurveys(actorUserId, tenantId, courseId)).resolves.toMatchObject([
      { id: surveyId, title: 'End-of-term reflection' },
    ]);

    expect(coreMocks.listSurveysForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
    });
  });

  it('rejects survey listing for users outside the course', async () => {
    configureCourseAccess('student', null);
    const dependencies = createDependencies();

    await expect(dependencies.listSurveys(actorUserId, tenantId, courseId)).rejects.toMatchObject({
      code: 'forbidden',
    });

    expect(coreMocks.listSurveysForCourse).not.toHaveBeenCalled();
  });

  it('creates surveys for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createSurvey(actorUserId, tenantId, courseId, {
        title: 'End-of-term reflection',
        description: 'Anonymous feedback on workshop pacing.',
        status: 'published',
        opensAt: null,
        closesAt: null,
        allowsAnonymousResponses: true,
      }),
    ).resolves.toMatchObject({
      id: surveyId,
      title: 'End-of-term reflection',
      status: 'published',
    });

    expect(coreMocks.createSurvey).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      title: 'End-of-term reflection',
      description: 'Anonymous feedback on workshop pacing.',
      status: 'published',
      opensAt: null,
      closesAt: null,
      allowsAnonymousResponses: true,
    });
  });

  it('allows tenant staff without course membership to create surveys', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createSurvey(actorUserId, tenantId, courseId, {
      title: 'Draft midterm feedback',
      description: null,
      status: 'draft',
      opensAt: null,
      closesAt: null,
      allowsAnonymousResponses: false,
    });

    expect(coreMocks.createSurvey).toHaveBeenCalledTimes(1);
  });

  it('rejects students creating surveys', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createSurvey(actorUserId, tenantId, courseId, {
        title: 'End-of-term reflection',
        description: null,
        status: 'draft',
        opensAt: null,
        closesAt: null,
        allowsAnonymousResponses: true,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create surveys. Ask an instructor for access.',
    });

    expect(coreMocks.createSurvey).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createSurvey.mockRejectedValue(missingCourseSurveyError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createSurvey(actorUserId, tenantId, courseId, {
        title: 'End-of-term reflection',
        description: null,
        status: 'draft',
        opensAt: null,
        closesAt: null,
        allowsAnonymousResponses: true,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });
});
