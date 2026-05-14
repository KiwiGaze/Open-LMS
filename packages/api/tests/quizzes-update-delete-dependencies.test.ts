import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteQuiz: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateQuiz: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteQuiz: coreMocks.deleteQuiz,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateQuiz: coreMocks.updateQuiz,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KE87';
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
  title: 'Argumentation quiz (updated)',
  description: 'Refreshed description.',
  status: 'published',
  opensAt: null,
  closesAt: null,
  timeLimitMinutes: 30,
  shuffleQuestions: true,
  maxAttempts: 2,
  createdAt: now,
  updatedAt: now,
});

const updateInput = {
  moduleId: null,
  unitId: null,
  position: null,
  title: 'Argumentation quiz (updated)',
  description: 'Refreshed description.',
  status: 'published' as const,
  opensAt: null,
  closesAt: null,
  timeLimitMinutes: 30,
  shuffleQuestions: true,
  maxAttempts: 2,
};

describe('quiz update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateQuiz.mockResolvedValue(sampleQuiz());
    coreMocks.deleteQuiz.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a quiz for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateQuiz(actorUserId, tenantId, courseId, quizId, updateInput),
    ).resolves.toMatchObject({ id: quizId, status: 'published', maxAttempts: 2 });

    expect(coreMocks.updateQuiz).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      quizId,
      ...updateInput,
    });
  });

  it('returns not found when updating a missing quiz', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateQuiz.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateQuiz(actorUserId, tenantId, courseId, quizId, updateInput),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Quiz was not found in this course. Check the quiz id and retry the request.',
    });
  });

  it('returns bad_request when update references missing module', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateQuiz.mockRejectedValue({
      code: '23503',
      constraint_name: 'quiz_tenant_module_fk',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateQuiz(actorUserId, tenantId, courseId, quizId, updateInput),
    ).rejects.toMatchObject({ code: 'bad_request' });
  });

  it('rejects students from updating quizzes', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateQuiz(actorUserId, tenantId, courseId, quizId, updateInput),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateQuiz).not.toHaveBeenCalled();
  });

  it('deletes a quiz for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteQuiz(actorUserId, tenantId, courseId, quizId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteQuiz).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      quizId,
    });
  });

  it('returns not found when deleting a missing quiz', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteQuiz.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteQuiz(actorUserId, tenantId, courseId, quizId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Quiz was not found in this course. Check the quiz id and retry the request.',
    });
  });

  it('rejects students from deleting quizzes', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteQuiz(actorUserId, tenantId, courseId, quizId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteQuiz).not.toHaveBeenCalled();
  });
});
