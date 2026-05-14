import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  dbHandle: { db: {} },
  createDbHandle: vi.fn(),
  getQuestionBankForCourse: vi.fn(),
  listQuestionBankQuestionsForBank: vi.fn(),
  listQuestionBanksForCourse: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    getQuestionBankForCourse: coreMocks.getQuestionBankForCourse,
    listQuestionBankQuestionsForBank: coreMocks.listQuestionBankQuestionsForBank,
    listQuestionBanksForCourse: coreMocks.listQuestionBanksForCourse,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE80';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE81';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE82';
const questionBankId = '01J9QW7B6N5W2YH3D3A1V0KE83';

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

describe('question bank API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.getQuestionBankForCourse.mockResolvedValue({ id: questionBankId });
    coreMocks.listQuestionBankQuestionsForBank.mockResolvedValue([]);
    coreMocks.listQuestionBanksForCourse.mockResolvedValue([]);
    configureCourseAccess('student', 'instructor');
  });

  it('lists active and archived question banks for course staff', async () => {
    const dependencies = createDependencies();

    await expect(dependencies.listQuestionBanks(actorUserId, tenantId, courseId)).resolves.toEqual(
      [],
    );

    expect(coreMocks.listQuestionBanksForCourse).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      statuses: ['active', 'archived'],
    });
  });

  it('rejects question bank listing for students', async () => {
    configureCourseAccess('student', 'student');
    const dependencies = createDependencies();

    await expect(
      dependencies.listQuestionBanks(actorUserId, tenantId, courseId),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can view question banks. Ask an instructor for access.',
    });

    expect(coreMocks.listQuestionBanksForCourse).not.toHaveBeenCalled();
  });

  it('lists question bank questions after confirming the bank belongs to the course', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.listQuestionBankQuestions(actorUserId, tenantId, courseId, questionBankId),
    ).resolves.toEqual([]);

    expect(coreMocks.getQuestionBankForCourse).toHaveBeenCalledWith(
      coreMocks.dbHandle.db,
      tenantId,
      courseId,
      questionBankId,
    );
    expect(coreMocks.listQuestionBankQuestionsForBank).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      questionBankId,
    });
  });

  it('hides question bank questions when the bank is outside the course', async () => {
    coreMocks.getQuestionBankForCourse.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.listQuestionBankQuestions(actorUserId, tenantId, courseId, questionBankId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Question bank was not found in this course. Check the question bank id and retry the request.',
    });

    expect(coreMocks.listQuestionBankQuestionsForBank).not.toHaveBeenCalled();
  });
});
