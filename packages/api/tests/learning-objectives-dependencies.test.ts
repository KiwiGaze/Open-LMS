import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  createLearningObjective: vi.fn(),
  dbHandle: { db: {} },
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    createLearningObjective: coreMocks.createLearningObjective,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE88';
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

const missingLearningObjectiveCourseError = (): unknown => ({
  code: '23503',
  constraint_name: 'learning_objective_tenant_course_fk',
});

const duplicateLearningObjectiveCodeError = (): unknown => ({
  code: '23505',
  constraint_name: 'learning_objective_tenant_course_code_uq',
});

describe('learning objective API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.createLearningObjective.mockResolvedValue({
      id: learningObjectiveId,
      tenantId,
      courseId,
      code: 'LO-1',
      title: 'Construct evidence-based arguments',
      description: 'Students can defend claims with cited evidence.',
      status: 'active',
      position: 0,
      createdAt: now,
      updatedAt: now,
    });
    configureCourseAccess('student', 'student');
  });

  it('creates learning objectives for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.createLearningObjective(actorUserId, tenantId, courseId, {
        code: 'LO-1',
        title: 'Construct evidence-based arguments',
        description: 'Students can defend claims with cited evidence.',
        status: 'active',
        position: 0,
      }),
    ).resolves.toMatchObject({
      id: learningObjectiveId,
      courseId,
      code: 'LO-1',
      title: 'Construct evidence-based arguments',
      status: 'active',
    });

    expect(coreMocks.createLearningObjective).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      code: 'LO-1',
      title: 'Construct evidence-based arguments',
      description: 'Students can defend claims with cited evidence.',
      status: 'active',
      position: 0,
    });
  });

  it('allows tenant staff without course membership to create learning objectives', async () => {
    configureCourseAccess('institution_admin', null);
    const dependencies = createDependencies();

    await dependencies.createLearningObjective(actorUserId, tenantId, courseId, {
      code: 'LO-DRAFT',
      title: 'Draft objective under review',
      description: null,
      status: 'draft',
      position: 1,
    });

    expect(coreMocks.createLearningObjective).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      code: 'LO-DRAFT',
      title: 'Draft objective under review',
      description: null,
      status: 'draft',
      position: 1,
    });
  });

  it('rejects students creating learning objectives', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.createLearningObjective(actorUserId, tenantId, courseId, {
        code: 'LO-1',
        title: 'Construct evidence-based arguments',
        description: 'Students can defend claims with cited evidence.',
        status: 'active',
        position: 0,
      }),
    ).rejects.toMatchObject({
      code: 'forbidden',
      message: 'Only course staff can create learning objectives. Ask an instructor for access.',
    });

    expect(coreMocks.createLearningObjective).not.toHaveBeenCalled();
  });

  it('maps missing courses to a bad request', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createLearningObjective.mockRejectedValue(missingLearningObjectiveCourseError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createLearningObjective(actorUserId, tenantId, courseId, {
        code: 'LO-1',
        title: 'Construct evidence-based arguments',
        description: 'Students can defend claims with cited evidence.',
        status: 'active',
        position: 0,
      }),
    ).rejects.toMatchObject({
      code: 'bad_request',
      message: 'Course was not found in this tenant. Check the course id and retry the request.',
    });
  });

  it('maps duplicate codes to a conflict', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.createLearningObjective.mockRejectedValue(duplicateLearningObjectiveCodeError());
    const dependencies = createDependencies();

    await expect(
      dependencies.createLearningObjective(actorUserId, tenantId, courseId, {
        code: 'LO-1',
        title: 'Construct evidence-based arguments',
        description: 'Students can defend claims with cited evidence.',
        status: 'active',
        position: 0,
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
      message:
        'Learning objective code already exists in this course. Choose a unique code and retry the request.',
    });
  });
});
