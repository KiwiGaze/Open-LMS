import type { CourseRole, TenantRole } from '@openlms/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiDependencies } from '../src/dependencies.ts';

const coreMocks = vi.hoisted(() => ({
  createDbHandle: vi.fn(),
  dbHandle: { db: {} },
  deleteLearningObjective: vi.fn(),
  listUserCourseMemberships: vi.fn(),
  listUserTenantMemberships: vi.fn(),
  updateLearningObjective: vi.fn(),
}));

vi.mock('@openlms/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@openlms/core')>();

  return {
    ...actual,
    createDbHandle: coreMocks.createDbHandle,
    deleteLearningObjective: coreMocks.deleteLearningObjective,
    listUserCourseMemberships: coreMocks.listUserCourseMemberships,
    listUserTenantMemberships: coreMocks.listUserTenantMemberships,
    updateLearningObjective: coreMocks.updateLearningObjective,
  };
});

const actorUserId = '01J9QW7B6N5W2YH3D3A1V0KE84';
const tenantId = '01J9QW7B6N5W2YH3D3A1V0KE85';
const courseId = '01J9QW7B6N5W2YH3D3A1V0KE86';
const learningObjectiveId = '01J9QW7B6N5W2YH3D3A1V0KE89';
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

const sampleObjective = () => ({
  id: learningObjectiveId,
  tenantId,
  courseId,
  code: 'LO-1-updated',
  title: 'Construct evidence-based arguments (updated)',
  description: 'Refreshed description.',
  status: 'active',
  position: 0,
  createdAt: now,
  updatedAt: now,
});

const updateInput = {
  code: 'LO-1-updated',
  title: 'Construct evidence-based arguments (updated)',
  description: 'Refreshed description.',
  status: 'active' as const,
  position: 0,
};

describe('learning objective update + delete API dependency authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreMocks.createDbHandle.mockReturnValue(coreMocks.dbHandle);
    coreMocks.updateLearningObjective.mockResolvedValue(sampleObjective());
    coreMocks.deleteLearningObjective.mockResolvedValue(true);
    configureCourseAccess('student', 'student');
  });

  it('updates a learning objective for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.updateLearningObjective(
        actorUserId,
        tenantId,
        courseId,
        learningObjectiveId,
        updateInput,
      ),
    ).resolves.toMatchObject({ id: learningObjectiveId, code: 'LO-1-updated' });

    expect(coreMocks.updateLearningObjective).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      learningObjectiveId,
      code: 'LO-1-updated',
      title: 'Construct evidence-based arguments (updated)',
      description: 'Refreshed description.',
      status: 'active',
      position: 0,
    });
  });

  it('returns not found when updating a missing learning objective', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateLearningObjective.mockResolvedValue(null);
    const dependencies = createDependencies();

    await expect(
      dependencies.updateLearningObjective(
        actorUserId,
        tenantId,
        courseId,
        learningObjectiveId,
        updateInput,
      ),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Learning objective was not found. Check the objective id and retry the request.',
    });
  });

  it('returns conflict when updating to a duplicate code', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.updateLearningObjective.mockRejectedValue({
      code: '23505',
      constraint_name: 'learning_objective_tenant_course_code_uq',
    });
    const dependencies = createDependencies();

    await expect(
      dependencies.updateLearningObjective(
        actorUserId,
        tenantId,
        courseId,
        learningObjectiveId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('rejects students from updating learning objectives', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.updateLearningObjective(
        actorUserId,
        tenantId,
        courseId,
        learningObjectiveId,
        updateInput,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.updateLearningObjective).not.toHaveBeenCalled();
  });

  it('deletes a learning objective for course staff', async () => {
    configureCourseAccess('student', 'instructor');
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteLearningObjective(actorUserId, tenantId, courseId, learningObjectiveId),
    ).resolves.toBeUndefined();

    expect(coreMocks.deleteLearningObjective).toHaveBeenCalledWith(coreMocks.dbHandle.db, {
      tenantId,
      courseId,
      learningObjectiveId,
    });
  });

  it('returns not found when deleting a missing learning objective', async () => {
    configureCourseAccess('institution_admin', null);
    coreMocks.deleteLearningObjective.mockResolvedValue(false);
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteLearningObjective(actorUserId, tenantId, courseId, learningObjectiveId),
    ).rejects.toMatchObject({
      code: 'not_found',
      message: 'Learning objective was not found. Check the objective id and retry the request.',
    });
  });

  it('rejects students from deleting learning objectives', async () => {
    const dependencies = createDependencies();

    await expect(
      dependencies.deleteLearningObjective(actorUserId, tenantId, courseId, learningObjectiveId),
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(coreMocks.deleteLearningObjective).not.toHaveBeenCalled();
  });
});
