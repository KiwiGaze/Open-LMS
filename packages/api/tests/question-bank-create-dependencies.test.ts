import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createQuestionBank: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createQuestionBank: coreMocks.createQuestionBank,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const questionBankId = '01J9QW7B6N5W2YH3D3A1V0KE77';
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
  constraint_name: 'question_bank_tenant_course_fk',
});

describe('question bank creation API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createQuestionBank.mockResolvedValue({
      id: questionBankId,
      tenantId,
      courseId,
      title: 'Argumentation question bank',
      description: 'Multiple-choice and short-response items aligned to LO-1.',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates question banks for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuestionBank(actorUserId, tenantId, courseId, {
        title: 'Argumentation question bank',
        description: 'Multiple-choice and short-response items aligned to LO-1.',
        status: 'active',
      }),
    ).resolves.toMatchObject({
      id: questionBankId,
      courseId,
      title: 'Argumentation question bank',
      status: 'active',
    });

    expect(coreMocks.createQuestionBank).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      title: 'Argumentation question bank',
      description: 'Multiple-choice and short-response items aligned to LO-1.',
      status: 'active',
    });
  });

  it('allows tenant staff without course membership to create question banks', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createQuestionBank(actorUserId, tenantId, courseId, {
      title: 'Archived bank',
      description: null,
      status: 'archived',
    });

    expect(coreMocks.createQuestionBank).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      title: 'Archived bank',
      description: null,
      status: 'archived',
    });
  });

  it('rejects students creating question banks', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuestionBank(actorUserId, tenantId, courseId, {
        title: 'Argumentation question bank',
        description: null,
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create question banks. Ask an instructor for access.',
    });

    expect(coreMocks.createQuestionBank).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createQuestionBank.mockRejectedValue(missingCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createQuestionBank(actorUserId, tenantId, courseId, {
        title: 'Argumentation question bank',
        description: null,
        status: 'active',
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });
});
