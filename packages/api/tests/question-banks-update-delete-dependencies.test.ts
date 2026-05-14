import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteQuestionBank: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateQuestionBank: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteQuestionBank: coreMocks.deleteQuestionBank,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateQuestionBank: coreMocks.updateQuestionBank,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const questionBankId = '01J9QW7B6N5W2YH3D3A1V0KE87';
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

const sampleBank = () => ({
  id: questionBankId,
  tenantId,
  courseId,
  title: 'Argumentation question bank (updated)',
  description: 'Refreshed description.',
  status: 'archived',
  createdAt: now,
  updatedAt: now,
});

const updateInput = {
  title: 'Argumentation question bank (updated)',
  description: 'Refreshed description.',
  status: 'archived' as const,
};

describe('question bank update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateQuestionBank.mockResolvedValue(sampleBank());
    coreMocks.deleteQuestionBank.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a question bank for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateQuestionBank(actorUserId, tenantId, courseId, questionBankId, updateInput),
    ).resolves.toMatchObject({ id: questionBankId, status: 'archived' });

    expect(coreMocks.updateQuestionBank).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      questionBankId,
      ...updateInput,
    });
  });

  it('returns not found when updating a missing question bank', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateQuestionBank.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateQuestionBank(actorUserId, tenantId, courseId, questionBankId, updateInput),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Question bank was not found in this course. Check the question bank id and retry the request.',
    });
  });

  it('rejects students from updating question banks', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateQuestionBank(actorUserId, tenantId, courseId, questionBankId, updateInput),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateQuestionBank).not.toHaveBeenCalled();
  });

  it('deletes a question bank for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteQuestionBank(actorUserId, tenantId, courseId, questionBankId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteQuestionBank).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      questionBankId,
    });
  });

  it('returns not found when deleting a missing question bank', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteQuestionBank.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteQuestionBank(actorUserId, tenantId, courseId, questionBankId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message:
        'Question bank was not found in this course. Check the question bank id and retry the request.',
    });
  });

  it('rejects students from deleting question banks', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteQuestionBank(actorUserId, tenantId, courseId, questionBankId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteQuestionBank).not.toHaveBeenCalled();
  });
});
