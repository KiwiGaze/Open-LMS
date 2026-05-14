import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteSurvey: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateSurvey: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteSurvey: coreMocks.deleteSurvey,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateSurvey: coreMocks.updateSurvey,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const surveyId = '01J9QW7B6N5W2YH3D3A1V0KE87';
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

const sampleSurvey = () => ({
  id: surveyId,
  tenantId,
  courseId,
  title: 'End-of-term reflection (updated)',
  description: 'Refreshed description.',
  status: 'published',
  opensAt: null,
  closesAt: null,
  allowsAnonymousResponses: false,
  createdAt: now,
  updatedAt: now,
});

const updateInput = {
  title: 'End-of-term reflection (updated)',
  description: 'Refreshed description.',
  status: 'published' as const,
  opensAt: null,
  closesAt: null,
  allowsAnonymousResponses: false,
};

describe('survey update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateSurvey.mockResolvedValue(sampleSurvey());
    coreMocks.deleteSurvey.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a survey for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateSurvey(actorUserId, tenantId, courseId, surveyId, updateInput),
    ).resolves.toMatchObject({ id: surveyId, status: 'published' });

    expect(coreMocks.updateSurvey).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      surveyId,
      ...updateInput,
    });
  });

  it('returns not found when updating a missing survey', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateSurvey.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateSurvey(actorUserId, tenantId, courseId, surveyId, updateInput),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Survey was not found in this course. Check the survey id and retry the request.',
    });
  });

  it('rejects students from updating surveys', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateSurvey(actorUserId, tenantId, courseId, surveyId, updateInput),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateSurvey).not.toHaveBeenCalled();
  });

  it('deletes a survey for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteSurvey(actorUserId, tenantId, courseId, surveyId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteSurvey).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      surveyId,
    });
  });

  it('returns not found when deleting a missing survey', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteSurvey.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteSurvey(actorUserId, tenantId, courseId, surveyId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Survey was not found in this course. Check the survey id and retry the request.',
    });
  });

  it('rejects students from deleting surveys', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteSurvey(actorUserId, tenantId, courseId, surveyId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteSurvey).not.toHaveBeenCalled();
  });
});
