import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createQuizOverride: vi.fn(),
  dbHandle: { db: {} },
  getQuizAccessControlsForCourse: vi.fn(),
  getQuizForCourse: vi.fn(),
  listCourseGroupMembershipsForUser: vi.fn(),
  listQuizAttemptsForQuiz: vi.fn(),
  listQuizOverridesForQuiz: vi.fn(),
  listSectionMembershipsForStudent: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  recordQuizAttempt: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createQuizOverride: coreMocks.createQuizOverride,
    getQuizAccessControlsForCourse: coreMocks.getQuizAccessControlsForCourse,
    getQuizForCourse: coreMocks.getQuizForCourse,
    listCourseGroupMembershipsForUser: coreMocks.listCourseGroupMembershipsForUser,
    listQuizAttemptsForQuiz: coreMocks.listQuizAttemptsForQuiz,
    listQuizOverridesForQuiz: coreMocks.listQuizOverridesForQuiz,
    listSectionMembershipsForStudent: coreMocks.listSectionMembershipsForStudent,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    recordQuizAttempt: coreMocks.recordQuizAttempt,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KEC0';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KEC1';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KEC2';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KEC3';
const quizOverrideId = '01J9QW7B6N5W2YH3D3A1V0KEC4';
const attemptId = '01J9QW7B6N5W2YH3D3A1V0KEC5';
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
  timeLimitMinutes: 30,
  maxAttempts: 1,
};

const quizOverride = {
  id: quizOverrideId,
  tenantId,
  quizId,
  targetType: 'user' as const,
  targetId: actorUserId,
  opensAt: null,
  closesAt: null,
  timeLimitMinutes: 60,
  maxAttempts: 2,
  status: 'active' as const,
  createdAt: now,
  updatedAt: now,
};

const submittedAttempt = {
  id: attemptId,
  tenantId,
  quizId,
  studentId: actorUserId,
  attemptNumber: 1,
  status: 'submitted' as const,
  startedAt: now,
  submittedAt: now,
  score: null,
  createdAt: now,
  updatedAt: now,
};

describe('quiz override API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createQuizOverride.mockResolvedValue(quizOverride);
    coreMocks.getQuizAccessControlsForCourse.mockResolvedValue({
      accessPasswordHash: null,
      allowedIpRanges: [],
    });
    coreMocks.getQuizForCourse.mockResolvedValue(quiz);
    coreMocks.listCourseGroupMembershipsForUser.mockResolvedValue([]);
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([]);
    coreMocks.listQuizOverridesForQuiz.mockResolvedValue([quizOverride]);
    coreMocks.listSectionMembershipsForStudent.mockResolvedValue([]);
    coreMocks.recordQuizAttempt.mockResolvedValue({
      ...submittedAttempt,
      status: 'in_progress',
      attemptNumber: 2,
    });
    configureCourseAccess('student', 'instructor');
  });

  it('lists quiz overrides for course staff', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listQuizOverrides(actorUserId, tenantId, courseId, quizId),
    ).resolves.toEqual([quizOverride]);

    expect(coreMocks.listQuizOverridesForQuiz).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      quizId,
      statuses: ['active', 'archived'],
    });
  });

  it('creates quiz overrides for course staff', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuizOverride(actorUserId, tenantId, courseId, quizId, {
        targetType: 'user',
        targetId: actorUserId,
        opensAt: null,
        closesAt: null,
        timeLimitMinutes: 60,
        maxAttempts: 2,
        status: 'active',
      }),
    ).resolves.toEqual(quizOverride);

    expect(coreMocks.createQuizOverride).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      quizId,
      targetType: 'user',
      targetId: actorUserId,
      opensAt: null,
      closesAt: null,
      timeLimitMinutes: 60,
      maxAttempts: 2,
      status: 'active',
    });
  });

  it('resolves learner effective settings from matching active overrides', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.getQuizEffectiveSettings(actorUserId, tenantId, courseId, quizId),
    ).resolves.toEqual({
      quizId,
      opensAt: null,
      closesAt: null,
      timeLimitMinutes: 60,
      maxAttempts: 2,
    });
  });

  it('uses an override maxAttempts when starting learner attempts', async () => {
    configureCourseAccess('student', 'student');
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([submittedAttempt]);
    const dependencies = createDependencies();

    await expect(
      dependencies.startQuizAttempt(actorUserId, tenantId, courseId, quizId),
    ).resolves.toMatchObject({ status: 'in_progress', attemptNumber: 2 });

    expect(coreMocks.recordQuizAttempt).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      quizId,
      studentId: actorUserId,
      attemptNumber: 2,
    });
  });

  it('rejects quiz overrides for users outside the course', async () => {
    const outsideUserId = '01J9QW7B6N5W2YH3D3A1V0KEC6';
    coreMocks.listUserCourseMemberships.mockImplementation(async (_db, userId: string) =>
      userId === actorUserId ? [{ tenantId, courseId, role: 'instructor' }] : [],
    );
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuizOverride(actorUserId, tenantId, courseId, quizId, {
        targetType: 'user',
        targetId: outsideUserId,
        opensAt: null,
        closesAt: null,
        timeLimitMinutes: 60,
        maxAttempts: 2,
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message:
        'Quiz override target user is not enrolled in this course. Choose a course member and retry.',
    });

    expect(coreMocks.createQuizOverride).not.toHaveBeenCalled();
  });

  it('rejects quiz override creation for students', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuizOverride(actorUserId, tenantId, courseId, quizId, {
        targetType: 'user',
        targetId: actorUserId,
        opensAt: null,
        closesAt: null,
        timeLimitMinutes: 60,
        maxAttempts: 2,
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create quiz overrides. Ask an instructor for access.',
    });

    expect(coreMocks.createQuizOverride).not.toHaveBeenCalled();
  });
});
