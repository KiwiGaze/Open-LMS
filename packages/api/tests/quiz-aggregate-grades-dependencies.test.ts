import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  getQuizForCourse: vi.fn(),
  listQuizAttemptsForQuiz: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getQuizForCourse: coreMocks.getQuizForCourse,
    listQuizAttemptsForQuiz: coreMocks.listQuizAttemptsForQuiz,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE60';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE61';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE62';
const quizId = '01J9QW7B6N5W2YH3D3A1V0KE63';
const studentA = '01J9QW7B6N5W2YH3D3A1V0KE64';
const studentB = '01J9QW7B6N5W2YH3D3A1V0KE65';
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

const sampleQuiz = (gradingMethod: 'best' | 'last' | 'first' | 'average' = 'best') => ({
  id: quizId,
  tenantId,
  courseId,
  moduleId: null,
  unitId: null,
  position: null,
  title: 'Quiz 1',
  description: null,
  status: 'published' as const,
  opensAt: null,
  closesAt: null,
  timeLimitMinutes: null,
  shuffleQuestions: false,
  maxAttempts: 3,
  gradingMethod,
  createdAt: now,
  updatedAt: now,
});

const attempt = (studentId: string, attemptNumber: number, score: number | null) => ({
  id: `att-${studentId}-${attemptNumber}`,
  tenantId,
  quizId,
  studentId,
  attemptNumber,
  status: 'graded' as const,
  startedAt: now,
  submittedAt: now,
  score,
  createdAt: now,
  updatedAt: now,
});

describe('quiz aggregate grades API dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getQuizForCourse.mockResolvedValue(sampleQuiz('best'));
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([
      attempt(studentA, 1, 7),
      attempt(studentA, 2, 9),
      attempt(studentB, 1, 5),
    ]);
  });

  it('returns aggregated grades for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    const grades = await dependencies.listQuizAggregateGrades(
      actorUserId,
      tenantId,
      courseId,
      quizId,
    );

    expect(grades).toEqual([
      expect.objectContaining({
        studentId: studentA,
        aggregateScore: 9,
        attemptCount: 2,
        gradingMethod: 'best',
      }),
      expect.objectContaining({
        studentId: studentB,
        aggregateScore: 5,
        attemptCount: 1,
      }),
    ]);
  });

  it('uses the quiz gradingMethod (average) when configured', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getQuizForCourse.mockResolvedValue(sampleQuiz('average'));
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([
      attempt(studentA, 1, 6),
      attempt(studentA, 2, 10),
    ]);
    const dependencies = createDependencies();

    const grades = await dependencies.listQuizAggregateGrades(
      actorUserId,
      tenantId,
      courseId,
      quizId,
    );

    expect(grades[0]).toMatchObject({ studentId: studentA, aggregateScore: 8 });
  });

  it('rejects students with forbidden', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.listQuizAggregateGrades(actorUserId, tenantId, courseId, quizId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.listQuizAttemptsForQuiz).not.toHaveBeenCalled();
  });

  it('returns not_found when the quiz does not exist', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.getQuizForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listQuizAggregateGrades(actorUserId, tenantId, courseId, quizId),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('returns an empty list when no attempts exist', async () => {
    configureCourseAccess('student', 'instructor');
    coreMocks.listQuizAttemptsForQuiz.mockResolvedValue([]);
    const dependencies = createDependencies();

    const grades = await dependencies.listQuizAggregateGrades(
      actorUserId,
      tenantId,
      courseId,
      quizId,
    );

    expect(grades).toEqual([]);
  });
});
