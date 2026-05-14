import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createQuiz: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createQuiz: coreMocks.createQuiz,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const moduleId = '01J9QW7B6N5W2YH3D3A1V0KE89';
const unitId = '01J9QW7B6N5W2YH3D3A1V0KE8A';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KE43';
const opensAt = new Date('2026-09-10T00:00:00.000Z');
const closesAt = new Date('2026-09-15T23:59:00.000Z');
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

const missingCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'quiz_tenant_course_fk',
});

const missingModuleError = (): unknown => ({
  code: '23503',
  constraint_name: 'quiz_tenant_module_fk',
});

const missingUnitError = (): unknown => ({
  code: '23503',
  constraint_name: 'quiz_tenant_unit_fk',
});

describe('quiz creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createQuiz.mockResolvedValue({
      id: quizId,
      tenantId,
      courseId,
      moduleId,
      unitId,
      position: 0,
      title: 'Argumentation quiz',
      description: 'Multiple-choice on evidence and reasoning.',
      status: 'published',
      opensAt,
      closesAt,
      timeLimitMinutes: 30,
      shuffleQuestions: true,
      maxAttempts: 2,
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates quizzes for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuiz(actorUserId, tenantId, courseId, {
        moduleId,
        unitId,
        position: 0,
        title: 'Argumentation quiz',
        description: 'Multiple-choice on evidence and reasoning.',
        status: 'published',
        opensAt,
        closesAt,
        timeLimitMinutes: 30,
        shuffleQuestions: true,
        maxAttempts: 2,
      }),
    ).resolves.toMatchObject({
      id: quizId,
      title: 'Argumentation quiz',
      status: 'published',
    });

    expect(coreMocks.createQuiz).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      moduleId,
      unitId,
      position: 0,
      title: 'Argumentation quiz',
      description: 'Multiple-choice on evidence and reasoning.',
      status: 'published',
      opensAt,
      closesAt,
      timeLimitMinutes: 30,
      shuffleQuestions: true,
      maxAttempts: 2,
      accessPasswordHash: null,
      allowedIpRanges: [],
    });
  });

  it('hashes quiz access passwords and persists allowed IP ranges', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await dependencies.createQuiz(actorUserId, tenantId, courseId, {
      moduleId,
      unitId,
      position: 0,
      title: 'Argumentation quiz',
      description: 'Multiple-choice on evidence and reasoning.',
      status: 'published',
      opensAt,
      closesAt,
      timeLimitMinutes: 30,
      shuffleQuestions: true,
      maxAttempts: 2,
      accessPassword: 'exam-room',
      allowedIpRanges: ['203.0.113.0/24'],
    });

    expect(coreMocks.createQuiz).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      moduleId,
      unitId,
      position: 0,
      title: 'Argumentation quiz',
      description: 'Multiple-choice on evidence and reasoning.',
      status: 'published',
      opensAt,
      closesAt,
      timeLimitMinutes: 30,
      shuffleQuestions: true,
      maxAttempts: 2,
      accessPasswordHash: expect.stringMatching(/^scrypt:v1:/),
      allowedIpRanges: ['203.0.113.0/24'],
    });
  });

  it('allows tenant staff to create top-level quizzes without parent refs', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createQuiz(actorUserId, tenantId, courseId, {
      moduleId: null,
      unitId: null,
      position: null,
      title: 'Draft quiz',
      description: null,
      status: 'draft',
      opensAt: null,
      closesAt: null,
      timeLimitMinutes: null,
      shuffleQuestions: false,
      maxAttempts: 1,
    });

    expect(coreMocks.createQuiz).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      moduleId: null,
      unitId: null,
      position: null,
      title: 'Draft quiz',
      description: null,
      status: 'draft',
      opensAt: null,
      closesAt: null,
      timeLimitMinutes: null,
      shuffleQuestions: false,
      maxAttempts: 1,
      accessPasswordHash: null,
      allowedIpRanges: [],
    });
  });

  it('rejects students creating quizzes', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuiz(actorUserId, tenantId, courseId, {
        moduleId,
        unitId,
        position: 0,
        title: 'Argumentation quiz',
        description: null,
        status: 'published',
        opensAt: null,
        closesAt: null,
        timeLimitMinutes: 30,
        shuffleQuestions: false,
        maxAttempts: 2,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create quizzes. Ask an instructor for access.',
    });

    expect(coreMocks.createQuiz).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createQuiz.mockRejectedValue(missingCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuiz(actorUserId, tenantId, courseId, {
        moduleId: null,
        unitId: null,
        position: null,
        title: 'Quiz',
        description: null,
        status: 'draft',
        opensAt: null,
        closesAt: null,
        timeLimitMinutes: null,
        shuffleQuestions: false,
        maxAttempts: 1,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('maps missing modules to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createQuiz.mockRejectedValue(missingModuleError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuiz(actorUserId, tenantId, courseId, {
        moduleId,
        unitId: null,
        position: 0,
        title: 'Quiz',
        description: null,
        status: 'draft',
        opensAt: null,
        closesAt: null,
        timeLimitMinutes: null,
        shuffleQuestions: false,
        maxAttempts: 1,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Course module was not found in this tenant. Check the module id and retry the request.',
    });
  });

  it('maps missing units to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createQuiz.mockRejectedValue(missingUnitError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuiz(actorUserId, tenantId, courseId, {
        moduleId,
        unitId,
        position: 0,
        title: 'Quiz',
        description: null,
        status: 'draft',
        opensAt: null,
        closesAt: null,
        timeLimitMinutes: null,
        shuffleQuestions: false,
        maxAttempts: 1,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course unit was not found in this tenant. Check the unit id and retry the request.',
    });
  });
});
